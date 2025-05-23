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

        // Nếu đó là user đã review sách -> thực hiện xóa trên MongoDB
        await book.deleteOne();

        res.json({ message: "Book deleted successfully" }) ;
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    } 
});

export default router;