import express from "express";
import bcrypt, { compare } from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.js";
import protectRoute from "../middleware/auth.middleware.js";
import Book from "../models/book.js"; // Add this import
import Comment from "../models/comment.js"; // Add this import
import mongoose from "mongoose";
import { createAndSendNotification } from "../lib/notificationHelper.js";

const router = express.Router();

// Đặt các routes cụ thể đầu tiên
router.get("/search", protectRoute, async (req, res) => {
  try {
    const searchQuery = req.query.q;
    if (!searchQuery) {
      return res.status(200).json([]);
    }

    // Tìm người dùng theo username
    const users = await User.find({
      username: { $regex: searchQuery, $options: "i" },
    }).select("username profileImage _id");

    // Thêm số sách đã đăng
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const bookCount = await Book.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          bookCount,
        };
      })
    );

    res.status(200).json(usersWithCounts);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/suggestions", protectRoute, async (req, res) => {
  try {
    // Lấy người dùng có nhiều sách nhất
    const users = await User.aggregate([
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "user",
          as: "books",
        },
      },
      { $addFields: { bookCount: { $size: "$books" } } },
      { $sort: { bookCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          username: 1,
          profileImage: 1,
          bookCount: 1,
        },
      },
    ]);

    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting suggested users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// --- GET User Profile --> để mở ra một trang UI chỉnh thông tin || dùng để Get thông tin tính năng follow
// fetching any user's public profile -> tất cả có thể xem thông tin của nhau
router.get("/:id", protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "username profileImage _id") // <--- THÊM MỚI: Populate followers
      .populate("following", "username profileImage _id"); // Exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.toObject());
  } catch (error) {
    console.error("Error fetching user:", error.message);

    if (error.kind === "ObjectId") {
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
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own profile" });
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
        return res.status(400).json({
          message: "Current password is required to change your password.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: "New password must be at least 6 characters long.",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      console.log("Current password match status:", isMatch);

      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect current password." });
      }

      // Set plain-text password; let pre-save hook handle hashing
      updates.password = password;
      console.log(
        "Password set for update (plain-text, will be hashed by pre-save hook)."
      );
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
          const parts = user.profileImage.split("/");
          const oldPublicId = parts
            .slice(parts.indexOf("upload") + 2)
            .join("/")
            .split(".")[0];
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (deleteError) {
          console.error(
            "Error deleting old profile image from Cloudinary:",
            deleteError
          );
          // Continue despite deletion error
        }
      }

      // Upload new profile image
      try {
        const uploadResponse = await cloudinary.uploader.upload(profileImage, {
          folder: "Book_Forum/User",
        });
        updates.profileImage = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error(
          "Error uploading new profile image to Cloudinary:",
          uploadError
        );
        return res
          .status(500)
          .json({ message: "Failed to upload new profile image." });
      }
    }

    // Update lại toàn bộ chổ nào user cần update - xem như là 1 object
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
        password: user.password, // Note: Do not send password in response
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        message: `The ${field} '${error.keyValue[field]}' is already taken.`,
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Deactivate/Self-Delete - tự khóa và xóa acc
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.user._id.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only delete your own account" });
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

    res
      .status(200)
      .json({ message: "Account and associated data deleted successfully" });
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

router.patch("/admin/profile", protectRoute, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const { username, password, currentPassword, profileImage } = req.body;
    const userId = req.user._id; // Lấy ID từ token, không từ params

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize updates object
    const updates = {};

    // Handle profile image update
    if (profileImage !== undefined) {
      // Delete old image from Cloudinary if it exists
      if (user.profileImage && user.profileImage.includes("cloudinary")) {
        try {
          const parts = user.profileImage.split("/");
          const oldPublicId = parts
            .slice(parts.indexOf("upload") + 2)
            .join("/")
            .split(".")[0];
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (deleteError) {
          console.error("Error deleting old profile image:", deleteError);
        }
      }

      // Upload new profile image
      const uploadResponse = await cloudinary.uploader.upload(profileImage, {
        folder: "Book_Forum/Admin",
      });

      updates.profileImage = uploadResponse.secure_url;
    }

    // Apply updates
    Object.assign(user, updates);
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:userIdToFollow/follow", protectRoute, async (req, res) => {
  try {
    const userIdToFollow = req.params.userIdToFollow;
    const currentUserId = req.user._id;
    const io = req.io;

    if (!mongoose.Types.ObjectId.isValid(userIdToFollow)) {
      return res.status(400).json({ message: "Invalid user ID to follow." });
    }

    if (currentUserId.toString() === userIdToFollow) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    const userToFollow = await User.findById(userIdToFollow);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (currentUser.following.includes(userIdToFollow)) {
      return res
        .status(400)
        .json({ message: "You are already following this user." });
    }

    currentUser.following.push(userIdToFollow);
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();
    const notificationMessage = `${currentUser.username} đã bắt đầu theo dõi bạn.`;
    const notificationLink = `/profile/${currentUserId.toString()}`; // Link đến profile người follow
    await createAndSendNotification(
        io,
        userIdToFollow, // Người nhận là userToFollow
        currentUserId,  // Người gửi là currentUser
        "new_follower",
        notificationMessage,
        notificationLink,
        "User",         // relatedItemType là User (sender)
        currentUserId   
    );
    const simplifiedCurrentUser = {
      _id: currentUser._id,
      username: currentUser.username,
      profileImage: currentUser.profileImage,
    };
    const simplifiedUserToFollow = {
      _id: userToFollow._id,
      username: userToFollow.username,
      profileImage: userToFollow.profileImage,
    };

    if (io) {
      io.to(`userRoom_${userIdToFollow}`).emit("userFollowUpdate", {
        action: "newFollower",
        follower: simplifiedCurrentUser,

        updatedTargetUser: userToFollow.toObject(),
      });

      io.to(`userRoom_${currentUserId.toString()}`).emit("userFollowUpdate", {
        action: "followingSomeone",
        followedUser: simplifiedUserToFollow,

        updatedCurrentUser: currentUser.toObject(),
      });
      console.log(
        `User ${currentUser.username} followed ${userToFollow.username}. Emitting updates.`
      );
    }

    res.status(200).json({
      message: `Successfully followed ${userToFollow.username}.`,
      currentUser: currentUser.toObject(),
      followedUser: userToFollow.toObject(),
    });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/:userIdToUnfollow/unfollow", protectRoute, async (req, res) => {
  try {
    const userIdToUnfollow = req.params.userIdToUnfollow;
    const currentUserId = req.user._id;
    const io = req.io;
    if (!mongoose.Types.ObjectId.isValid(userIdToUnfollow)) {
      return res.status(400).json({ message: "Invalid user ID to unfollow." });
    }

    const userToUnfollow = await User.findById(userIdToUnfollow);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!currentUser.following.includes(userIdToUnfollow)) {
      return res
        .status(400)
        .json({ message: "You are not following this user." });
    }

    currentUser.following.pull(userIdToUnfollow);
    userToUnfollow.followers.pull(currentUserId);

    await currentUser.save();
    await userToUnfollow.save();

    const simplifiedCurrentUser = {
      _id: currentUser._id,
      username: currentUser.username,
      profileImage: currentUser.profileImage,
    };
    const simplifiedUserToUnfollow = {
      _id: userToUnfollow._id,
      username: userToUnfollow.username,
      profileImage: userToUnfollow.profileImage,
    };

    if (io) {
      io.to(`userRoom_${userIdToUnfollow}`).emit("userFollowUpdate", {
        action: "lostFollower",
        unfollower: simplifiedCurrentUser,
        updatedTargetUser: userToUnfollow.toObject(),
      });

      // Thông báo cho NGƯỜI THỰC HIỆN UNFOLLOW
      io.to(`userRoom_${currentUserId.toString()}`).emit("userFollowUpdate", {
        action: "unfollowedSomeone",
        unfollowedUser: simplifiedUserToUnfollow,
        updatedCurrentUser: currentUser.toObject(),
      });
      console.log(
        `User ${currentUser.username} unfollowed ${userToUnfollow.username}. Emitting updates.`
      );
    }

    res.status(200).json({
      message: `Successfully unfollowed ${userToUnfollow.username}.`,
      currentUser: currentUser.toObject(),
      unfollowedUser: userToUnfollow.toObject(),
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/:userId/followers", protectRoute, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }
    const user = await User.findById(userId)
      .select("username followersCount")
      .populate({
        path: "followers",
        select: "username profileImage _id",
        options: {
          sort: { username: 1 },
          skip: skip,
          limit: limit,
        },
      });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const totalFollowers = await User.countDocuments({
      _id: userId,
      "followers.0": { $exists: true },
    }).then(
      async () =>
        (
          await User.findById(userId).select("followers")
        ).followers.length
    );
    res.json({
      followers: user.followers,
      currentPage: page,
      totalFollowers: totalFollowers,
      totalPages: Math.ceil(totalFollowers / limit),
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/:userId/following", protectRoute, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }
    const user = await User.findById(userId)
      .select("username followingCount")
      .populate({
        path: "following",
        select: "username profileImage _id",
        options: {
          sort: { username: 1 },
          skip: skip,
          limit: limit,
        },
      });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const totalFollowing = await User.findById(userId)
      .select("following")
      .then((u) => u.following.length);
    res.json({
      following: user.following,
      currentPage: page,
      totalFollowing: totalFollowing,
      totalPages: Math.ceil(totalFollowing / limit),
    });
  } catch (error) {
    console.error("Error fetching following:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
