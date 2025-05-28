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
// router.patch("/:id", protectRoute, async (req, res) => {
//     try {
//         const { username,  _password: password, currentPassword, profileImage } = req.body;
//         const userId = req.params.id;
//         // Authorize người dùng được chỉnh sửa
//         if (req.user._id.toString() !== userId) {
//             return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
//         }
//         // console.log("User ID from request:", req.body);
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }
//         console.log(req.body);
//         // Check if a new password is provided (indicating a password change attempt)
//         if (password !== undefined ) { // 'password' here is the new password
//             console.log("hello");

//             if (password.length >= 6) {
//                 return res.status(400).json({ message: "New password must be at least 6 characters long." });
//             }
//             // Check pass cũ cos ton tai 
//             console.log("pass:", user.toObject().password);

//             if (!currentPassword) {
//                 return res.status(400).json({ message: "Current password is required to change your password." });
//             }

                    
//             // const compare = await user.comparePassword(currentPassword);
//             // if (compare === false) {
//             //     return res.status(401).json({ message: "Incorrect current password." });
//             // }
            
            
//             // If current password is correct, hash and set the new password
//             // const salt = await bcrypt.genSalt(10);
//             // user.password = await bcrypt.hash(_password, salt); // 'password' is the new password
            

//             const isMatch = await bcrypt.compare(currentPassword, user.password);
//             console.log("Current password match status:", isMatch);

//             console.log("Current password match status:", isMatch);

//             if (!isMatch) {
//                 return res.status(401).json({ message: "Incorrect current password." });
//             }

//             // If current password is correct, HASH THE NEW PASSWORD ONCE
//             const salt = await bcrypt.genSalt(10);
//             user.password = await bcrypt.hash(password, salt); 
//             console.log("Password successfully updated.");
//         }
//         await user.save();
//         res.status(200).json({ message: "Profile updated successfully", user });

//         if (username !== undefined) {
//             user.username = username;
//         }
   
//         // Update ảnhảnh
//         if (profileImage !== undefined) {
//             // Step 1. Delete old image from Cloudinary (if it exists)
//             if (user.profileImage && user.profileImage.includes("cloudinary")) {
//                 try {
//                     const parts = user.profileImage.split('/'); // cắt ra thành các phần từ dấu "/" - same như xóa sáchsách

//                     const oldPublicId = parts.slice(parts.indexOf('upload') + 2).join('/'); //bắt đầu đi từ index "upload" trong đoạn parts, và bỏ 2 phần tử đầu là upload và id và nối lại các phần còn lại
//                     console.log("Public ID with version and extension:", oldPublicId);

//                     const publicId = oldPublicId.split('.')[0];
//                     await cloudinary.uploader.destroy(publicId);
                  
//                 } catch (deleteError) {
//                     console.error("Error deleting old profile image from Cloudinary:", deleteError);
//                     // Decide whether to proceed or return an error if deletion fails
//                 }
//             }

//             // Upload ảnh mớimới
//             try{
//                 const uploadResponse = await cloudinary.uploader.upload(profileImage, {
//                     folder: "Book_Forum/User" // New folder for user profile images
//                 });
//                 user.profileImage = uploadResponse.secure_url;
//             } catch (uploadError) {
//                 console.error("Error uploading new profile image to Cloudinary:", uploadError);
//                 return res.status(500).json({ message: "Failed to upload new profile image." });
//             }
            
//         }

//         await user.save();
//         res.status(200).json({ message: "Profile updated successfully", user });

//     } catch (error) {
//         console.error("Error updating user profile:", error.message);
//         if (error.code === 11000) {
//             const field = Object.keys(error.keyValue)[0];
//             return res.status(400).json({ message: `The ${field} '${error.keyValue[field]}' is already taken.` });
//         }
//         res.status(500).json({ message: "Internal server error" });
//     }
// });

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