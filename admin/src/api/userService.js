import { getAuthHeader } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getAllUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể tải danh sách người dùng");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const updateUserStatus = async (userId, status) => {
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/status`, {
      method: "PATCH",
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể cập nhật trạng thái người dùng");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể xóa người dùng");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};