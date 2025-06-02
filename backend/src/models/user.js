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
        enum: ["user", "admin"],
        default: "user",       
    },
    password:{
        type: String,
        required: true,
        minlength: 6,
    },
    profileImage:{
        type: String,
        default: "",
    },
    isSuspended: {
        type: Boolean,
        default: false,
    },
    suspensionEndDate: {
        type: Date,
        default: null, 
    },
    suspensionReason: {
        type: String,
        trim: true,
        default: null,
    },
    resetPasswordToken: String, 
    resetPasswordExpires: Date,
}, { 
    timestamps: true, //create at auto update + create ngày
     toJSON: {
    transform: (doc, ret) => {
      // Convert timestamps to local time (+07:00) and format as YYYY-MM-DD HH:MM:SS
      if (ret.createdAt) {
        const createdAtLocal = new Date(ret.createdAt.getTime());
        ret.createdAt = `${createdAtLocal.getFullYear()}-${pad(createdAtLocal.getMonth() + 1)}-${pad(createdAtLocal.getDate())} ${pad(createdAtLocal.getHours())}:${pad(createdAtLocal.getMinutes())}:${pad(createdAtLocal.getSeconds())}`;
      }
      if (ret.updatedAt) {
        const updatedAtLocal = new Date(ret.updatedAt.getTime());
        ret.updatedAt = `${updatedAtLocal.getFullYear()}-${pad(updatedAtLocal.getMonth() + 1)}-${pad(updatedAtLocal.getDate())} ${pad(updatedAtLocal.getHours())}:${pad(updatedAtLocal.getMinutes())}:${pad(updatedAtLocal.getSeconds())}`;
      }
      return ret;
    },
    virtuals: true, // Include virtual fields if any
  },
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
userSchema.methods.checkAndLiftSuspension = async function() {
    if (this.isSuspended && this.suspensionEndDate && this.suspensionEndDate <= new Date()) {
        this.isSuspended = false;
        this.suspensionEndDate = null;
        this.suspensionReason = `Suspension lifted automatically on ${new Date().toLocaleDateString()}. Was: ${this.suspensionReason || 'N/A'}`; // Ghi lại lý do gỡ
        await this.save(); // Lưu thay đổi
        console.log(`Suspension lifted for user ${this.username} (${this._id})`);
       
        return true; 
    }
    return false; 
};

const User = mongoose.model("User",userSchema);

export default User; 