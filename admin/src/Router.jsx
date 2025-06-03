import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import App from "./App";
import Login from "./scenes/auth";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  Dashboard,
  Acc,
  Report,
  Book
} from "./scenes";

// Component bảo vệ đường dẫn chỉ cho người dùng đã đăng nhập
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Hiển thị loading khi đang kiểm tra xác thực
  if (isLoading) {
    return <div>Đang tải...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Component điều hướng người dùng đã đăng nhập ra khỏi trang login
const RedirectIfAuthenticated = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Đang tải...</div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <RedirectIfAuthenticated>
          <Login />
        </RedirectIfAuthenticated>
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="/acc" element={<Acc />} />
        <Route path="/book" element={<Book />} />
        <Route path="/report" element={<Report/>} />
      </Route>
      
      {/* Điều hướng URL không hợp lệ về trang chính */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const AppRouter = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default AppRouter;