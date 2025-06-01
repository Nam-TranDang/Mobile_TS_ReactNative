// src/models/report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        reporter: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedItemType: { 
            type: String,
            required: true,
            enum: ["Book", "Comment","User"],
        },
        reportedItemId: { 
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'reportedItemType',
        },
        reason: { 
            type: String,
            required: true,
            trim: true,
        },
        description: { 
            type: String,
            trim: true,
            default: "",
        },
        status: { 
            type: String,
            enum: ["pending", "resolved", "rejected"],
            default: "pending",
        },
        adminNotes: { 
            type: String,
            trim: true,
            default: "",
        }
    },
    { 
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
//Người dùng gửi báo cáo -> Trạng thái: pending.
// Admin mở báo cáo -> Admin chuyển trạng thái sang reviewed.
// Admin điều tra, xem xét nội dung.
// Nếu nội dung vi phạm:
// Admin thực hiện hành động (xóa, cảnh cáo,...).
// Admin chuyển trạng thái sang resolved.
// Nếu nội dung không vi phạm (hoặc báo cáo không hợp lệ):
// Admin chuyển trạng thái sang rejected.
const Report = mongoose.model("Report", reportSchema);
export default Report;