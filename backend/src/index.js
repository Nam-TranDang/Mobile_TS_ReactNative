import express from "express";
import "dotenv/config";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";

import { connectDB } from "./lib/db.js";


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // cho phép tất cả các domain truy cập vào API Port 3000 (tránh trường hợp FE dùng Port 5000 không nối được )

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

app.listen(PORT,() => {
  console.log(`server started on port ${PORT}`);
  connectDB();
});