import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { tokens } from "../../theme";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const Login = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const updateUserProfile = (updates) => {
  setUser(prev => ({
    ...prev,
    ...updates
  }));
};
  
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);
  
  try {
    const result = await login(formData.email, formData.password);
    console.log("Kết quả đăng nhập:", result);
    
    if (!result.success) {
      setError(result.error);
    } else {
      // Thêm chuyển hướng trực tiếp nếu AuthContext không chuyển hướng
      console.log("Đăng nhập thành công, chuyển hướng...");
      navigate("/");
    }
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    setError(error.message || "Đăng nhập thất bại. Vui lòng thử lại sau.");
  } finally {
    setIsLoading(false);
  }
};
  
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: colors.primary[400],
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: "500px",
          borderRadius: "10px",
          backgroundColor: colors.primary[400],
          boxShadow: `0px 10px 30px rgba(0, 0, 0, 0.1)`,
        }}
      >
        <Typography
          variant="h2"
          fontWeight="bold"
          mb={3}
          color={colors.greenAccent[400]}
          textAlign="center"
        >
          ĐĂNG NHẬP ADMIN
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="email"
            InputProps={{
              sx: {
                color: colors.gray[100],
                borderColor: colors.greenAccent[400],
              },
            }}
            InputLabelProps={{
              sx: {
                color: colors.gray[100],
              },
            }}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: colors.gray[100],
                },
                "&:hover fieldset": {
                  borderColor: colors.greenAccent[400],
                },
                "&.Mui-focused fieldset": {
                  borderColor: colors.greenAccent[400],
                },
              },
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
            margin="normal"
            required
            autoComplete="current-password"
            InputProps={{
              sx: {
                color: colors.gray[100],
              },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                    sx={{ color: colors.gray[100] }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            InputLabelProps={{
              sx: {
                color: colors.gray[100],
              },
            }}
            sx={{
              mb: 4,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: colors.gray[100],
                },
                "&:hover fieldset": {
                  borderColor: colors.greenAccent[400],
                },
                "&.Mui-focused fieldset": {
                  borderColor: colors.greenAccent[400],
                },
              },
            }}
          />
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{
              mt: 2,
              mb: 2,
              p: 1.5,
              backgroundColor: colors.greenAccent[600],
              color: colors.gray[100],
              fontSize: "16px",
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: colors.greenAccent[400],
              },
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "ĐĂNG NHẬP"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;