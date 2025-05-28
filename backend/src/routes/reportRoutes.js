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
        if (!["pending", "resolved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        const report = await Report.findById(reportId).populate('reporter', 'email username');
        if (!report) {
            return res.status(404).json({ message: "Report not found." });
        }

        report.status = status;
        if (adminNotes !== undefined) {
            report.adminNotes = adminNotes.trim();
        }
        let actionMessage = "Report status updated successfully.";
        // let ownerNotified = false; // Bỏ hoặc khai báo lại nếu bạn có dùng

        if (status === 'resolved' && actionRequired === true) {
            try {
                let itemDeleted = false;
                let ownerId = null; // Sẽ chứa object User đã populate hoặc ObjectId
                let itemTypeForNotification = "";
                let itemContentForNotification = "";

                if (report.reportedItemType === 'Book') {
                    const bookToDelete = await Book.findById(report.reportedItemId).populate('user', 'email username');
                    if (bookToDelete) {
                        ownerId = bookToDelete.user;
                        itemTypeForNotification = "sách";
                        itemContentForNotification = `"${bookToDelete.title}"`;

                        if (bookToDelete.image && bookToDelete.image.includes("cloudinary")) {
                            try {
                                const publicId = bookToDelete.image.split("/").pop().split(".")[0];
                                await cloudinary.uploader.destroy(publicId);
                                console.log(`Cloudinary image ${publicId} for Book ${bookToDelete._id} was deleted.`);
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
                    const commentFound = await Comment.findById(report.reportedItemId).populate('user', 'email username'); // Tìm và populate trước
                    if (commentFound) {
                        ownerId = commentFound.user; // ownerId giờ là object User (nếu user tồn tại) hoặc ObjectId
                        itemTypeForNotification = "bình luận";
                        itemContentForNotification = `"${commentFound.text.substring(0, 50)}${commentFound.text.length > 50 ? '...' : ''}"`;
                        
                        await Comment.findByIdAndDelete(report.reportedItemId); // Sau đó mới xóa
                        itemDeleted = true;
                        console.log(`Comment with ID ${report.reportedItemId} was deleted due to resolved report ${reportId}.`);
                        actionMessage += ` Comment ${report.reportedItemId} has been deleted.`;
                    } else {
                        console.warn(`Comment with ID ${report.reportedItemId} not found for deletion (report ${reportId}).`);
                    }
                }

                if (itemDeleted && ownerId) { // ownerId có thể là object User hoặc ObjectId
                    let ownerEmail = "";
                    let ownerUsername = "Người dùng";

                    if (ownerId && typeof ownerId === 'object' && ownerId.email) { // Nếu ownerId là object User đã populate
                        ownerEmail = ownerId.email;
                        ownerUsername = ownerId.username || "Người dùng";
                    } else if (ownerId) { // Nếu ownerId là ObjectId, cần query lại
                        const ownerUser = await User.findById(ownerId.toString()).select('email username'); // Chuyển sang string nếu là ObjectId
                        if (ownerUser) {
                            ownerEmail = ownerUser.email;
                            ownerUsername = ownerUser.username || "Người dùng";
                        }
                    }

                    if (ownerEmail) {
                        const appName = process.env.SENDGRID_FROM_NAME || 'Bookworm App';
                        const emailSubject = `Thông báo: Nội dung của bạn đã bị gỡ bỏ trên ${appName}`;
                        const emailMessage = `Chào ${ownerUsername},\n\nChúng tôi rất tiếc phải thông báo rằng ${itemTypeForNotification} của bạn (${itemContentForNotification}) đã bị gỡ bỏ khỏi ${appName} do vi phạm chính sách cộng đồng, dựa trên một báo cáo đã được xem xét.\n\nLý do được quản trị viên ghi nhận: ${adminNotes || "Vi phạm chính sách chung."}\n\nNếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.\n\nTrân trọng,\nĐội ngũ ${appName}`;
                        try {
                            await sendEmail({
                                email: ownerEmail,
                                subject: emailSubject,
                                message: emailMessage,
                            });
                            // ownerNotified = true; // Khai báo lại nếu cần
                            actionMessage += ` Owner (${ownerEmail}) has been notified.`;
                            console.log(`Notification email sent to ${ownerEmail} for deleted content.`);
                        } catch (emailError) {
                            console.error(`Failed to send notification email to ${ownerEmail}:`, emailError);
                            actionMessage += ` Failed to notify owner via email.`;
                        }
                    } else {
                         console.warn(`Could not find email for owner to send deletion notification. Owner ID was: ${ownerId}`);
                    }
                }
            } catch (deletionError) {
                console.error(`Error during automatic deletion/notification for report ${reportId}:`, deletionError);
                actionMessage += ` However, an error occurred during content processing: ${deletionError.message}`;
            }
        }
        else if (status === 'rejected') {
            // ... (Logic gửi email cho reporter khi rejected giữ nguyên, nó có vẻ đã ổn)
            if (report.reporter && report.reporter.email) {
                const reporterEmail = report.reporter.email;
                const reporterUsername = report.reporter.username || "Người dùng";
                const appName = process.env.SENDGRID_FROM_NAME || 'Bookworm App';
                let reportedItemInfo = `mục bạn đã báo cáo (ID: ${report.reportedItemId})`;
                try {
                    if (report.reportedItemType && report.reportedItemId) {
                        let item;
                        if (report.reportedItemType === 'Book') {
                            item = await Book.findById(report.reportedItemId).select('title');
                            if (item) reportedItemInfo = `sách "${item.title}"`;
                        } else if (report.reportedItemType === 'Comment') {
                            item = await Comment.findById(report.reportedItemId).select('text');
                            if (item) reportedItemInfo = `bình luận "${item.text.substring(0, 30)}..."`;
                        }
                    }
                } catch (itemFetchError) {
                    console.warn(`Could not fetch details for reported item ${report.reportedItemId} for rejection email:`, itemFetchError.message);
                }
                const emailSubject = `Cập nhật về báo cáo của bạn trên ${appName}`;
                const emailMessage = `Chào ${reporterUsername},\n\nCảm ơn bạn đã giúp chúng tôi giữ cho cộng đồng ${appName} an toàn và thân thiện.\nChúng tôi đã xem xét báo cáo của bạn liên quan đến ${reportedItemInfo}.\n\nSau khi đánh giá, chúng tôi xác định rằng nội dung này không vi phạm chính sách cộng đồng của chúng tôi vào thời điểm này.\nGhi chú từ quản trị viên (nếu có): ${adminNotes || "Không có ghi chú bổ sung."}\n\nChúng tôi đánh giá cao sự đóng góp của bạn. Nếu bạn có thêm bất kỳ quan ngại nào, xin đừng ngần ngại báo cáo.\n\nTrân trọng,\nĐội ngũ ${appName}`;
                try {
                    await sendEmail({
                        email: reporterEmail,
                        subject: emailSubject,
                        message: emailMessage,
                    });
                    actionMessage += ` Reporter (${reporterEmail}) has been notified about rejection.`;
                    console.log(`Notification email sent to reporter ${reporterEmail} for rejected report ${reportId}.`);
                } catch (emailError) {
                    console.error(`Failed to send notification email to reporter ${reporterEmail}:`, emailError);
                    actionMessage += ` Failed to notify reporter via email.`;
                }
            } else {
                console.warn(`Reporter details not available or reporter email missing for report ${reportId}. Cannot notify about rejection.`);
                actionMessage += ` Could not notify reporter about rejection (details missing).`;
            }
        }

        await report.save();
        const populatedReport = await Report.findById(report._id)
            .populate("reporter", "username email profileImage")
            .populate("reportedItemId");

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