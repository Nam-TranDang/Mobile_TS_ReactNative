import mongoose from "mongoose";

const genreSchema = new mongoose.Schema({
    genre_name: {
        type: String,
        required: true, 
        unique: true, 
        trim: true, 
    },
    soft_delete: {
        type: Boolean,
        default: false, // Mặc định là không xóa mềm --> trảnh conflict với các query sách khác 
    }
    
}, {
    timestamps: true, // Tự động thêm createdAt và updatedAt
});

const Genre = mongoose.model("Genre", genreSchema);
export default Genre;