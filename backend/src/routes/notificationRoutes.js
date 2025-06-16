
import express from "express";
import Notification from "../models/notification.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();


router.get("/", protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15; 
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit)
            .populate("sender", "username profileImage _id") 
            .populate("relatedItemId"); 

        const totalNotifications = await Notification.countDocuments({ recipient: userId });
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


export default router;