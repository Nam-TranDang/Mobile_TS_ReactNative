const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Đăng nhập thất bại");
    }

    // THÊM: Kiểm tra role admin
    if (data.user && data.user.role !== "admin") {
      throw new Error("Bạn không có quyền truy cập vào trang quản trị");
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

export const getAuthHeader = () => {
  const token = localStorage.getItem("admin-token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};