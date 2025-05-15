import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const generateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "15d"});
};


router.post("/register", async (req,res) => {
    try{
        const {email,username,password}=req.body;
        if(!username || !email || !password){
            return res.status(400).json({ message: "all fields are required" });
        }
        if(password.length<6){
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }
        if(username.length<3){
            return res.status(400).json({message: "Username must be at least 3 characters"});
        }
        //const existingUser = await User.findOne({$or: [{email}, {username}]});
        //if(existingUser) return res.status(400).json({message: "User already exists"});
        const existingEmail = await User.findOne({email});
        if (existingEmail){
            return res.status(400).json({message: "email already exists"});
        }
        const existingUsername = await User.findOne({username});
        if (existingUsername){
            return res.status(400).json({message: "username already exists"});
        }
        const profileImage = `https://api.dicebear.com/6.x/initials/svg?seed=${username}`;
        const user = new User({
            email,
            username,
            password,
            profileImage,
        });
        await user.save();
        const token = generateToken(user._id);
        res.status(201).json({
            token,
            user:{
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            }
        });
    }
    catch (error){
        console.log("error in register route", error);
        res.status(500).json({message: "Internal server error"});
    }
});
router.post("/login", async (req,res) => {
    res.send("login");
});

export default router;