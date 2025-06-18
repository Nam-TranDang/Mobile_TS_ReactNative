import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem("admin-token");
        const userData = localStorage.getItem("admin-user");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          // Kiểm tra role admin khi load từ localStorage
          if (parsedUser.role === "admin") {
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            // Xóa token nếu không phải admin
            localStorage.removeItem("admin-token");
            localStorage.removeItem("admin-user");
          }
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái xác thực:", error);
        localStorage.removeItem("admin-token");
        localStorage.removeItem("admin-user");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      console.log("Đang gửi yêu cầu đăng nhập:", { email, password });

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Phản hồi đăng nhập:", data);

      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      if (!data.token) {
        throw new Error("Token không hợp lệ");
      }

      // Kiểm tra role của user
      const userData = data.user || { email, role: "user" };
      
      // Chỉ cho phép admin đăng nhập vào trang admin
      if (userData.role !== "admin") {
        throw new Error("Bạn không có quyền truy cập vào trang quản trị. Chỉ admin mới được phép đăng nhập.");
      }

      localStorage.setItem("admin-token", data.token);
      localStorage.setItem("admin-user", JSON.stringify(userData));

      setUser(userData);
      const completeLogin = () => setIsAuthenticated(true);

      return { success: true, user: userData, token: data.token, completeLogin };
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      return { success: false, error: error.message };
    }
  };

  // THÊM: Function logout
  const logout = () => {
    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin-user");
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout, // THÊM logout vào value
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};