import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingPage from "../loading/index.jsx";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  GlobalStyles,
} from "@mui/material";
import { Visibility, VisibilityOff, LoginOutlined } from "@mui/icons-material";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoading, setShowLoading] = useState(false);

  const startTimer = useCallback(() => {
    console.log("=== BẮT ĐẦU COUNTDOWN 3 GIÂY ===");
    console.log("Thời gian bắt đầu:", new Date().getTime());
    
    timerRef.current = setTimeout(() => {
      console.log("=== 3 GIÂY ĐÃ TRÔI QUA ===");
      console.log("Thời gian kết thúc:", new Date().getTime());
      console.log("Chuyển hướng đến dashboard...");
      setShowLoading(false); // Tắt loading trước khi navigate
      navigate("/");
    }, 3000); // Đổi từ 5000 thành 3000 (3 giây)
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Bắt đầu đăng nhập...");
      const result = await login(formData.email, formData.password);
      console.log("Kết quả đăng nhập:", result);

      if (result.success === false) {
        setError(result.error || "Đăng nhập thất bại");
        setIsLoading(false);
        return;
      } else {
        console.log("Đăng nhập thành công!");
        // KHÔNG tắt isLoading ngay - chuyển sang showLoading
        setIsLoading(false);
        setShowLoading(true); // Bắt đầu hiển thị loading
        
        // BẮT BUỘC CHỜ 3 GIÂY RỒI MỚI CHUYỂN TRANG
        console.log("=== BẮT ĐẦU COUNTDOWN 3 GIÂY ===");
        console.log("Thời gian bắt đầu:", new Date().getTime());
        
        timerRef.current = setTimeout(() => {
          console.log("=== 3 GIÂY ĐÃ TRÔI QUA ===");
          console.log("Thời gian kết thúc:", new Date().getTime());
          console.log("Chuyển hướng đến dashboard...");
          setShowLoading(false); // Tắt loading trước khi navigate
          navigate("/");
        }, 3000); // 3 giây thay vì 5 giây
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      setError(error.message || "Đăng nhập thất bại. Vui lòng thử lại sau.");
      setIsLoading(false);
      return;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        console.log("=== CLEANUP TIMER ===");
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Comment tạm thời
  // const { isAuthenticated } = useAuth();

  if (isLoading || showLoading) {
    console.log("=== HIỂN THỊ LOADING PAGE ===");
    console.log("Timestamp:", new Date().getTime());
    console.log("isLoading:", isLoading, "showLoading:", showLoading);
    
    // Khác biệt message dựa vào trạng thái
    const message = isLoading ? "Đang đăng nhập..." : "Đang chuẩn bị dashboard...";
    return <LoadingPage message={message} />;
  }

  return (
    <>
      <GlobalStyles
        styles={{
          "*": { margin: 0, padding: 0, boxSizing: "border-box" },
          "html, body": { margin: 0, padding: 0, overflow: "hidden", height: "100%", width: "100%" },
          "#root": { margin: 0, padding: 0, height: "100%", width: "100%" },
        }}
      />
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          margin: 0,
          padding: 0,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "450px", margin: "0 20px" }}>
          <Paper
            elevation={0}
            sx={{
              padding: "40px 30px",
              borderRadius: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              margin: 0,
            }}
          >
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Box
                sx={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                  boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
                }}
              >
                <LoginOutlined sx={{ fontSize: "32px", color: "white" }} />
              </Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: "1.8rem",
                  marginBottom: "6px",
                }}
              >
                Đăng nhập Admin
              </Typography>
              <Typography variant="body2" sx={{ color: "#666", fontSize: "0.9rem" }}>
                Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: "10px",
                  backgroundColor: "#ffebee",
                  color: "#c62828",
                  border: "1px solid #ffcdd2",
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                variant="outlined"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                disabled={isLoading}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    backgroundColor: "#f8f9fa",
                    "& fieldset": { borderColor: "#e0e0e0", borderWidth: "1px" },
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea", borderWidth: "2px" },
                  },
                  "& .MuiInputLabel-root": { color: "#666", "&.Mui-focused": { color: "#667eea" } },
                  "& .MuiOutlinedInput-input": { color: "#333", padding: "14px" },
                }}
              />
              <TextField
                fullWidth
                label="Mật khẩu"
                name="password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        disabled={isLoading}
                        sx={{ color: "#666", "&:hover": { color: "#667eea" } }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    backgroundColor: "#f8f9fa",
                    "& fieldset": { borderColor: "#e0e0e0", borderWidth: "1px" },
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea", borderWidth: "2px" },
                  },
                  "& .MuiInputLabel-root": { color: "#666", "&.Mui-focused": { color: "#667eea" } },
                  "& .MuiOutlinedInput-input": { color: "#333", padding: "14px" },
                }}
              />
              <Button
                onClick={() => {
                  console.log("=== TEST LOADING BUTTON ===");
                  setShowLoading(true);
                  
                  console.log("=== BẮT ĐẦU COUNTDOWN 3 GIÂY ===");
                  console.log("Thời gian bắt đầu:", new Date().getTime());
                  
                  timerRef.current = setTimeout(() => {
                    console.log("=== 3 GIÂY ĐÃ TRÔI QUA ===");
                    console.log("Thời gian kết thúc:", new Date().getTime());
                    console.log("Chuyển hướng đến dashboard...");
                    setShowLoading(false);
                    navigate("/");
                  }, 3000); // Đổi thành 3 giây
                }}
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
              >
                Test Loading Page (3s)
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                sx={{
                  padding: "14px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "600",
                  textTransform: "none",
                  boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                    boxShadow: "0 12px 35px rgba(102, 126, 234, 0.4)",
                    transform: "translateY(-1px)",
                  },
                  "&:disabled": { background: "#ccc", boxShadow: "none", transform: "none" },
                }}
              >
                Đăng nhập
              </Button>
            </Box>
            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Typography variant="body2" sx={{ color: "#999", fontSize: "0.8rem" }}>
                © 2025 Thư viện tan vỡ. Tất cả quyền được bảo lưu.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default Login;