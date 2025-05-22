import express from "express";
import bcrypt from "bcryptjs"; 
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
        const { username, email, password, profileImage } = req.body;
        const userId = req.params.id;

        // Authorize người dùng được chỉnh sửa
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (username !== undefined) {
            user.username = username;
        }
        if (email !== undefined) {
            user.email = email;
        } 

        // Update mật khẩu sơ khai - chưa quá nhiều lớplớp
        if (password !== undefined && password.length >= 6) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        } else if (password !== undefined && password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        if (profileImage !== undefined) {
            // xóa ảnh cũ trên Cloudinary nếu có
            if (user.cloudinaryPublicId) {
                await cloudinary.uploader.destroy(user.cloudinaryPublicId);
            }

            // if (user.cloudinaryPublicId && profileImage.includes("cloudinary") ) {
            //     try {
            //         const publicId = profileImage.split("/").pop().split(".")[0]; //tách đường link lấy qyup61vejflxxw8igvi0.png --> và lấy vị trí [0] tức lấy ảnh
            //         await cloudinary.uploader.destroy(publicId);
            //     } catch (deleteError) {
            //         console.log("Error deleting image from cloudinary", deleteError);
            //     }
            // }

            const uploadResponse = await cloudinary.uploader.upload(profileImage, {
                folder: "Book_Forum/User" // New folder for user profile images
            });
            user.profileImage = uploadResponse.secure_url;
        }

        await user.save(); 

        // const updatedUser = user.toObject(); 
        // delete updatedUser.password;

        res.status(200).json({ message: "Profile updated successfully", user });

    } catch (error) {
        console.error("Error updating user profile:", error.message);
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `The ${field} '${error.keyValue[field]}' is already taken.` });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

// Deactivate/Self-Deletee - tự khóa và xóa accacc
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
        
        // OPTIONAL: Xóa user vẫn còn sáchsách (e.g., all books created by this user)
        // This is a critical design decision. If you delete a user, what happens to their content?
        // You might want to:
        // 1. Delete all books owned by this user: await Book.deleteMany({ user: userId });
        // 2. Transfer ownership of books to an 'anonymous' user.
        // 3. Mark books as 'deleted by owner' but keep the book data.
        // For this example, we'll just delete the user.

        // OPTIONAL: Delete profile image from Cloudinary
        // if (user.cloudinaryPublicId) {
        //     await cloudinary.uploader.destroy(user.cloudinaryPublicId);
        // }
        await User.deleteOne({ _id: userId }); 

        res.status(200).json({ message: "Account deactivated/deleted successfully" });

    } catch (error) {
        console.error("Error deleting user account:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});


export default router;