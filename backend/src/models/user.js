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
    password:{
        type: String,
        required: true,
        minlength: 6,
    },
    profileImage:{
        type: String,
        default: "",
    }, resetPasswordToken: String, // Sẽ lưu trữ HASH của mã xác nhận
    resetPasswordExpires: Date,
}, {
    timestamps: true
});
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
    // Tạo mã xác nhận ngẫu nhiên (ví dụ: 6 chữ số)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // Mã 6 chữ số

    // Hash mã này và lưu vào resetPasswordToken field của user
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetCode)
        .digest('hex');

    // Đặt thời gian hết hạn (ví dụ: 10 phút)
    this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    return resetCode; // Trả về mã CHƯA HASH để gửi qua email
};

const User = mongoose.model("User",userSchema);

export default User; // users as the wrapper for schema 