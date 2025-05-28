import express from "express";
import "dotenv/config";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

import { connectDB } from "./lib/db.js";


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' })); // Example: allow up to 10MB JSON body
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cors()); // cho phép tất cả các domain truy cập vào API Port 3000 (tránh trường hợp FE dùng Port 5000 không nối được )

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/reports", reportRoutes);

app.listen(PORT,() => {
  console.log(`server started on port ${PORT}`);
  console.log(`Access it at: http://localhost:${PORT}`); // Add this line
  connectDB();
});