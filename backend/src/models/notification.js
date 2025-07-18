
import mongoose from "mongoose";
const pad = (num) => String(num).padStart(2, "0");

const notificationSchema = new mongoose.Schema(
    {
        recipient: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true, 
        },
        sender: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: { 
            type: String,
            required: true,
            enum: ["new_follower", "new_comment", "new_like_on_book"],
        },
        message: { 
            type: String,
            required: true,
        },
        link: { 
                 
            type: String,
        },
        relatedItemType: { 
            type: String,
            enum: ["Book", "Comment", "User"], 
        },
        relatedItemId: { 
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'relatedItemType',
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                const pad = (num) => String(num).padStart(2, "0");
                if (ret.createdAt) {
                    const createdAtLocal = new Date(ret.createdAt);
                    ret.createdAt = `${createdAtLocal.getFullYear()}-${pad(createdAtLocal.getMonth() + 1)}-${pad(createdAtLocal.getDate())} ${pad(createdAtLocal.getHours())}:${pad(createdAtLocal.getMinutes())}:${pad(createdAtLocal.getSeconds())}`;
                }
                if (ret.updatedAt) {
                    const updatedAtLocal = new Date(ret.updatedAt);
                    ret.updatedAt = `${updatedAtLocal.getFullYear()}-${pad(updatedAtLocal.getMonth() + 1)}-${pad(updatedAtLocal.getDate())} ${pad(updatedAtLocal.getHours())}:${pad(updatedAtLocal.getMinutes())}:${pad(updatedAtLocal.getSeconds())}`;
                }
                return ret;
            },
            virtuals: true,
        },
    }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;