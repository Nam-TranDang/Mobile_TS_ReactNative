import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"], // Các vai trò có thể có
        default: "user",       // Vai trò mặc định khi đăng ký
    },
    password:{
        type: String,
        required: true,
        minlength: 6,
    },
    profileImage:{
        type: String,
        default: "",
    }, resetPasswordToken: String, 
    resetPasswordExpires: Date,
}, {
    timestamps: true
});

// Hook để mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
userSchema.pre("save",async function(next){
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function(userPassword){
    return await bcrypt.compare(userPassword, this.password);
};

userSchema.methods.getResetPasswordCode = function() {
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetCode)
        .digest('hex');
    this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    return resetCode; 
};

const User = mongoose.model("User",userSchema);

export default User; // users as the wrapper for schema 