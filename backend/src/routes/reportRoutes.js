// src/routes/reportRoutes.js
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
        const reporterId = req.user._id;

        if (!reportedItemType || !reportedItemId || !reason) {
            return res.status(400).json({ message: "reportedItemType, reportedItemId, and reason are required." });
        }

       
        if (!["Book", "Comment", "User"].includes(reportedItemType)) {
            return res.status(400).json({ message: "Invalid reportedItemType. Must be 'Book', 'Comment', or 'User'." });
        }
        
        if (reportedItemType === "User" && reportedItemId === reporterId.toString()) {
            return res.status(400).json({ message: "You cannot report yourself." });
        }

        let itemExists;
        if (reportedItemType === "Book") {
            itemExists = await Book.findById(reportedItemId);
        } else if (reportedItemType === "Comment") {
            itemExists = await Comment.findById(reportedItemId);
        } else if (reportedItemType === "User") { 
            itemExists = await User.findById(reportedItemId);
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
        res.status(201).json({ message: "Report submitted successfully. We will review it shortly.", reportId: newReport._id });

    } catch (error) {
        console.error("Error submitting report:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: `Invalid ID format for ${req.body.reportedItemType || 'item'}.` });
        }
        res.status(500).json({ message: "Internal server error." });
    }
});

router.get("/", protectRoute, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) ; // Bạn có thể tăng limit này nếu muốn
        const statusFilter = req.query.status;
        const skip = (page - 1) * limit;
        let queryConditions = {};
        if (statusFilter && ["pending", "resolved", "rejected"].includes(statusFilter)) {
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
        const { status, adminNotes, actionRequired, suspensionDurationDays } = req.body;
        const { reportId } = req.params;

        if (!status) {
            return res.status(400).json({ message: "Status is required for update." });
        }
        if (!["pending", "resolved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value. Must be 'pending', 'resolved', or 'rejected'." });
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
        if (status === 'resolved' && actionRequired === true) {
            try {
                let itemAffected = false; 
                let ownerId = null;
                let itemTypeForNotification = report.reportedItemType.toLowerCase(); 
                let itemContentForNotification = `ID: ${report.reportedItemId}`; 

                if (report.reportedItemType === 'Book') {
                    const bookToHandle = await Book.findById(report.reportedItemId).populate('user', 'email username'); 
                    if (bookToHandle) {
                        ownerId = bookToHandle.user;
                        itemTypeForNotification = "sách"; 
                        itemContentForNotification = `"${bookToHandle.title}"`;

                        if (bookToHandle.image && bookToHandle.image.includes("cloudinary")) {
                            try {
                                const publicId = bookToHandle.image.split("/").pop().split(".")[0];
                                await cloudinary.uploader.destroy(publicId);
                                console.log(`Cloudinary image ${publicId} for Book ${bookToHandle._id} was deleted.`);
                            } catch (deleteError) {
                                console.error("Error deleting image from cloudinary for reported book:", deleteError);
                            }
                        }
                        await Comment.deleteMany({ book: report.reportedItemId });
                        await Book.findByIdAndDelete(report.reportedItemId);
                        itemAffected = true; 
                        console.log(`Book with ID ${report.reportedItemId} was deleted due to resolved report ${reportId}.`);
                        actionMessage += ` Book ${report.reportedItemId} has been deleted.`;
                    } else {
                        console.warn(`Book with ID ${report.reportedItemId} not found for deletion (report ${reportId}).`);
                    }
                } else if (report.reportedItemType === 'Comment') {
                    const commentToHandle = await Comment.findById(report.reportedItemId).populate('user', 'email username'); 
                    if (commentToHandle) {
                        ownerId = commentToHandle.user;
                        itemTypeForNotification = "bình luận"; 
                        itemContentForNotification = `"${commentToHandle.text.substring(0, 50)}${commentToHandle.text.length > 50 ? '...' : ''}"`;

                        await Comment.findByIdAndDelete(report.reportedItemId);
                        itemAffected = true; 
                        console.log(`Comment with ID ${report.reportedItemId} was deleted due to resolved report ${reportId}.`);
                        actionMessage += ` Comment ${report.reportedItemId} has been deleted.`;
                    } else {
                        console.warn(`Comment with ID ${report.reportedItemId} not found for deletion (report ${reportId}).`);
                    }
                
                } else if (report.reportedItemType === 'User') {
                    const userToHandle = await User.findById(report.reportedItemId); 
                    if (userToHandle) {
                        itemAffected = true; 
                        ownerId = userToHandle._id;
                        itemContentForNotification = `tài khoản "${userToHandle.username}"`;
                        let userActionDetail = "processed"; 


                         if (suspensionDurationDays && Number.isInteger(parseInt(suspensionDurationDays)) && parseInt(suspensionDurationDays) > 0) {
                            const duration = parseInt(suspensionDurationDays);
                            userToHandle.isSuspended = true;
                            const suspensionEnd = new Date();
                            suspensionEnd.setDate(suspensionEnd.getDate() + duration);
                            userToHandle.suspensionEndDate = suspensionEnd;
                            userToHandle.suspensionReason = `Tài khoản bị tạm khóa ${duration} ngày. Lý do từ admin: ${adminNotes || 'Vi phạm chính sách cộng đồng.'}`;
                            await userToHandle.save();
                            userActionDetail = `tạm khóa ${duration} ngày`;
                            console.log(`User account ${userToHandle._id} (${userToHandle.username}) suspended for ${duration} days until ${suspensionEnd.toISOString()}.`);
                        } else {
                            
                            console.log(`User account ${userToHandle._id} (${userToHandle.username}) flagged for review by admin. Admin notes: ${adminNotes}`);
                            userActionDetail = "được đánh dấu để xem xét thêm";
                            
                        }
                        actionMessage += ` User account ${userToHandle.username} has been  ${userActionDetail}.`;
                       
                    } else {
                        console.warn(`User with ID ${report.reportedItemId} not found for handling (report ${reportId}).`);
                    }
                }

                
                if (itemAffected && ownerId) {
                    let ownerEmail = "";
                    let ownerUsername = "Người dùng";
                    const ownerUserInstance = await User.findById(ownerId.toString()).select('email username isSuspended suspensionEndDate suspensionReason');
                    if (ownerUserInstance) {
                        ownerEmail = ownerUserInstance.email;
                        ownerUsername = ownerUserInstance.username || "Người dùng";
                    }


                    if (ownerEmail) {
                        const appName = process.env.SENDGRID_FROM_NAME || 'Bookworm App';
                        let emailSubject, emailMessage;

                        if (report.reportedItemType === 'User' && ownerUserInstance.isSuspended) { 
                            emailSubject =  `Thông báo: Tài khoản của bạn đã bị tạm khóa trên ${appName}`;
                            emailMessage =
`Chào ${ownerUsername},

Chúng tôi viết thư này để thông báo rằng ${itemTypeForNotification} của bạn (${itemContentForNotification}) trên ${appName} đã bị xử lý do vi phạm chính sách cộng đồng, dựa trên một báo cáo đã được xem xét.

Hành động của quản trị viên: ${adminNotes || "Tài khoản đã được xem xét và xử lý theo chính sách."}

Nếu bạn cho rằng đây là một sự nhầm lẫn hoặc muốn biết thêm chi tiết, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.

Trân trọng,
Đội ngũ ${appName}`;} 
                        else if (report.reportedItemType === 'User') { 
                            emailSubject = `Thông báo quan trọng về tài khoản của bạn trên ${appName}`;
                            emailMessage =
`Chào ${ownerUsername},

Chúng tôi viết thư này để thông báo rằng tài khoản của bạn (${itemContentForNotification}) trên ${appName} đã được xem xét dựa trên một báo cáo.
Ghi chú từ quản trị viên: ${adminNotes || "Tài khoản đã được xem xét theo chính sách."}

Vui lòng tuân thủ chính sách cộng đồng của chúng tôi.
Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.

Trân trọng,
Đội ngũ ${appName}`;
                       }else { 
                            emailSubject = `Thông báo: Nội dung của bạn đã bị gỡ bỏ trên ${appName}`;
                            emailMessage = `Chào ${ownerUsername},\n\nChúng tôi rất tiếc phải thông báo rằng ${itemTypeForNotification} của bạn (${itemContentForNotification}) đã bị gỡ bỏ khỏi ${appName} do vi phạm chính sách cộng đồng, dựa trên một báo cáo đã được xem xét.\n\nLý do được quản trị viên ghi nhận: ${adminNotes || "Vi phạm chính sách chung."}\n\nNếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.\n\nTrân trọng,\nĐội ngũ ${appName}`;
                        }

                        try {
                            await sendEmail({
                                email: ownerEmail,
                                subject: emailSubject,
                                message: emailMessage,
                            });
                            actionMessage += ` User (${ownerEmail}) associated with the item has been notified.`;
                            console.log(`Notification email sent to ${ownerEmail}.`);
                        } catch (emailError) {
                            console.error(`Failed to send notification email to ${ownerEmail}:`, emailError);
                            actionMessage += ` Failed to notify user via email.`;
                        }
                    } else {
                         console.warn(`Could not find email for owner/user to send notification. Owner/User ID was: ${ownerId}`);
                    }
                }
            } catch (processingError) { 
                console.error(`Error during content processing for report ${reportId}:`, processingError);
                actionMessage += ` However, an error occurred during content processing: ${processingError.message}`;
            }
        }
        else if (status === 'rejected') {
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
             
                        } else if (report.reportedItemType === 'User') {
                            item = await User.findById(report.reportedItemId).select('username');
                            if (item) reportedItemInfo = `tài khoản người dùng "${item.username}"`;
                        }
                    }
                } catch (itemFetchError) {
                    console.warn(`Could not fetch details for reported item ${report.reportedItemId} for rejection email:`, itemFetchError.message);
                }
                const emailSubject = `Cập nhật về báo cáo của bạn trên ${appName}`;
                const emailMessage = `Chào ${reporterUsername},\n\nCảm ơn bạn đã giúp chúng tôi giữ cho cộng đồng ${appName} an toàn và thân thiện.\nChúng tôi đã xem xét báo cáo của bạn liên quan đến ${reportedItemInfo}.\n\nSau khi đánh giá, chúng tôi xác định rằng nội dung/tài khoản này không vi phạm chính sách cộng đồng của chúng tôi vào thời điểm này, hoặc không đủ bằng chứng để xử lý.\nGhi chú từ quản trị viên (nếu có): ${adminNotes || "Không có ghi chú bổ sung."}\n\nChúng tôi đánh giá cao sự đóng góp của bạn. Nếu bạn có thêm bất kỳ quan ngại nào, xin đừng ngần ngại báo cáo.\n\nTrân trọng,\nĐội ngũ ${appName}`;
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