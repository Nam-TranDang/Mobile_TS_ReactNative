import mongoose from "mongoose";

const genreSchema = new mongoose.Schema({
    genre_name: {
    type: String,
    required: true,
    unique: true, // Keep unique constraint to prevent duplicates
  },
    soft_delete: {
        type: Boolean,
        default: false, // Mặc định là không xóa mềm --> trảnh conflict với các query sách khác 
    }
    
}, {
    timestamps: true, // Tự động thêm createdAt và updatedAt
});

// o day mongoose se tu dong them collection la "genres"
const Genre = mongoose.model("Genre", genreSchema);
export default Genre;