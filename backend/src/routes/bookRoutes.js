import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Comment from "../models/comment.js";
import Book from "../models/book.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Before async to send POST --> Call protectRoute to check Token.
router.post("/", protectRoute, async(req, res) => {

    try {
        const { title, caption, rating, image } = req.body;

        if (!title || !caption || !rating || !image) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Upload image to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image);
        
        // Link Upload to Cloudinary
        const imageUrl = uploadResponse.secure_url;

        // Save to database
        const newBook = new Book({
            title,
            caption,
            rating,
            image: imageUrl,
            user: req.user._id, // Cần Token để xác định danh tính người gửi 
        });

        await newBook.save();
        res.status(201).json(newBook);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// // Pagination - phân trang: cần xem lại nếu có tính năng lấy những post dựa vào like + rate --> tính năng recommend cần xem
router.get("/", protectRoute, async(req, res) => {
    //const response = await fetch("http://localhost:3000/api/books?page=1&limit=5");

    try {
        const page = req.query.page || 1; // default page = 1
        const limit = req.query.limit || 5; // default limit = 5
        const skip = (page - 1) * limit; // tính số lượng sách đã bỏ qua
        
        const books = await Book.find()
            .sort({ createdAt: -1 }) // desc
            .skip(skip)
            .limit(limit)
            .populate("user", "username profileImage");

        const totalBooks = await Book.countDocuments(); // đếm tổng số sách trong DB

        res.send({
            books,
            currentPage: page,
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });    
    }
});

// Tính năng Get hết review sách của User đó - và hiển thị lên profile (giống hiển thị bài đăng)
router.get("/user", protectRoute, async (req, res) => {
    try {
        const books = await Book.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        console.error("Get user books error:", error.message);
        res.status(500). json({ message: "Server error" });
    }
});

router.delete("/:id", protectRoute,async(req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ 
            message: "Book not found" 
        });

        // Check người xóa có phải người viết Sách không 
        if (book.user. toString() !== req.user._id.toString()){
            return res.status(401). json({ message: "Unauthorized" });
        }

        // ví dụ đường dẫn ảnh https://res.cloudinary.com/de1rm4uto/image/upload/v1741568358/qyup61vejflxxw8igvi0.png
        // Delete ảnh của Cloudinary
        if (book.image && book.image.includes("cloudinary") ) {
            try {
                const publicId = book.image.split("/").pop().split(".")[0]; //tách đường link lấy qyup61vejflxxw8igvi0.png --> và lấy vị trí [0] tức lấy ảnh
                await cloudinary. uploader.destroy(publicId);
            } catch (deleteError) {
                console.log("Error deleting image from cloudinary", deleteError);
            }
        }
        await Comment.deleteMany({ book: req.params.id });
        // Nếu đó là user đã review sách -> thực hiện xóa trên MongoDB
        await book.deleteOne();

        res.json({ message: "Book deleted successfully" }) ;
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    } 
});
router.post("/:bookId/comments", protectRoute, async (req, res) => {
    try {
    const { text } = req.body;
    const { bookId } = req.params;
    if (!text || text.trim() === "") {
            return res.status(400).json({ message: "Comment text cannot be empty." });
        }
    
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: "Book not found." });
        }
    
        const newComment = new Comment({
            text,
            user: req.user._id, 
            book: bookId,
        });
    
        await newComment.save();
        
        const populatedComment = await Comment.findById(newComment._id).populate("user", "username profileImage");
    
        res.status(201).json(populatedComment);
    } catch (error) {
        console.error("Create comment error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/:bookId/comments", protectRoute, async (req, res) => { 
try {
const { bookId } = req.params;
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10; 
const skip = (page - 1) * limit;
const book = await Book.findById(bookId);
    if (!book) {
        return res.status(404).json({ message: "Book not found." });
    }

    const comments = await Comment.find({ book: bookId })
        .sort({ createdAt: -1 }) 
        .skip(skip)
        .limit(limit)
        .populate("user", "username profileImage");

    const totalComments = await Comment.countDocuments({ book: bookId });

    res.json({
        comments,
        currentPage: page,
        totalComments,
        totalPages: Math.ceil(totalComments / limit),
    });
} catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Internal server error" });
}});

router.put("/:bookId/comments/:commentId", protectRoute, async (req, res) => {
    try {
        const { text } = req.body;
        const { bookId, commentId } = req.params;

        if (!text || text.trim() === "") {
            return res.status(400).json({ message: "Comment text cannot be empty." });
        }

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found." });
        }
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to edit this comment." });
        }
        if (comment.book.toString() !== bookId) {
            return res.status(400).json({ message: "Bad request: Comment does not belong to this book." });
        }

        comment.text = text;
        await comment.save();

        const populatedComment = await Comment.findById(comment._id).populate("user", "username profileImage");
        res.json(populatedComment);

    } catch (error) {
        console.error("Update comment error:", error);
        if (error.kind === 'ObjectId') { 
            return res.status(404).json({ message: "Comment not found or invalid ID." });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete("/:bookId/comments/:commentId", protectRoute, async (req, res) => {
    try {
        const { bookId, commentId } = req.params; 
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found." });
        }
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to delete this comment." });
        }
        if (comment.book.toString() !== bookId) {
             return res.status(400).json({ message: "Bad request: Comment does not belong to this book." });
        }

        await Comment.findByIdAndDelete(commentId);

        res.json({ message: "Comment deleted successfully." });

    } catch (error) {
        console.error("Delete comment error:", error);
        if (error.kind === 'ObjectId') { 
            return res.status(404).json({ message: "Comment not found or invalid ID." });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});


export default router;