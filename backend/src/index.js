import express from "express";
import "dotenv/config";
import cors from "cors";
import { createServer } from "http";
import initializeSocketIO from "../../socket/socketserver.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

import { connectDB } from "./lib/db.js";


const app = express();
const PORT = process.env.PORT || 3000;

// Tạo HTTP server
const httpServer = createServer(app);
// Khởi tạo Socket.IO và lấy instance để sử dụng trong routes
const { io, emitToAdmins } = initializeSocketIO(httpServer);


app.use((req, res, next) => {
  req.io = io;
  req.emitToAdmins = emitToAdmins;
  next();
});


app.use(express.json({ limit: '10mb' })); // Example: allow up to 10MB JSON body
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cors()); // cho phép tất cả các domain truy cập vào API Port 3000 (tránh trường hợp FE dùng Port 5000 không nối được )

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);

// Cac xu ly logic cua admin trong day 
app.use("/api/admin", adminRoutes);

// Middleware để truyền socket instance vào routes
app.use((req, res, next) => {
    req.io = io;
    req.emitToAdmins = emitToAdmins;
    next();
});

httpServer.listen(PORT, () => {
  console.log(`Server (HTTP & Socket.IO) started on port ${PORT}`);
  console.log(`Access it at: http://localhost:${PORT}`);
  connectDB();
});