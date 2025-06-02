// chinh sua thong tin admin - xoa user - deactive - xoa bai viet - chinh sua genre 
import express from "express";
import protectRoute from "../middleware/auth.middleware.js";
import isAdmin from "../middleware/admin.middleware.js";
import Genre from "../models/genre.js";
import mongoose from "mongoose";
import User from "../models/user.js";
import Book from "../models/book.js";
import Comment from "../models/comment.js"; 
import Report from "../models/report.js"; 
import cloudinary from "../lib/cloudinary.js"; 
import sendEmail from "../lib/sendEmail.js";

const router = express.Router();

// cap quyen admin 

// chinh sua xoa genre 
// CRUD genre --> doiovoi

// Helper function to normalize genre_name to a consistent format (e.g., "Textbook", "Business & Finance")
const normalizeGenreName = (name) => {
  if (!name || typeof name !== "string") return name;
  return name
    .trim()
    .split(/(\s+|\&\s+)/) // Split on spaces or "&" with surrounding spaces
    .map((word, index, arr) => {
      // Preserve "&" and spaces between words
      if (word.match(/^\s+$/) || word.match(/^\&\s*$/)) return word;
      // Capitalize first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
};

router.get("/genres", protectRoute, isAdmin, async (req, res) => {
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

router.post("/genres", protectRoute, isAdmin, async (req, res) => {
  try {
    const { genre_name } = req.body;

    // Validate required field
    if (!genre_name || typeof genre_name !== "string" || genre_name.trim() === "") {
      return res.status(400).json({ message: "Genre name is required and must be a non-empty string" });
    }

    const trimmedGenreName = genre_name.trim();
    const normalizedGenreName = normalizeGenreName(trimmedGenreName);

    // Case-insensitive duplicate check
    const existingGenre = await Genre.findOne({
      genre_name: { $regex: `^${trimmedGenreName}$`, $options: "i" },
      soft_delete: false,
    });

    if (existingGenre) {
      return res.status(400).json({
        message: `Genre '${trimmedGenreName}' already exists as '${existingGenre.genre_name}'`,
      });
    }

    // Create new genre with normalized name
    const newGenre = new Genre({
      genre_name: normalizedGenreName,
      soft_delete: false,
    });

    await newGenre.save();
    res.status(201).json(newGenre);
  } catch (error) {
    console.error("Error creating genre:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update - voi req param cua id do
// khong xoa genre --> chi de soft delete de reference book co the hoat dong 
router.patch("/genres/:id", protectRoute, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { genre_name, soft_delete } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid genre ID format" });
    }

    // Find the genre
    const genre = await Genre.findById(id);
    if (!genre) {
      return res.status(404).json({ message: "Genre not found" });
    }

    // Case 1 & 3: If soft_delete is false, allow normal updates
    if (!genre.soft_delete) {
      // Handle genre_name update if provided
      if (genre_name !== undefined) {
        if (typeof genre_name !== "string" || genre_name.trim() === "") {
          return res.status(400).json({ message: "Genre name must be a non-empty string" });
        }

        const trimmedGenreName = genre_name.trim();
        const normalizedGenreName = normalizeGenreName(trimmedGenreName);

        // Case-insensitive duplicate check, excluding the current genre
        const existingGenre = await Genre.findOne({
          genre_name: { $regex: `^${trimmedGenreName}$`, $options: "i" },
          soft_delete: false,
          _id: { $ne: id },
        });

        if (existingGenre) {
          return res.status(400).json({
            message: `Genre '${trimmedGenreName}' already exists as '${existingGenre.genre_name}'`,
          });
        }

        genre.genre_name = normalizedGenreName;
      }

      // Handle soft_delete update if provided (can set to true to deactivate)
      if (soft_delete !== undefined) {
        if (typeof soft_delete !== "boolean") {
          return res.status(400).json({ message: "soft_delete must be a boolean value (true or false)" });
        }
        genre.soft_delete = soft_delete; // Can be true or false when soft_delete is false
      }
    } else {
      // Case 2: If soft_delete is true, only allow setting soft_delete to false and optionally update genre_name
      if (soft_delete !== undefined) {
        if (typeof soft_delete !== "boolean") {
          return res.status(400).json({ message: "soft_delete must be a boolean value (true or false)" });
        }
        if (soft_delete !== false) {
          return res.status(400).json({ message: "Cannot update a deleted genre; set soft_delete to false to reactivate and modify" });
        }
        // Allow updating genre_name only if reactivating
        if (genre_name !== undefined) {
          if (typeof genre_name !== "string" || genre_name.trim() === "") {
            return res.status(400).json({ message: "Genre name must be a non-empty string" });
          }

          const trimmedGenreName = genre_name.trim();
          const normalizedGenreName = normalizeGenreName(trimmedGenreName);

          // Case-insensitive duplicate check, excluding the current genre
          const existingGenre = await Genre.findOne({
            genre_name: { $regex: `^${trimmedGenreName}$`, $options: "i" },
            soft_delete: false,
            _id: { $ne: id },
          });

          if (existingGenre) {
            return res.status(400).json({
              message: `Genre '${trimmedGenreName}' already exists as '${existingGenre.genre_name}'`,
            });
          }

          genre.genre_name = normalizedGenreName;
        }
        genre.soft_delete = false; // Reactivate the genre
      } else {
        // No soft_delete change requested, no updates allowed
        return res.status(400).json({ message: "Cannot update a deleted genre; set soft_delete to false to reactivate and modify" });
      }
    }

    await genre.save();
    res.status(200).json(genre);
  } catch (error) {
    console.error("Error updating genre:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      params: req.params,
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/users/:userId", protectRoute, isAdmin, async (req, res) => {
  try {
      const { userId } = req.params;
      if (req.user._id.toString() === userId) {
          return res.status(400).json({ message: "Admin cannot delete their own account via this API." });
      }

      const userToDelete = await User.findById(userId);
      if (!userToDelete) {
          return res.status(404).json({ message: "User not found." });
      }

      // **Xử lý các dữ liệu liên quan TRƯỚC KHI xóa User (Rất quan trọng):**
      // 1. Xóa tất cả Sách (Books) của User này
      const userBooks = await Book.find({ user: userId });
      for (const book of userBooks) {
          // Xóa ảnh của sách trên Cloudinary
          if (book.image && book.image.includes("cloudinary")) {
              try {
                  const publicId = book.image.split("/").pop().split(".")[0];
                  await cloudinary.uploader.destroy(publicId);
                  console.log(`Cloudinary image for book ${book._id} deleted.`);
              } catch (cloudError) {
                  console.error(`Error deleting Cloudinary image for book ${book._id}:`, cloudError);
              }
          }
          // Xóa tất cả Comments của sách này
          await Comment.deleteMany({ book: book._id });
          console.log(`Comments for book ${book._id} (owned by user ${userId}) deleted.`);
          await Report.deleteMany({ reportedItemType: "Book", reportedItemId: book._id });
      }
      await Book.deleteMany({ user: userId });
      console.log(`All books by user ${userId} deleted.`);

      // 2. Xóa tất cả Comments do User này viết
      await Comment.deleteMany({ user: userId });
      console.log(`All comments by user ${userId} deleted.`);

      // 3. Xóa tất cả Reports do User này gửi hoặc về User này
      await Report.deleteMany({ reporter: userId });
      await Report.deleteMany({ reportedItemType: "User", reportedItemId: userId });
      console.log(`All reports related to user ${userId} deleted.`);

      // 4. Xử lý các mối quan hệ khác nếu có (ví dụ: likes, followers,...)
      console.log(`Removing likes/dislikes from user ${userId} on other books...`);
      await Book.updateMany(
          { likedBy: userId }, 
          {
              $pull: { likedBy: userId }, // Gỡ user ID khỏi mảng likedBy
              $inc: { like_count: -1 }     // Giảm like_count đi 1
          }
      );
      await Book.updateMany(
          { dislikedBy: userId }, // Tìm tất cả sách mà user này đã không thích
          {
              $pull: { dislikedBy: userId }, // Gỡ user ID khỏi mảng dislikedBy
              $inc: { dislike_count: -1 }   // Giảm dislike_count đi 1
          }
      );
      console.log(`Likes/dislikes by user ${userId} on other books have been removed and counts updated.`);
      const emailToNotify = userToDelete.email;
      const usernameToNotify = userToDelete.username;
      // Cuối cùng, xóa User
      await User.findByIdAndDelete(userId);
      if (emailToNotify) { // Chỉ gửi nếu user có email
        const appName = process.env.SENDGRID_FROM_NAME || 'Bookworm App';
        const emailSubject = `Thông báo quan trọng về tài khoản của bạn trên ${appName}`;
        const emailMessage =
`Chào ${usernameToNotify || 'Người dùng'},

Chúng tôi rất tiếc phải thông báo rằng tài khoản của bạn trên ${appName} đã bị xóa vĩnh viễn theo quyết định của quản trị viên.
Tất cả dữ liệu liên quan đến tài khoản của bạn, bao gồm các bài viết, bình luận và hoạt động khác, cũng đã được gỡ bỏ.

Nếu bạn có bất kỳ câu hỏi nào hoặc cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.

Trân trọng,
Đội ngũ ${appName}`;
        try {
            await sendEmail({
                email: emailToNotify,
                subject: emailSubject,
                message: emailMessage,
            });
            console.log(`Notification email about account deletion sent to ${emailToNotify}.`);
        } catch (emailError) {
            console.error(`Failed to send account deletion notification email to ${emailToNotify}:`, emailError);
        }
    }

      res.json({ message: `User ${userToDelete.username} (ID: ${userId}) and all associated data have been permanently deleted.` });

  } catch (error) {
      console.error("Error permanently deleting user:", error);
      if (error.kind === 'ObjectId') {
          return res.status(404).json({ message: "User not found or invalid ID." });
      }
      res.status(500).json({ message: "Internal server error during user deletion." });
  }
});



router.post("/users/:userId/warn", protectRoute, isAdmin, async (req, res) => {
  try {
      const { userId } = req.params;
      const { reason, details } = req.body; // Lý do cảnh cáo và chi tiết

      if (!reason) {
          return res.status(400).json({ message: "Warning reason is required." });
      }

      const userToWarn = await User.findById(userId);
      if (!userToWarn) {
          return res.status(404).json({ message: "User not found." });
      }

      // Logic gửi email cảnh cáo
      if (userToWarn.email) {
          const appName = process.env.SENDGRID_FROM_NAME || 'Bookworm App';
          const emailSubject = `Cảnh cáo chính thức từ ${appName}`;
          const emailMessage =
`Chào ${userToWarn.username},

Đây là một cảnh cáo chính thức liên quan đến hoạt động của bạn trên ${appName}.
Lý do cảnh cáo: ${reason}
${details ? `Chi tiết thêm: ${details}\n` : ''}
Chúng tôi yêu cầu bạn tuân thủ các quy tắc và chính sách cộng đồng của chúng tôi. Các vi phạm tiếp theo có thể dẫn đến các biện pháp xử lý nghiêm khắc hơn, bao gồm cả việc tạm khóa hoặc chấm dứt tài khoản.

Nếu bạn có câu hỏi, vui lòng liên hệ bộ phận hỗ trợ.

Trân trọng,
Đội ngũ ${appName}`;

          try {
              await sendEmail({
                  email: userToWarn.email,
                  subject: emailSubject,
                  message: emailMessage,
              });
              console.log(`Warning email sent to user ${userToWarn.username} (${userToWarn.email}).`);
              res.json({ message: `Warning sent to user ${userToWarn.username}.` });
          } catch (emailError) {
              console.error(`Failed to send warning email to ${userToWarn.email}:`, emailError);
              res.status(500).json({ message: "Warning noted, but failed to send email notification." });
          }
      } else {
          res.status(400).json({ message: `User ${userToWarn.username} does not have an email address for notification.` });
      }
  } catch (error) {
      console.error("Error sending warning to user:", error);
      if (error.kind === 'ObjectId') {
          return res.status(404).json({ message: "User not found or invalid ID." });
      }
      res.status(500).json({ message: "Internal server error." });
  }
});



router.post("/users/:userId/suspend", protectRoute, isAdmin, async (req, res) => {
  try {
      const { userId } = req.params;
      const { durationDays, reason } = req.body; // Số ngày khóa và lý do

      if (!durationDays || !Number.isInteger(parseInt(durationDays)) || parseInt(durationDays) <= 0) {
          return res.status(400).json({ message: "Valid suspension duration (in days) is required." });
      }
      if (!reason) {
          return res.status(400).json({ message: "Suspension reason is required." });
      }

      const userToSuspend = await User.findById(userId);
      if (!userToSuspend) {
          return res.status(404).json({ message: "User not found." });
      }

      if (userToSuspend.isSuspended && userToSuspend.suspensionEndDate > new Date()) {
          return res.status(400).json({ message: `User is already suspended until ${userToSuspend.suspensionEndDate.toISOString()}.` });
      }


      const duration = parseInt(durationDays);
      userToSuspend.isSuspended = true;
      const suspensionEnd = new Date();
      suspensionEnd.setDate(suspensionEnd.getDate() + duration);
      userToSuspend.suspensionEndDate = suspensionEnd;
      userToSuspend.suspensionReason = reason.trim();
      await userToSuspend.save();

      console.log(`User account ${userToSuspend._id} (${userToSuspend.username}) suspended by admin for ${duration} days until ${suspensionEnd.toISOString()}.`);
      let message = `User ${userToSuspend.username} has been suspended for ${duration} days.`;

      // Gửi email thông báo
      if (userToSuspend.email) {
          const appName = process.env.SENDGRID_FROM_NAME || 'Bookworm App';
          const emailSubject = `Thông báo: Tài khoản của bạn đã bị tạm khóa trên ${appName}`;
          const emailMessage =
`Chào ${userToSuspend.username},

Tài khoản của bạn trên ${appName} đã bị tạm khóa ${duration} ngày.
Thời gian tạm khóa sẽ kết thúc vào: ${suspensionEnd.toLocaleString('vi-VN')}.
Lý do tạm khóa: ${reason}

Trong thời gian này, một số chức năng của tài khoản có thể bị hạn chế.
Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ với bộ phận hỗ trợ.

Trân trọng,
Đội ngũ ${appName}`;
          try {
              await sendEmail({ email: userToSuspend.email, subject: emailSubject, message: emailMessage });
              message += " Notification email sent to user.";
          } catch (emailError) {
              console.error(`Failed to send suspension email to ${userToSuspend.email}:`, emailError);
              message += " Failed to send email notification.";
          }
      }
      res.json({ message });

  } catch (error) {
      console.error("Error suspending user:", error);
      if (error.kind === 'ObjectId') {
          return res.status(404).json({ message: "User not found or invalid ID." });
      }
      res.status(500).json({ message: "Internal server error." });
  }
});


router.delete("/books/:bookId", protectRoute, isAdmin, async (req, res) => {
  try {
      const { bookId } = req.params;
      const bookToDelete = await Book.findById(bookId);

      if (!bookToDelete) {
          return res.status(404).json({ message: "Book not found." });
      }

      // Xóa ảnh của sách trên Cloudinary
      if (bookToDelete.image && bookToDelete.image.includes("cloudinary")) {
          try {
              const publicId = bookToDelete.image.split("/").pop().split(".")[0];
              await cloudinary.uploader.destroy(publicId);
              console.log(`Cloudinary image for book ${bookToDelete._id} deleted by admin.`);
          } catch (cloudError) {
              console.error(`Error deleting Cloudinary image for book ${bookToDelete._id} by admin:`, cloudError);
              // Tiếp tục xóa sách dù có lỗi xóa ảnh
          }
      }

      // Xóa tất cả Comments của sách này
      await Comment.deleteMany({ book: bookId });
      console.log(`Comments for book ${bookId} deleted by admin.`);

      // Xóa tất cả Reports liên quan đến Sách này
      await Report.deleteMany({ reportedItemType: "Book", reportedItemId: bookId });
      console.log(`Reports related to book ${bookId} deleted by admin.`);

      // Xóa Sách
      await Book.findByIdAndDelete(bookId);

      // (Tùy chọn) Gửi email thông báo cho người tạo sách
      const bookOwner = await User.findById(bookToDelete.user);
      if (bookOwner && bookOwner.email) {
          const appName = process.env.SENDGRID_FROM_NAME || 'Bookworm App';
          const emailSubject = `Thông báo: Nội dung của bạn đã bị quản trị viên gỡ bỏ trên ${appName}`;
          const emailMessage =
`Chào ${bookOwner.username},

Sách của bạn có tựa đề "${bookToDelete.title}" đã bị quản trị viên gỡ bỏ vĩnh viễn khỏi ${appName}.
Lý do: Quyết định của quản trị viên (có thể do vi phạm nghiêm trọng hoặc yêu cầu đặc biệt).

Nếu bạn có câu hỏi, vui lòng liên hệ bộ phận hỗ trợ.

Trân trọng,
Đội ngũ ${appName}`;
          try {
              await sendEmail({ email: bookOwner.email, subject: emailSubject, message: emailMessage });
          } catch (emailError) {
              console.error("Failed to send book deletion notification by admin:", emailError);
          }
      }

      res.json({ message: `Book "${bookToDelete.title}" (ID: ${bookId}) and associated comments/reports have been permanently deleted by admin.` });

  } catch (error) {
      console.error("Error permanently deleting book by admin:", error);
      if (error.kind === 'ObjectId') {
          return res.status(404).json({ message: "Book not found or invalid ID." });
      }
      res.status(500).json({ message: "Internal server error during book deletion." });
  }
});


export default router;
