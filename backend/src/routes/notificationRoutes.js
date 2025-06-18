import express from "express";
import Notification from "../models/notification.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Lấy danh sách thông báo của người dùng
router.get("/", protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15; 
        const skip = (page - 1) * limit;

        // Thêm filter theo thời gian nếu có
        let timeFilter = {};
        const filterType = req.query.filter;
        
        if (filterType) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (filterType === 'today') {
                timeFilter = { createdAt: { $gte: today } };
            } else if (filterType === 'yesterday') {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                timeFilter = { 
                    createdAt: { 
                        $gte: yesterday,
                        $lt: today 
                    } 
                };
            } else if (filterType === 'week') {
                const lastWeek = new Date(today);
                lastWeek.setDate(lastWeek.getDate() - 7);
                timeFilter = { createdAt: { $gte: lastWeek } };
            } else if (filterType === 'month') {
                const lastMonth = new Date(today);
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                timeFilter = { createdAt: { $gte: lastMonth } };
            }
        }

        const notifications = await Notification.find({ recipient: userId, ...timeFilter })
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit)
            .populate("sender", "username profileImage _id") 
            .populate("relatedItemId"); 

        const totalNotifications = await Notification.countDocuments({ recipient: userId, ...timeFilter });
        const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

        res.json({
            notifications,
            currentPage: page,
            totalNotifications,
            totalPages: Math.ceil(totalNotifications / limit),
            unreadCount,
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Đánh dấu tất cả thông báo là đã đọc
router.post("/mark-as-read", protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { $set: { isRead: true } }
        );
        
        const io = req.io;
        if (io) {
            io.to(`userRoom_${userId.toString()}`).emit("notificationsMarkedAsRead", { unreadCount: 0 });
        }

        res.json({ message: "All notifications marked as read." });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Đánh dấu một thông báo là đã đọc
router.post("/:notificationId/mark-one-as-read", protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId, isRead: false }, 
            { $set: { isRead: true } },
            { new: true } 
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found or already read." });
        }
        
        const io = req.io;
        if (io) {
            const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });
            io.to(`userRoom_${userId.toString()}`).emit("notificationStatusChanged", { notificationId, isRead: true, unreadCount });
        }

        res.json({ message: "Notification marked as read.", notification });
    } catch (error) {
        console.error("Error marking one notification as read:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// THÊM MỚI: Đánh dấu một thông báo là chưa đọc
router.post("/:notificationId/mark-one-as-unread", protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId, isRead: true }, 
            { $set: { isRead: false } },
            { new: true } 
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found or already unread." });
        }
        
        const io = req.io;
        if (io) {
            const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });
            io.to(`userRoom_${userId.toString()}`).emit("notificationStatusChanged", { notificationId, isRead: false, unreadCount });
        }

        res.json({ message: "Notification marked as unread.", notification });
    } catch (error) {
        console.error("Error marking one notification as unread:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// THÊM MỚI: Xóa một thông báo
router.delete("/:notificationId", protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId, 
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found." });
        }
        
        const io = req.io;
        if (io) {
            const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });
            io.to(`userRoom_${userId.toString()}`).emit("notificationDeleted", { notificationId, unreadCount });
        }

        res.json({ message: "Notification deleted successfully." });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// THÊM MỚI: Xóa tất cả thông báo
router.delete("/", protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        
        await Notification.deleteMany({ recipient: userId });
        
        const io = req.io;
        if (io) {
            io.to(`userRoom_${userId.toString()}`).emit("allNotificationsDeleted");
        }

        res.json({ message: "All notifications deleted successfully." });
    } catch (error) {
        console.error("Error deleting all notifications:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

export default router;