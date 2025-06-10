import express from "express";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

// Create JWT within 15days - Access token (this case exist for 15 days) 
// jwt.sign() create header - payload - signature 
// header: implicitly defined by jwt.sign + payload: use the user_id + signature: use the private key from Server.
// token --> use for authentication purpose only
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
        
        // Kiểm tra định dạng email hợp lệ - Regular Expression (Regex) 
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({message: "Invalid email format"});
        }
    
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
            role: "user" // mặc định
        });
        await user.save();
        
        // THÊM ĐOẠN NÀY - Emit to admin clients khi có user mới đăng ký -> fix một chút 
        if (req.emitToAdmins) {
        req.emitToAdmins("newUser", {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
        }
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
    try{
        const {email,password}= req.body;
        if(!email || !password) return res.status(400).json({message:"All fields are required"});
        

        const user = await User.findOne({email});
        if(!user) return res.status(400).json({message:"User does not exist"});

        const isPasswordCorrect = await user.comparePassword(password); 
        if(!isPasswordCorrect) return res.status(400).json({message: "invalid credentials"});
        if (user.isSuspended && user.suspensionEndDate && user.suspensionEndDate <= new Date()) {
            await user.checkAndLiftSuspension();
        }

        
        if (user.isSuspended) {
            
            if (user.suspensionEndDate && user.suspensionEndDate > new Date()) {
                return res.status(403).json({
                    message: "Forbidden: Your account is currently suspended.",
                    reason: user.suspensionReason,
                    suspensionEndDate: user.suspensionEndDate.toISOString(),
                });
            } else { 
                return res.status(403).json({
                    message: "Forbidden: Your account is suspended indefinitely or status unclear. Please contact support.",
                    reason: user.suspensionReason,
                });
            }
        }
        const token = generateToken(user._id);
        res.status(200).json({
            token,
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                password: user.password, // Note: Avoid sending password in response
                role: user.role
            },
        });
    }
    catch(error){
        console.log("error in login route", error);
        res.status(500).json({message: "Internal server error"});
    }
});

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email' });
    }
    try {
        const user = await User.findOne({ email });
        // Do dự án vẫn dùng email giả lập --> nếu email thật thì sẽ được gửi
        if (!user) {
            console.warn(`Yêu cầu reset mật khẩu cho email không tồn tại: ${email}`);
            return res.status(200).json({ success: true, message: 'Nếu email của bạn tồn tại, một mã xác nhận sẽ được gửi.' });
        }

        const resetCode = user.getResetPasswordCode(); 
        await user.save({ validateBeforeSave: false });
        const message = `
            Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
            Mã xác nhận của bạn là: ${resetCode}
            \n\n
            Mã này sẽ hết hạn sau 10 phút.
            Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.
        `;
        const emailSent = await sendEmail({
            email: user.email,
            subject: 'Mã xác nhận đặt lại mật khẩu',
            message,
        });
        
        if (emailSent) {
            res.status(200).json({ success: true, message: 'Mã xác nhận đã được gửi tới email của bạn.' });
        } else {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save({ validateBeforeSave: false });
            res.status(500).json({ success: false, message: 'Lỗi gửi email. Vui lòng thử lại.' });
        }

    } catch (error) {
        console.error('Lỗi /forgot-password:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
});

router.post("/reset-password", async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email, mã xác nhận và mật khẩu mới.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }



    try {
        const user = await User.findOne({
            email,
            resetPasswordExpires: { $gt: Date.now() }, //*$ gt la toan tu >= dc su dung trong Mongodb 
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Email không tồn tại hoặc mã xác nhận đã hết hạn.' });
        }



        
        const hashedCode = crypto
            .createHash('sha256')
            .update(code)
            .digest('hex');

        if (user.resetPasswordToken !== hashedCode) {
            return res.status(400).json({ success: false, message: 'Mã xác nhận không đúng.' });
        }
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        const confirmationMessage = `Mật khẩu cho tài khoản ${user.email} của bạn vừa được thay đổi thành công.`;
        await sendEmail({
            email: user.email,
            subject: 'Mật khẩu đã được thay đổi',
            message: confirmationMessage,
        });

        res.status(200).json({ success: true, message: 'Mật khẩu đã được đặt lại thành công.' });

    } catch (error) {
        console.error('Lỗi /reset-password:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
});

export default router;