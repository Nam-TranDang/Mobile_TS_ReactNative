import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Sử dụng API_URL từ biến môi trường Vite
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    // Kiểm tra token trong localStorage khi component mount
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("admin-token");
      
      if (token) {
        try {
          // Lấy thông tin người dùng từ token
          const userData = JSON.parse(localStorage.getItem("admin-user"));
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Lỗi xác thực:", error);
          localStorage.removeItem("admin-token");
          localStorage.removeItem("admin-user");
        }
      }
      
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
    console.log("Đang gửi yêu cầu đăng nhập:", { email, password });

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Phản hồi đăng nhập:", data);

      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

        // Kiểm tra xem có user và token không
    if (!data.token) {
      throw new Error("Token không hợp lệ");
    }
    
    // Nếu không có thông tin user, tạo một thông tin cơ bản
    const userData = data.user || { 
      email: email,
      role: "admin" // Gán mặc định role admin nếu không có
    };
    
    // Lưu token và thông tin người dùng
    localStorage.setItem("admin-token", data.token);
    localStorage.setItem("admin-user", JSON.stringify(userData));
    
    setUser(userData);
    setIsAuthenticated(true);
    
    // Đảm bảo chuyển hướng được thực hiện
    console.log("Chuyển hướng đến dashboard");
    navigate("/");
    
    return { success: true };
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return { success: false, error: error.message };
  } finally {
    setIsLoading(false);
  }
};

  const logout = () => {
    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin-user");
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);