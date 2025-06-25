import { Server } from "socket.io";

const bookRooms = {};
const userRooms = {};
const adminClients = new Set(); // Track admin client socket IDs
const authenticatedUserIds = new Set(); // Track unique authenticated user IDs
const socketToUserMap = new Map(); // Map socket IDs to user IDs

// Hàm để khởi tạo và quản lý Socket.IO server
const initializeSocketIO = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "*", 
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    console.log("Socket.IO server initialized and listening...");

    // Function to get current online users count
    const getOnlineUsersCount = () => {
        return authenticatedUserIds.size;
    };

    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);
        
        // Admin joins admin room
        socket.on("joinAdminRoom", (userId) => {
            socket.join("admin-room");
            adminClients.add(socket.id);
            console.log(`Admin client ${socket.id} joined admin room with userId: ${userId}`);
            
            // If admin is authenticated with userId, track them
            if (userId) {
                socket.userId = userId;
                socketToUserMap.set(socket.id, userId);
                authenticatedUserIds.add(userId);
            }
            
            // Send current stats to new admin
            socket.emit("currentStats", {
                onlineUsers: getOnlineUsersCount()
            });
            
            // Broadcast updated count to all admins
            io.to("admin-room").emit("onlineUsersUpdate", getOnlineUsersCount());
        });

        // Khi client tham gia vào một "phòng" của sách để nhận comment
        socket.on("joinBookRoom", (bookId) => {
            if (!bookId) {
                console.warn(`Client ${socket.id} tried to join a room without a bookId.`);
                return;
            }
            socket.join(bookId);
            if (!bookRooms[bookId]) {
                bookRooms[bookId] = new Set();
            }
            bookRooms[bookId].add(socket.id);
            console.log(`Client ${socket.id} joined room for book: ${bookId}`);
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
                    delete bookRooms[bookId];
                }
            }
            console.log(`Client ${socket.id} left room for book: ${bookId}`);
        });

        // Khi client tham gia vào một "phòng" của người dùng để nhận thông báo cá nhân
        socket.on("joinUserRoom", (userId) => {
            if (!userId) {
                console.warn(`Client ${socket.id} tried to join user room without a userId.`);
                return;
            }
            
            // Store userId in socket and map
            socket.userId = userId;
            socketToUserMap.set(socket.id, userId);
            
            // Add to set of authenticated users
            authenticatedUserIds.add(userId);
            
            // Update all admin clients with new count
            io.to("admin-room").emit("onlineUsersUpdate", getOnlineUsersCount());
            
            const roomName = `userRoom_${userId}`;
            socket.join(roomName);
            if (!userRooms[userId]) {
                userRooms[userId] = new Set();
            }
            userRooms[userId].add(socket.id);
            console.log(`Client ${socket.id} joined room: ${roomName}`);
        });

        socket.on("leaveUserRoom", (userId) => {
            if (!userId) {
                console.warn(`Client ${socket.id} tried to leave user room without a userId.`);
                return;
            }
            const roomName = `userRoom_${userId}`;
            socket.leave(roomName);
            if (userRooms[userId]) {
                userRooms[userId].delete(socket.id);
                if (userRooms[userId].size === 0) {
                    delete userRooms[userId];
                }
            }
            console.log(`Client ${socket.id} left room: ${roomName}`);
        });

        // Lắng nghe sự kiện khi client ngắt kết nối
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);

            // Remove from admin clients if it was an admin
            if (adminClients.has(socket.id)) {
                adminClients.delete(socket.id);
            }

            // Check if this was an authenticated user
            const userId = socketToUserMap.get(socket.id);
            if (userId) {
                socketToUserMap.delete(socket.id);
                
                // Only remove from authenticatedUserIds if no other sockets have this userId
                const hasOtherSockets = Array.from(socketToUserMap.values()).includes(userId);
                if (!hasOtherSockets) {
                    authenticatedUserIds.delete(userId);
                    // Update all admin clients with new count
                    io.to("admin-room").emit("onlineUsersUpdate", getOnlineUsersCount());
                }
            }

            // Xóa client khỏi tất cả các phòng sách
            for (const bookId in bookRooms) {
                if (bookRooms[bookId].has(socket.id)) {
                    bookRooms[bookId].delete(socket.id);
                    if (bookRooms[bookId].size === 0) {
                        delete bookRooms[bookId];
                    }
                    console.log(`Client ${socket.id} removed from room for book: ${bookId} due to disconnect.`);
                }
            }
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