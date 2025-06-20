import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { API_URL } from '../constants/api';
import { router } from 'expo-router';

export const useAuthStore = create((set) => ({
    user : null,
    token : null,
    isLoading: false,
    isCheckingAuth: true,

    // Thêm state cho số lượng thông báo chưa đọc
    unreadNotificationsCount: 0,
  
    register: async (username, email, password) => {
        set({isLoading: true});

        try{
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({username, email, password}),
            })
            const data = await response.json();

            if(!response.ok){
                throw new Error(data.message || 'Something went wrong');
            }

            // Don't store token or user data after registration
            // Don't navigate automatically - we'll show a message and redirect to login instead
            set({isLoading: false});
            return {success: true, message: 'Registration successful! Please log in.'};
        } catch(error){
            set({isLoading: false});
            return {success: false, error: error.message};
        }
    },
    
    checkAuth: async () => {
        try{
            const token = await AsyncStorage.getItem('token');
            const userJson = await AsyncStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : null;
            
            set({token, user});
            // Nếu người dùng đã đăng nhập, lấy số lượng thông báo chưa đọc
            if (token && user) {
                try {
                    const response = await fetch(`${API_URL}/notifications/count`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        set({ unreadNotificationsCount: data.unreadCount || 0 });
                    }
                } catch (err) {
                    console.log("Error fetching unread notifications count", err);
                }
            }
        } catch(error){
            console.log("Auth check failed", error);

        }finally{
            set({isCheckingAuth: false});
        }
    },
    
    login: async (email, password) => {
        set({isLoading: true});
        try{
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email, password}),
            })
            const data = await response.json();

            if(!response.ok){
                set({isLoading: false});
                
                // Kiểm tra nếu tài khoản bị suspended
                if (data.message.includes('suspended') || data.isSuspended) {
                    // Trả về thông tin suspended thay vì redirect ngay
                    return {
                        success: false, 
                        error: 'Account suspended', 
                        isSuspended: true,
                        suspensionInfo: {
                            endDate: data.suspensionEndDate || data.endDate,
                            reason: data.suspensionReason || data.reason || 'Không có thông tin cụ thể'
                        }
                    };
                }
                
                throw new Error(data.message || 'Something went wrong');
            }

            // Đăng nhập thành công
            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));
            
            set({
                token: data.token,
                user: data.user,
                isAuthenticated: true,
                isLoading: false,
            });

            return {success: true, data: data.user};
        } catch(error){
            set({isLoading: false});
            return {success: false, error: error.message};
        }
    },

    logout: async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            set({token: null, user: null});
            // Chuyển hướng về trang home sau khi đăng xuất
            router.replace('/(tabs)');
        } catch (error) {
        console.error('Error during logout:', error);
        }
    },
    // Thêm action mới:
    decrementUnreadNotificationsCount: () => set((state) => ({ 
        unreadNotificationsCount: Math.max(0, state.unreadNotificationsCount - 1) 
      })),
    
    // Các actions đã có liên quan đến thông báo
    setUnreadNotificationsCount: (count) => set({ unreadNotificationsCount: count }),
    incrementUnreadNotificationsCount: () => set((state) => ({ 
        unreadNotificationsCount: state.unreadNotificationsCount + 1 
    })),
    resetUnreadNotificationsCount: () => set({ unreadNotificationsCount: 0 }),

}));