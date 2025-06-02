import express from "express";
import bcrypt, { compare } from "bcryptjs"; 
import cloudinary from "../lib/cloudinary.js"; 
import User from "../models/user.js"; 
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// --- GET User Profile --> để mở ra một trang UI chỉnh thông tin || dùng để Get thông tin tính năng follow
// fetching any user's public profile -> tất cả có thể xem thông tin của nhaunhau
router.get("/:id", protectRoute, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password"); // Exclude password
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user:", error.message);

        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid User ID format" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});


// --- Update user 
router.patch("/:id", protectRoute, async (req, res) => {
    try {
        const { username, password, currentPassword, profileImage } = req.body; // Correct destructuring
        const userId = req.params.id;

        // Authorize user
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Initialize updates object to track changes
        const updates = {};

        // Handle password update
        if (password !== undefined) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required to change your password." });
            }

            if (password.length < 6) {
                return res.status(400).json({ message: "New password must be at least 6 characters long." });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            console.log("Current password match status:", isMatch);

            if (!isMatch) {
                return res.status(401).json({ message: "Incorrect current password." });
            }

            // Set plain-text password; let pre-save hook handle hashing
            updates.password = password;
            console.log("Password set for update (plain-text, will be hashed by pre-save hook).");
        }

        // Handle username update
        if (username !== undefined) {
            updates.username = username;
        }

        // Handle profile image update
        if (profileImage !== undefined) {
            // Delete old image from Cloudinary if it exists
            if (user.profileImage && user.profileImage.includes("cloudinary")) {
                try {
                    const parts = user.profileImage.split('/');
                    const oldPublicId = parts.slice(parts.indexOf('upload') + 2).join('/').split('.')[0];
                    await cloudinary.uploader.destroy(oldPublicId);
                } catch (deleteError) {
                    console.error("Error deleting old profile image from Cloudinary:", deleteError);
                    // Continue despite deletion error
                }
            }

            // Upload new profile image
            try {
                const uploadResponse = await cloudinary.uploader.upload(profileImage, {
                    folder: "Book_Forum/User"
                });
                updates.profileImage = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error("Error uploading new profile image to Cloudinary:", uploadError);
                return res.status(500).json({ message: "Failed to upload new profile image." });
            }
        }

        // Update lại toàn bộ chổ nào user cần update - xem như là 1 objectobject
        Object.assign(user, updates);

        // Save the user (triggers pre-save hook for password hashing)
        await user.save();

        // Send response
        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                password: user.password // Note: Do not send password in response
            }
        });

    } catch (error) {
        console.error("Error updating user profile:", error.message);
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `The ${field} '${error.keyValue[field]}' is already taken.` });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

// Deactivate/Self-Delete - tự khóa và xóa acc
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: You can only delete your own account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // OPTION 1: Xóa tất cả books và comments của user
    await Book.deleteMany({ user: userId });
    await Comment.deleteMany({ user: userId });

    // OPTION 2: Hoặc giữ lại books nhưng đánh dấu là "deleted user"
    // await Book.updateMany(
    //   { user: userId },
    //   { $unset: { user: 1 } } // Xóa reference đến user
    // );

    await User.deleteOne({ _id: userId });

    res.status(200).json({ message: "Account and associated data deleted successfully" });
  } catch (error) {
    console.error("Error deleting user account:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Thêm route để lấy tất cả người dùng (chỉ admin mới được phép)
router.get("/", protectRoute, async (req, res) => {
  try {
    // Kiểm tra xem người dùng hiện tại có quyền admin không
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    // Lấy tất cả người dùng từ database, trừ trường password
    const users = await User.find({}).select("-password");
    
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


export default router;