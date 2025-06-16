
import Notification from "../models/notification.js";
import User from "../models/user.js"; 

/**
 
 * @param {object} io 
 * @param {string} recipientId 
 * @param {string} senderId 
 * @param {'new_follower' | 'new_comment' | 'new_like_on_book'} type 
 * @param {string} message - Nội dung thông báo.
 * @param {string} [link] - (Tùy chọn) Link điều hướng.
 * @param {'Book' | 'Comment' | 'User'} [relatedItemType] - (Tùy chọn) Loại item liên quan.
 * @param {string} [relatedItemId] - (Tùy chọn) ID của item liên quan.
 */
export const createAndSendNotification = async (
    io,
    recipientId,
    senderId,
    type,
    message,
    link,
    relatedItemType,
    relatedItemId
) => {
    try {
        
        if (recipientId.toString() === senderId.toString()) {
            if (type === "new_follower") { 
                 console.log("Skipping self-notification for new_follower.");
                 return null;
            }
        }


        const notification = new Notification({
            recipient: recipientId,
            sender: senderId,
            type,
            message,
            link,
            relatedItemType,
            relatedItemId,
        });
        await notification.save();

        
        const populatedNotification = await Notification.findById(notification._id)
            .populate("sender", "username profileImage _id")
            .populate({ 
                path: "relatedItemId",
                select: type === "new_comment" ? "text user book" : (type === "new_like_on_book" ? "title user" : "username") 
            });


        if (io && populatedNotification) {
            const targetRoom = `userRoom_${recipientId.toString()}`; 
            io.to(targetRoom).emit("newNotification", populatedNotification.toJSON());
            console.log(`Emitted 'newNotification' (type: ${type}) to room ${targetRoom} for user ${recipientId}`);
        } else if (!io) {
            console.warn("Socket.io instance not available. Notification saved but not sent real-time.");
        }
        return populatedNotification; 
    } catch (error) {
        console.error("Error creating or sending notification:", error);
        return null;
    }
};