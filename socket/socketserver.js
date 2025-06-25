import { Server } from "socket.io";

const bookRooms = {};
const userRooms = {};
const adminClients = new Set(); // Track admin clients
const authenticatedUsers = new Set(); // Track unique authenticated user IDs

// Hàm để khởi tạo và quản lý Socket.IO server
const initializeSocketIO = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    console.log("Socket.IO server initialized and listening...");

    // Hàm tính tổng số người dùng đang hoạt động (bao gồm cả admin)
    const getTotalOnlineUsers = () => {
        // Đếm số admin không trùng với authenticated users
        const adminSocketIds = new Set([...adminClients]);
        let adminOnlyCount = 0;
        
        // Đếm số admin không có trong authenticatedUsers
        adminSocketIds.forEach(socketId => {
            const socket = io.sockets.sockets.get(socketId);
            // Nếu admin socket này không có userId hoặc userId không có trong authenticatedUsers
            if (!socket.userId || !authenticatedUsers.has(socket.userId)) {
                adminOnlyCount++;
            }
        });
        
        // Tổng số = Số user xác thực + Số admin chỉ đăng nhập trên web
        return authenticatedUsers.size + adminOnlyCount;
    };

    // Hàm để cập nhật số người dùng cho tất cả admin
    const updateOnlineUsersCount = () => {
        const totalOnlineUsers = getTotalOnlineUsers();
        io.to("admin-room").emit("onlineUsersUpdate", totalOnlineUsers);
    };

    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Khi client tham gia vào một "phòng" của người dùng để nhận thông báo cá nhân
        socket.on("joinUserRoom", (userId) => {
            if (!userId) {
                console.warn(`Client ${socket.id} tried to join a user room without a userId.`);
                return;
            }
            
            // Lưu userId vào socket object để track khi disconnect
            socket.userId = userId;
            
            // Thêm vào Set người dùng xác thực nếu chưa có
            if (!authenticatedUsers.has(userId)) {
                authenticatedUsers.add(userId);
                // Cập nhật số người dùng trực tuyến
                updateOnlineUsersCount();
            }
            
            const roomName = `userRoom_${userId}`;
            socket.join(roomName);
            if (!userRooms[userId]) {
                userRooms[userId] = new Set();
            }
            userRooms[userId].add(socket.id);
            console.log(`Client ${socket.id} joined room: ${roomName}`);
        });

        // Lắng nghe sự kiện khi client ngắt kết nối
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);

            // Remove from admin clients if it was an admin
            if (adminClients.has(socket.id)) {
                adminClients.delete(socket.id);
                // Cập nhật số người dùng trực tuyến vì admin đã ngắt kết nối
                updateOnlineUsersCount();
            }

            // Xử lý khi người dùng đã xác thực ngắt kết nối
            if (socket.userId) {
                // Kiểm tra xem còn socket nào khác của người dùng này không
                const userId = socket.userId;
                if (userRooms[userId]) {
                    userRooms[userId].delete(socket.id);
                    
                    // Chỉ xóa khỏi authenticatedUsers nếu không còn kết nối nào khác
                    if (userRooms[userId].size === 0) {
                        authenticatedUsers.delete(userId);
                        delete userRooms[userId];
                        // Cập nhật số người dùng trực tuyến
                        updateOnlineUsersCount();
                    }
                }
            }
            
            // Xử lý cleanup các phòng khác...
        });

        // Admin joins admin room
        socket.on("joinAdminRoom", () => {
            socket.join("admin-room");
            adminClients.add(socket.id);
            console.log(`Admin client ${socket.id} joined admin room`);
            
            // Cập nhật số người dùng trực tuyến khi có admin mới kết nối
            updateOnlineUsersCount();
            
            // Send current stats to new admin
            socket.emit("currentStats", {
                onlineUsers: getTotalOnlineUsers()
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