import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    caption: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    // Không cần import user.js vì Mongoose tự động reference đến User nếu đã được define ở mongoose - chỉ lưu 1 useruser
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true,
    },
    like_count: {
        type: Number,
        default: 0,
    },
    dislike_count: {
        type: Number,
        default: 0,
    },
    // Track xem ai like và dislike - ở đây lưu array các user đã like 
    likedBy: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }], 
    dislikedBy: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" 
    }], 
    published_year: {
        type: Number //optional năm xuất bản
    },
    author: {
        type: String,
        // required: true,
    },
    genre: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre", 
            // required: true, 
    },


    // ở dưới đây là các features dùng cho Admin
    is_deleted: {
        type: Boolean,
        default: false, // Mặc định là không xóa mềm sách bị Report - Optional cho Huy Bu ---> Phần Report 
    },
    process: {
        type: String,
        enum: ["pending", "reviewed", "rejected"],
        default: "pending", // Trạng thái ban đầu là pending --> màu vàng 
    },
 
},{ 
    timestamps: true //create at auto update + create ngày 
});

const Book = mongoose.model("Book", bookSchema);

export default Book;