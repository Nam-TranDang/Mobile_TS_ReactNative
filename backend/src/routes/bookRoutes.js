import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Comment from "../models/comment.js";
import Book from "../models/book.js";
import Genre from "../models/genre.js";
import protectRoute from "../middleware/auth.middleware.js";
import mongoose from "mongoose"; // Import mongoose here

const router = express.Router();

// Before async to send POST --> Call protectRoute to check Token.
router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image, author, published_year, genre } = req.body;
    
    if (!title || !caption || !rating || !image|| !author || !genre) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "Book_Forum/Book_Review",
    });

    // Link Upload to Cloudinary
    const imageUrl = uploadResponse.secure_url;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating out of scope" });
    }

    if (genre) {
      // Check if genre is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(genre)) {
        return res.status(400).json({ message: "Invalid genre ID format" });
      }
      const genreExists = await Genre.findById(genre);
      if (!genreExists || genreExists.is_deleted) {
        return res.status(400).json({ message: "Invalid or deleted genre" });
      }
    }
  
    // check valid year
    // published year -> check dieu kien field nay co trong req - vi day la optional, isNaN - is not a number --> tra ve true neu la text 
    if (published_year && (isNaN(published_year) || published_year < 0 || published_year > new Date().getFullYear())) {
      return res.status(400).json({ message: "Invalid published year" });
    }

    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,  // Cần Token để xác định danh tính người gửi
      author,
      published_year: published_year || undefined, // Optional field
      genre,
      process: "pending", // Default o trang thai pending
      is_deleted: false, // Default khong xoa sach
    });

    await newBook.save(); //build function của  Mongoose - store data

    // Emit to admin clients khi có sách mới
    if (req.emitToAdmins) {
      req.emitToAdmins("newBook", {
        book: newBook,
        user: req.user
      });
    }
    
    res.status(201).json(newBook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET genre cho User 
router.get("/genres", async (req, res) => {
  try {
    const genres = await Genre.find({ soft_delete: false }) // neu chua xoa mem thi get 
      .select("genre_name _id") // select ten va id tu mongo
      .sort({ genre_name: 1 }); // Sort alphabetically 

    if (!genres || genres.length === 0) {
      return res.status(404).json({ message: "No genres found" });
    }

    res.status(200).json(genres);
  } catch (error) {
    console.error("Error fetching genres:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Internal server error" });
  }
});


// Pagination cho trang home - phân trang --> danh cho da la user 
router.get("/", protectRoute, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Add filter for user if provided
    const matchFilter = req.query.user ? { user: new mongoose.Types.ObjectId(req.query.user) } : {};

    // Sử dụng aggregate để loại bỏ books có user null
    const books = await Book.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $match: {
          "user.0": { $exists: true } // Chỉ lấy books có user tồn tại
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          title: 1,
          caption: 1,
          image: 1,
          rating: 1,
          like_count: 1,
          dislike_count: 1,
          likedBy: 1,
          dislikedBy: 1,
          createdAt: 1,
          "user.username": 1,
          "user.profileImage": 1,
          "user._id": 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Đếm tổng số books hợp lệ
    const totalBooksResult = await Book.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $match: {
          "user.0": { $exists: true }
        }
      },
      { $count: "total" }
    ]);

    const totalBooks = totalBooksResult[0]?.total || 0;

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
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(books);
  } catch (error) {
    console.error("Get user books error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Update (về bản chất - Put update toàn bộ, Patch update 1 phần)
router.patch("/:id", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // protectRoute để kiểm Authorization - xác minh người dùngdùng
    // Check người xóa có phải người viết Sách không - Check Ủy quyền cho phép chỉnh sửa
    // Ví dụ token User A -> được xác thực. Nhưng User A muốn sửa bài viết của User B -> không được phép

    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Conditionally update fields if they are provided in the request body
    if (title !== undefined) book.title = title;
    if (caption !== undefined) book.caption = caption;
    if (rating !== undefined) book.rating = rating;

    if (image !== undefined) {
      // Use 'image' from req.body {
      // If a new image is provided, upload it to Cloudinary - Vì đây là patch (CẦN TEST XEM PUT LÊN CÓ CẬP NHẬT ẢNH KHÔNGKHÔNG)
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "Book_Forum/Book_Review",
      });
      book.image = uploadResponse.secure_url;
    }

    await book.save();
    res
      .status(200)
      .json({ message: "Book updated successfully", updatedBook: book });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete spec book
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book)
      return res.status(404).json({
        message: "Book not found",
      });

    // Check người xóa có phải người viết Sách không
    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // "https://res.cloudinary.com/de1rm4uto/image/upload/v1741568358/Book_Forum/Book_Review/your_image_unique_id.png"
    const parts = book.image.split("/"); // cắt ra thành các phần từ dấu "/"

    const publicIdWithVersionAndExtension = parts
      .slice(parts.indexOf("upload") + 2)
      .join("/"); //bắt đầu đi từ index "upload" trong đoạn parts, và bỏ 2 phần tử đầu là upload và id và nối lại các phần còn lại
    console.log(
      "Public ID with version and extension:",
      publicIdWithVersionAndExtension
    );
    // Và join laị sẽ được: "Book_Forum/Book_Review/your_image_unique_id.png"

    const publicId = publicIdWithVersionAndExtension.split(".")[0];
    // Tách ra sẽ được "Book_Forum/Book_Review/your_image_unique_id"

    console.log("Extracted Public ID for Cloudinary deletion:", publicId);

    await cloudinary.uploader.destroy(publicId);
    console.log("Image deleted from Cloudinary successfully.");

    await Comment.deleteMany({ book: req.params.id });
    // Nếu đó là user đã review sách -> thực hiện xóa trên MongoDB
    await book.deleteOne();
    res.json({ message: "Book deleted successfully" });

    // ví dụ đường dẫn ảnh https://res.cloudinary.com/de1rm4uto/image/upload/v1741568358/qyup61vejflxxw8igvi0.png
    // Delete ảnh của Cloudinary
    // if (book.image && book.image.includes("cloudinary") ) {
    //     try {
    //         const publicId = book.image.split("/").pop().split(".")[0]; //tách đường link lấy qyup61vejflxxw8igvi0.png --> và lấy vị trí [0] tức lấy ảnh
    //         await cloudinary.ploader.destroy(publicId);
    //     } catch (deleteError) {
    //         console.log("Error deleting image from cloudinary", deleteError);
    //     }
    // }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create comment for a book
router.post("/:bookId/comments", protectRoute, async (req, res) => {
  try {
    const { text } = req.body;
    const { bookId } = req.params;
    const io = req.io;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Validate bookId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID format" });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const newComment = new Comment({
      text: text.trim(),
      user: req.user._id,
      book: bookId,
    });

    await newComment.save();

    // Populate user info before sending response
    await newComment.populate("user", "username profileImage _id");
    if (io) { // Kiểm tra io có tồn tại không
      io.to(bookId.toString()).emit("newComment", newComment.toJSON()); // Gửi newComment đã populate và transform
      console.log(`Emitted 'newComment' to room ${bookId} for comment ${newComment._id}`);
    } else {
      console.warn("Socket.io instance (req.io) not found. Cannot emit 'newComment'.");
    }
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get comments for a book
router.get("/:bookId/comments", protectRoute, async (req, res) => {
  try {
    const { bookId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate bookId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID format" });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const comments = await Comment.find({ book: bookId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage _id");

    // THÊM MỚI: Filter out comments with null users (deleted users)
    const validComments = comments.filter((comment) => comment.user !== null);

    const totalComments = await Comment.countDocuments({
      book: bookId,
      user: { $ne: null }, // Chỉ đếm comments có user hợp lệ
    });

    res.json({
      comments: validComments, // Trả về comments có user hợp lệ
      currentPage: page,
      totalComments,
      totalPages: Math.ceil(totalComments / limit),
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:bookId/comments/:commentId", protectRoute, async (req, res) => {
  try {
    const { text } = req.body;
    const { bookId, commentId } = req.params;
    const io = req.io;
    

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text cannot be empty." });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Forbidden: You are not authorized to edit this comment.",
      });
    }
    if (comment.book.toString() !== bookId) {
      return res.status(400).json({
        message: "Bad request: Comment does not belong to this book.",
      });
    }

    comment.text = text;
    await comment.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      "user",
      "username profileImage"
    );
    if (io) {
      io.to(bookId.toString()).emit("commentUpdated", populatedComment.toJSON());
      console.log(`Emitted 'commentUpdated' to room ${bookId} for comment ${populatedComment._id}`);
  } else {
      console.warn("Socket.io instance (req.io) not found. Cannot emit 'commentUpdated'.");
  }
    res.json(populatedComment);
  } catch (error) {
    console.error("Update comment error:", error);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Comment not found or invalid ID." });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete( "/:bookId/comments/:commentId", protectRoute, async (req, res) => {
    try {
      const { bookId, commentId } = req.params;
      const io = req.io;

      const comment = await Comment.findById(commentId);
      if (io) {
        // Gửi ID của comment đã xóa và bookId để client biết xóa comment nào khỏi sách nào
        io.to(bookId.toString()).emit("commentDeleted", { commentId, bookId });
        console.log(`Emitted 'commentDeleted' to room ${bookId} for comment ${commentId}`);
    } else {
        console.warn("Socket.io instance (req.io) not found. Cannot emit 'commentDeleted'.");
    }
      if (!comment) {
        return res.status(404).json({ message: "Comment not found." });
      }
      if (comment.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "Forbidden: You are not authorized to delete this comment.",
        });
      }
      if (comment.book.toString() !== bookId) {
        return res.status(400).json({
          message: "Bad request: Comment does not belong to this book.",
        });
      }

      await Comment.findByIdAndDelete(commentId);

      res.json({ message: "Comment deleted successfully." });
    } catch (error) {
      console.error("Delete comment error:", error);
      if (error.kind === "ObjectId") {
        return res
          .status(404)
          .json({ message: "Comment not found or invalid ID." });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Tính năng like và dislike O day
// chỉ cần check authenticate là like được - make sure chỉ like hoặc dislike
router.put("/:id/like", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const userId = req.user._id;
    if (!book.likedBy.includes(userId)) {
      book.likedBy.push(userId);
      book.like_count += 1;
      // If user previously disliked, remove from dislikedBy and decrement dislike_count
      if (book.dislikedBy.includes(userId)) {
        book.dislikedBy.pull(userId);
        book.dislike_count -= 1;
      }
      await book.save();
    }
    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Like - tham khao PATCH
// router.patch("/:id/like", protectRoute, async (req, res) => {
//     try {
//         const userId = req.user._id;

//         // findOneAndUpdate là build in của Mongoose, dùng để tìm và cập nhật 1 phần trong document
//         const book = await Book.findOneAndUpdate(
//             { _id: req.params.id, "likedBy": { $ne: userId } },  // Bước này Query sách - và là điều kiện and = if có sách && userid not equal ở trong array likedBy --> thì cho like -> tránh case like nhiều lần.
//             {
//                 $push: { likedBy: userId }, // Thêm user vào array likeBy
//                 $inc: { like_count: 1 },    // Tăng thêm vào like_count
//                 $pull: { dislikedBy: userId }, // Xóa user khỏi dislikedBy nếu có -> tránh trường hợp vừa like vừa dislike
//                 $inc: { dislike_count: -1 } // Giảm dislike_count nếu user có trong dislikedBy
//             },
//             { new: true } // Chắc chắn  document được updateupdate
//         );

//         if (!book) {
//             return res.status(404).json({ message: "Book not found or already liked" });
//         }

//         res.status(200).json(book);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });

// Hủy nút like
router.put("/:id/unlike", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const userId = req.user._id;
    if (book.likedBy.includes(userId)) {
      book.likedBy.pull(userId);
      book.like_count -= 1;
      await book.save();
    }
    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Dislike
router.put("/:id/dislike", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const userId = req.user._id;
    if (!book.dislikedBy.includes(userId)) {
      book.dislikedBy.push(userId);
      book.dislike_count += 1;
      // If user previously liked, remove from likedBy and decrement like_count
      if (book.likedBy.includes(userId)) {
        book.likedBy.pull(userId);
        book.like_count -= 1;
      }
      await book.save();
    }
    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Hủy nút Dislike
router.put("/:id/remove-dislike", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const userId = req.user._id;
    if (book.dislikedBy.includes(userId)) {
      book.dislikedBy.pull(userId);
      book.dislike_count -= 1;
      await book.save();
    }
    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single book details - đặt sau route /user để tránh conflict
router.get("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      "user",
      "username profileImage createdAt"
    );

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(book);
  } catch (error) {
    console.error("Get book details error:", error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid book ID format" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});
  
export default router;
