import mongoose from "mongoose";
const pad = (num) => String(num).padStart(2, "0");
const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true,
    },
    user: { // Người comment
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    book: { // Bài viết được comment
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true,
    },},
    {
        timestamps: true, //create at auto update + create ngày
        toJSON: {
            transform: (doc, ret) => {
        // Convert timestamps to local time (+07:00) and format as YYYY-MM-DD HH:MM:SS
        if (ret.createdAt) {
            const createdAtLocal = new Date(ret.createdAt.getTime());
            ret.createdAt = `${createdAtLocal.getFullYear()}-${pad(createdAtLocal.getMonth() + 1)}-${pad(createdAtLocal.getDate())} ${pad(createdAtLocal.getHours())}:${pad(createdAtLocal.getMinutes())}:${pad(createdAtLocal.getSeconds())}`;
        }
        if (ret.updatedAt) {
            const updatedAtLocal = new Date(ret.updatedAt.getTime());
            ret.updatedAt = `${updatedAtLocal.getFullYear()}-${pad(updatedAtLocal.getMonth() + 1)}-${pad(updatedAtLocal.getDate())} ${pad(updatedAtLocal.getHours())}:${pad(updatedAtLocal.getMinutes())}:${pad(updatedAtLocal.getSeconds())}`;
        }
        return ret;
    },
        virtuals: true, // Include virtual fields if any
},    }
);
const Comment = mongoose.model("Comment", commentSchema);

export default Comment;