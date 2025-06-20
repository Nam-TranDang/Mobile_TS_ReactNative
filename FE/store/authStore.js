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

            await AsyncStorage.setItem("user", JSON.stringify(data.user));
            await AsyncStorage.setItem("token", data.token);

            set({user: data.user, token: data.token, isLoading: false});
            return {success : true};
        } catch(error){
            console.log("Registration error", error);
        }
    },

    checkAuth: async () => {
        try{
            const token = await AsyncStorage.getItem('token');
            const userJson = await AsyncStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : null;
            
            set({token, user});
        } catch(error){
            console.log("Auth check failed", error);

        }finally{
            set({isCheckingAuth: false});
        }
    },
    
    login: async(email, password) => {
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
                throw new Error(data.message || 'Something went wrong');
            }

            await AsyncStorage.setItem("user", JSON.stringify(data.user));
            await AsyncStorage.setItem("token", data.token);

            set({user: data.user, token: data.token, isLoading: false});
            return {success : true};
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