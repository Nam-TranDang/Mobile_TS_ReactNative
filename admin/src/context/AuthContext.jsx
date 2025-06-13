import { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("admin-token");

      if (token) {
        try {
          const userData = JSON.parse(localStorage.getItem("admin-user"));
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Lỗi xác thực:", error);
          localStorage.removeItem("admin-token");
          localStorage.removeItem("admin-user");
        }
      }

      setIsLoading(false); // Chỉ set isLoading false khi kiểm tra token ban đầu
    };

    checkAuthStatus();
  }, []);

const login = async (email, password) => {
  try {
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

    const userData = data.user || { email, role: "admin" };
    localStorage.setItem("admin-token", data.token);
    localStorage.setItem("admin-user", JSON.stringify(userData));

    // SỬA: Cập nhật state ngay sau khi đăng nhập thành công
    setUser(userData);
    const completeLogin = () => setIsAuthenticated(true);

    return { success: true, user: userData, token: data.token, completeLogin };
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return { success: false, error: error.message };
  }
};

  const logout = () => {
    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin-user");
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
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