import mongoose from "mongoose";
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
        timestamps: true 
    }
);
const Comment = mongoose.model("Comment", commentSchema);

export default Comment;