import {
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Divider,
} from "@mui/material";
import { tokens, ColorModeContext } from "../../../theme";
import { useContext, useState, useRef } from "react"; // Thêm useRef
import {
  DarkModeOutlined,
  LightModeOutlined,
  MenuOutlined,
  NotificationsOutlined,
  PersonOutlined,
  SettingsOutlined,
  LogoutOutlined,
  PhotoCameraOutlined,
} from "@mui/icons-material";
import { ToggledContext } from "../../../App";
import { useAuth } from "../../../context/AuthContext";

const Navbar = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { toggled, setToggled } = useContext(ToggledContext);
  const { logout, user, updateUserProfile } = useAuth(); // Thêm updateUserProfile
  const isMdDevices = useMediaQuery("(max-width:768px)");
  const colors = tokens(theme.palette.mode);
  
  // State cho dropdown menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [uploading, setUploading] = useState(false); // Thêm state uploading
  const fileInputRef = useRef(null); // Thêm ref cho file input
  const open = Boolean(anchorEl);

  const handlePersonClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleChangeAvatar = () => {
    // Trigger file input click
    fileInputRef.current?.click();
    handleClose();
  };

  // Helper function để convert file sang base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    alert('Chỉ cho phép upload file ảnh (JPEG, PNG, GIF)');
    return;
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    alert('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB');
    return;
  }

  try {
    setUploading(true);
    
    // Convert file to base64
    const base64 = await convertToBase64(file);
    
    const token = localStorage.getItem('admin-token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Sử dụng route admin profile mới
    const response = await fetch(`${API_URL}/api/users/admin/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileImage: base64
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Avatar updated successfully:', data);
      
      // Update user context với avatar mới
      if (updateUserProfile) {
        updateUserProfile({ profileImage: data.user.profileImage });
      }
      
      alert('Đổi avatar thành công!');
    } else {
      const errorData = await response.json();
      console.error('Failed to update avatar:', errorData);
      alert(errorData.message || 'Có lỗi xảy ra khi đổi avatar');
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    alert('Có lỗi xảy ra khi upload avatar');
  } finally {
    setUploading(false);
    event.target.value = '';
  }
};
  
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 2,
        backgroundColor: "transparent",
      }}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* ...existing code... */}
      <IconButton
        sx={{ 
          display: `${isMdDevices ? "flex" : "none"}`,
          backgroundColor: colors.primary[400],
          color: colors.gray[100],
          "&:hover": { backgroundColor: colors.primary[300] }
        }}
        onClick={() => setToggled(!toggled)}
      >
        <MenuOutlined />
      </IconButton>

      <IconButton 
        onClick={colorMode.toggleColorMode}
        sx={{
          backgroundColor: colors.primary[400],
          color: colors.gray[100],
          "&:hover": { backgroundColor: colors.primary[300] }
        }}
      >
        {theme.palette.mode === "dark" ? (
          <LightModeOutlined sx={{ fontSize: "20px" }} />
        ) : (
          <DarkModeOutlined sx={{ fontSize: "20px" }} />
        )}
      </IconButton>

      <IconButton
        sx={{
          backgroundColor: colors.primary[400],
          color: colors.gray[100],
          "&:hover": { backgroundColor: colors.primary[300] }
        }}
      >
        <NotificationsOutlined sx={{ fontSize: "20px" }} />
      </IconButton>

      <IconButton
        sx={{
          backgroundColor: colors.primary[400],
          color: colors.gray[100],
          "&:hover": { backgroundColor: colors.primary[300] }
        }}
      >
        <SettingsOutlined sx={{ fontSize: "20px" }} />
      </IconButton>
      
      <IconButton
        onClick={handlePersonClick}
        sx={{
          backgroundColor: open ? colors.primary[300] : colors.primary[400],
          color: colors.gray[100],
          "&:hover": { backgroundColor: colors.primary[300] }
        }}
      >
        <PersonOutlined sx={{ fontSize: "20px" }} />
      </IconButton>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            backgroundColor: colors.primary[400],
            color: colors.gray[100],
            minWidth: 200,
            mt: 1,
            '& .MuiMenuItem-root': {
              padding: '12px 16px',
              '&:hover': {
                backgroundColor: colors.primary[300],
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ padding: '16px', borderBottom: `1px solid ${colors.gray[600]}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={user?.profileImage || user?.avatar}
              sx={{ width: 40, height: 40 }}
            >
              {user?.username?.charAt(0)?.toUpperCase() || 'A'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {user?.username || 'Admin User'}
              </Typography>
              <Typography variant="caption" color={colors.gray[300]}>
                {user?.email || 'admin@example.com'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Change Avatar Option */}
        <MenuItem 
          onClick={handleChangeAvatar}
          disabled={uploading}
        >
          <PhotoCameraOutlined sx={{ mr: 2, fontSize: "20px" }} />
          <Typography>
            {uploading ? 'Đang upload...' : 'Đổi avatar'}
          </Typography>
        </MenuItem>

        <Divider sx={{ backgroundColor: colors.gray[600] }} />

        {/* Logout Option */}
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            color: colors.redAccent[400],
            '&:hover': { 
              backgroundColor: colors.redAccent[800],
              color: colors.redAccent[300] 
            }
          }}
        >
          <LogoutOutlined sx={{ mr: 2, fontSize: "20px" }} />
          <Typography>Đăng xuất</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Navbar;