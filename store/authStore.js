import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user : null,
    token : null,
    isLoading: false,
    
    register: async (username, email, password) => {
        set({isLoading: true});

        try{
            const response = await fetch('http://localhost:8081/api/auth/register', {
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
        } catch(error){}
    },

    // checkAuth: async () => {
    //     try{
    //         const token = await AsyncStorage.getItem('token');
    //         const userJson = await AsyncStorage.getItem('user');
    //         const user = userJson ? JSON.parse(userJson) : null;
            
    //         set({token, user});
    //     } catch(error){
    //         console.log("Auth check failed", error);

    //     }
    // },

    // Thay thế checkAuth bằng một hàm luôn xác thực
    checkAuth: async () => {
    try {
        // Bạn vẫn có thể kiểm tra token thực tế nếu cần
        const actualToken = await AsyncStorage.getItem('token');
        const userJson = await AsyncStorage.getItem('user');
        const actualUser = userJson ? JSON.parse(userJson) : null;
        
        // Nhưng luôn đặt một token và user mặc định bất kể kết quả thực tế
        const defaultToken = "default-token-always-authenticated";
        const defaultUser = {
            id: "default-user-id",
            username: "DefaultUser",
            // các thông tin khác của user mà ứng dụng của bạn cần
        };
        
        // Luôn đặt token và user mặc định thay vì giá trị thực tế
        set({
            token: defaultToken, 
            user: defaultUser,
            isAuthenticated: true // Thêm flag này nếu bạn đang sử dụng
        });
        
        console.log("User is automatically authenticated with default credentials");
    } catch(error) {
        console.log("Auth check failed", error);
        
        // Ngay cả khi có lỗi, vẫn đặt trạng thái đã xác thực
        const defaultToken = "default-token-always-authenticated";
        const defaultUser = {
            id: "default-user-id",
            username: "DefaultUser",
            // các thông tin khác của user mà ứng dụng của bạn cần
        };
        
        set({
            token: defaultToken, 
            user: defaultUser,
            isAuthenticated: true
        });
    }
},
    
    login: async(email, password) => {
        set({isLoading: true});

        try{
            const response = await fetch('http://localhost:8081/api/auth/login', {
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
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        set({token: null, user: null});
    },
}));