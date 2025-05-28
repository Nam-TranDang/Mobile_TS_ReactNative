import express from "express";
import protectRoute from "../middleware/auth.middleware.js";
import isAdmin from "../middleware/admin.middleware.js";
import Report from "../models/report.js";
import Book from "../models/book.js";
import Comment from "../models/comment.js"; 
import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.js"; 
import sendEmail from "../lib/sendEmail.js"; 



const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
    try {
        const { reportedItemType, reportedItemId, reason, description } = req.body;
        const reporterId = req.user._id; // Lấy từ token qua protectRoute

        if (!reportedItemType || !reportedItemId || !reason) {
            return res.status(400).json({ message: "reportedItemType, reportedItemId, and reason are required." });
        }

        if (!["Book", "Comment"].includes(reportedItemType)) {
            return res.status(400).json({ message: "Invalid reportedItemType. Must be 'Book' or 'Comment'." });
        }
        let itemExists;
        if (reportedItemType === "Book") {
            itemExists = await Book.findById(reportedItemId);
        } else if (reportedItemType === "Comment") {
            itemExists = await Comment.findById(reportedItemId);
        }

        if (!itemExists) {
            return res.status(404).json({ message: `${reportedItemType} with ID ${reportedItemId} not found.` });
        }
        const newReport = new Report({
            reporter: reporterId,
            reportedItemType,
            reportedItemId,
            reason: reason.trim(),
            description: description ? description.trim() : "",
        });

        await newReport.save();
        res.status(201).json({ message: "Report submitted successfully. We will review it shortly." });

    } catch (error) {
        console.error("Error submitting report:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        if (error.kind === 'ObjectId') { // Nếu reportedItemId có định dạng không hợp lệ
            return res.status(400).json({ message: `Invalid ID format for ${req.body.reportedItemType || 'item'}.` });
        }
        res.status(500).json({ message: "Internal server error." });
    }
});

router.get("/", protectRoute, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const statusFilter = req.query.status; 
        const skip = (page - 1) * limit;

        let queryConditions = {};
        if (statusFilter && ["pending", "reviewed", "resolved", "rejected"].includes(statusFilter)) {
            queryConditions.status = statusFilter;
        }

        const reports = await Report.find(queryConditions)
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit)
            .populate("reporter", "username email profileImage") 
            .populate("reportedItemId"); 

        const totalReports = await Report.countDocuments(queryConditions);

        res.json({
            reports,
            currentPage: page,
            totalReports,
            totalPages: Math.ceil(totalReports / limit),
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
router.put("/:reportId", protectRoute, isAdmin, async (req, res) => {
    try {
        const { status, adminNotes, actionRequired } = req.body;
        const { reportId } = req.params;
        if (!status) {
            return res.status(400).json({ message: "Status is required for update." });
        }
        if (!["pending", "reviewed", "resolved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: "Report not found." });
        }

        report.status = status;
        if (adminNotes !== undefined) { 
            report.adminNotes = adminNotes.trim();
        }
        let actionMessage = "Report status updated successfully.";
        let ownerNotified = false;

        if (status === 'resolved' && actionRequired === true) { 
            try {
                let itemDeleted = false;
                let ownerId = null;
                let itemTypeForNotification = "";
                let itemContentForNotification = "";
                if (report.reportedItemType === 'Book') {
                    const bookToDelete = await Book.findById(report.reportedItemId).populate('user', 'email username');
                    itemTypeForNotification = "sách";
                    itemContentForNotification = `"${bookToDelete.title}"`;
                    if (bookToDelete) {
                        if (bookToDelete.image && bookToDelete.image.includes("cloudinary")) {
                            try {
                                const publicId = bookToDelete.image.split("/").pop().split(".")[0];
                                await cloudinary.uploader.destroy(publicId);
                                console.log(`Cloudinary image ${publicId} for Book ${bookToDelete._id} would be deleted.`);
                            } catch (deleteError) {
                                console.error("Error deleting image from cloudinary for reported book:", deleteError);
                            }
                        }
                        await Comment.deleteMany({ book: report.reportedItemId });
                        await Book.findByIdAndDelete(report.reportedItemId);
                        itemDeleted = true;
                        console.log(`Book with ID ${report.reportedItemId} was deleted due to resolved report ${reportId}.`);
                        actionMessage += ` Book ${report.reportedItemId} has been deleted.`;
                    } else {
                        console.warn(`Book with ID ${report.reportedItemId} not found for deletion (report ${reportId}).`);
                    }
                } else if (report.reportedItemType === 'Comment') {
                    const commentToDelete = await Comment.findByIdAndDelete(report.reportedItemId).populate('user', 'email username');
                    if (commentToDelete) {
                        ownerId = commentToDelete.user;
                        itemTypeForNotification = "bình luận";
                        itemContentForNotification = `"${commentToDelete.text.substring(0, 50)}${commentToDelete.text.length > 50 ? '...' : ''}"`; 
                        await Comment.findByIdAndDelete(report.reportedItemId);
                        itemDeleted = true;
                        console.log(`Comment with ID ${report.reportedItemId} was deleted due to resolved report ${reportId}.`);
                        actionMessage += ` Comment ${report.reportedItemId} has been deleted.`;
                    } else {
                        console.warn(`Comment with ID ${report.reportedItemId} not found for deletion (report ${reportId}).`);
                    }
                }
                if (itemDeleted) {
                    let ownerEmail = "";
                    let ownerUsername = "Người dùng";

                    // Nếu ownerId là một object User đã populate
                    if (ownerId && ownerId.email) {
                        ownerEmail = ownerId.email;
                        ownerUsername = ownerId.username || "Người dùng";
                    }
                    // Nếu ownerId chỉ là một ID, cần tìm User từ DB
                    else if (ownerId) {
                        const ownerUser = await User.findById(ownerId).select('email username');
                        if (ownerUser) {
                            ownerEmail = ownerUser.email;
                            ownerUsername = ownerUser.username || "Người dùng";
                        }
                    }

                    if (ownerEmail) {
                        const emailSubject = `Thông báo: Nội dung của bạn đã bị gỡ bỏ trên ${process.env.SENDGRID_FROM_NAME || 'Bookworm App'}`;
                        const emailMessage = `Chào ${ownerUsername},

Chúng tôi rất tiếc phải thông báo rằng ${itemTypeForNotification} của bạn (${itemContentForNotification}) đã bị gỡ bỏ khỏi ${process.env.SENDGRID_FROM_NAME || 'Bookworm App'} do vi phạm chính sách cộng đồng, dựa trên một báo cáo đã được xem xét.

Lý do được quản trị viên ghi nhận: ${adminNotes || "Vi phạm chính sách chung."}

Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.

Trân trọng,
Đội ngũ ${process.env.SENDGRID_FROM_NAME || 'Bookworm App'}
                        `;
                        try {
                            await sendEmail({
                                email: ownerEmail,
                                subject: emailSubject,
                                message: emailMessage,
                            });
                            ownerNotified = true;
                            actionMessage += ` Owner (${ownerEmail}) has been notified.`;
                            console.log(`Notification email sent to ${ownerEmail} for deleted content.`);
                        } catch (emailError) {
                            console.error(`Failed to send notification email to ${ownerEmail}:`, emailError);
                            actionMessage += ` Failed to notify owner via email.`;
                        }
                    } else {
                         console.warn(`Could not find email for owner ID ${ownerId} to send deletion notification.`);
                    }
                }
            } catch (deletionError) {
                console.error(`Error during automatic deletion for report ${reportId}:`, deletionError);
                actionMessage += ` However, an error occurred during automatic content deletion: ${deletionError.message}`;
                // Không nên fail toàn bộ request nếu chỉ việc xóa tự động thất bại, nhưng cần log lại
            }
        }


        await report.save();
        const populatedReport = await Report.findById(report._id)
            .populate("reporter", "username email")
            .populate("reportedItemId"); // Populate lại để trả về thông tin đầy đủ

            res.json({ message: actionMessage, report: populatedReport });

    } catch (error) {
        console.error("Error updating report status:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: "Report not found or invalid ID." });
        }
        res.status(500).json({ message: "Internal server error." });
    }
});

export default router;