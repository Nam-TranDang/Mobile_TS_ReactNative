import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const useAdminSocket = (onNewReport, onNewBook, onNewUser, onOnlineUsersUpdate) => {
    const socketRef = useRef(null);
    const isConnectedRef = useRef(false);

    // Sử dụng useCallback để tránh re-creation của functions
    const stableOnNewReport = useCallback(onNewReport || (() => {}), []);
    const stableOnNewBook = useCallback(onNewBook || (() => {}), []);
    const stableOnNewUser = useCallback(onNewUser || (() => {}), []);
    const stableOnOnlineUsersUpdate = useCallback(onOnlineUsersUpdate || (() => {}), []);

    useEffect(() => {
        // Tránh tạo connection mới nếu đã có
        if (isConnectedRef.current && socketRef.current) {
            return;
        }

        console.log('Establishing socket connection...');
        const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
        const socket = io(SOCKET_URL, {
            // Thêm options để kiểm soát reconnection
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000,
        });
        
        socketRef.current = socket;
        isConnectedRef.current = true;

        // Connection events
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            socket.emit('joinAdminRoom');
            socket.emit("onlineUsersUpdate", onlineUsers.size);

        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            isConnectedRef.current = false;
        });

        // Event listeners
        socket.on('newReport', stableOnNewReport);
        socket.on('newBook', stableOnNewBook);
        socket.on('newUser', stableOnNewUser);
        socket.on('onlineUsersUpdate', stableOnOnlineUsersUpdate);
        socket.on('currentStats', (stats) => {
            if (stableOnOnlineUsersUpdate) {
                stableOnOnlineUsersUpdate(stats.onlineUsers);
            }
        });

        return () => {
            console.log('Cleaning up socket connection...');
            if (socket) {
                socket.disconnect();
                isConnectedRef.current = false;
            }
        };
    }, []); // Empty dependency array để chỉ chạy một lần

    return socketRef.current;
};

export default useAdminSocket;