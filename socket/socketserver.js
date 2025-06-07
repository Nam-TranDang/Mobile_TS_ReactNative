
import { Server } from "socket.io";

const bookRooms = {};
const adminClients = new Set(); // Track admin clients
let onlineUsersCount = 0; // Track online users

// Hàm để khởi tạo và quản lý Socket.IO server
const initializeSocketIO = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "*", // Cho phép tất cả các origin, hoặc chỉ định origin của client (ví dụ: "http://localhost:3001" nếu client chạy ở port đó)
            methods: ["GET", "POST"]
        }
    });

    console.log("Socket.IO server initialized and listening...");

    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Increment online users count
        onlineUsersCount++;

        // Emit updated count to all admin clients
        io.to("admin-room").emit("onlineUsersUpdate", onlineUsersCount);
         
        // Admin joins admin room
        socket.on("joinAdminRoom", () => {
            socket.join("admin-room");
            adminClients.add(socket.id);
            console.log(`Admin client ${socket.id} joined admin room`);
            
            // Send current stats to new admin
            socket.emit("currentStats", {
                onlineUsers: onlineUsersCount
            });
        });

        // Khi client tham gia vào một "phòng" của sách để nhận comment
        socket.on("joinBookRoom", (bookId) => {
            if (!bookId) {
                console.warn(`Client ${socket.id} tried to join a room without a bookId.`);
                return;
            }
            socket.join(bookId); // Client tham gia vào phòng có tên là bookId
            if (!bookRooms[bookId]) {
                bookRooms[bookId] = new Set();
            }
            bookRooms[bookId].add(socket.id);
            console.log(`Client ${socket.id} joined room for book: ${bookId}`);
            // console.log("Current book rooms:", bookRooms);
        });

        // Khi client rời khỏi một "phòng" của sách
        socket.on("leaveBookRoom", (bookId) => {
            if (!bookId) {
                console.warn(`Client ${socket.id} tried to leave a room without a bookId.`);
                return;
            }
            socket.leave(bookId);
            if (bookRooms[bookId]) {
                bookRooms[bookId].delete(socket.id);
                if (bookRooms[bookId].size === 0) {
                    delete bookRooms[bookId]; // Xóa phòng nếu không còn ai
                }
            }
            console.log(`Client ${socket.id} left room for book: ${bookId}`);
            // console.log("Current book rooms:", bookRooms);
        });

        // Lắng nghe sự kiện khi client ngắt kết nối
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);

            // Decrement online users count
            onlineUsersCount--;

            // Remove from admin clients if it was an admin
            if (adminClients.has(socket.id)) {
                adminClients.delete(socket.id);
            }

            // Xóa client khỏi tất cả các phòng mà nó đã tham gia
            for (const bookId in bookRooms) {
                if (bookRooms[bookId].has(socket.id)) {
                    bookRooms[bookId].delete(socket.id);
                    if (bookRooms[bookId].size === 0) {
                        delete bookRooms[bookId];
                    }
                    console.log(`Client ${socket.id} removed from room for book: ${bookId} due to disconnect.`);
                }
            }
            // console.log("Current book rooms after disconnect:", bookRooms);
            io.to("admin-room").emit("onlineUsersUpdate", onlineUsersCount);
        });

        // (Tùy chọn) Lắng nghe các sự kiện lỗi từ client
        socket.on("error", (err) => {
            console.error(`Socket Error from ${socket.id}:`, err);
        });
    });

    // Helper functions to emit to admin clients
    const emitToAdmins = (event, data) => {
        io.to("admin-room").emit(event, data);
    };

    // Trả về instance io để có thể sử dụng ở nơi khác (ví dụ: trong routes)
    return { io, emitToAdmins };
};

export default initializeSocketIO;