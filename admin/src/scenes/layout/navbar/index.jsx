
import { Box, IconButton, useMediaQuery, useTheme, Menu, MenuItem, Avatar, Typography, Divider } from "@mui/material"
import { tokens, ColorModeContext } from "../../../theme"
import { useContext, useState, useRef } from "react"
import {
  DarkModeOutlined,
  LightModeOutlined,
  MenuOutlined,
  NotificationsOutlined,
  PersonOutlined,
  SettingsOutlined,
  LogoutOutlined,
  PhotoCameraOutlined,
} from "@mui/icons-material"
import { ToggledContext } from "../../../App"
import { useAuth } from "../../../context/AuthContext"

const Navbar = () => {
  const theme = useTheme()
  const colorMode = useContext(ColorModeContext)
  const { toggled, setToggled } = useContext(ToggledContext)
  const { logout, user, updateUserProfile } = useAuth()
  const isMdDevices = useMediaQuery("(max-width:768px)")
  const colors = tokens(theme.palette.mode)
  const isDark = theme.palette.mode === "dark"

  // State cho dropdown menu
  const [anchorEl, setAnchorEl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const open = Boolean(anchorEl)

  // Neumorphism styles
  const getNeumorphicShadow = () => {
    return isDark
      ? `5px 5px 10px ${colors.primary[600]}, -5px -5px 10px ${colors.primary[400]}`
      : `5px 5px 10px rgba(0, 0, 0, 0.05), -5px -5px 10px rgba(255, 255, 255, 0.8)`
  }

  const getNeumorphicInsetShadow = () => {
    return isDark
      ? `inset 3px 3px 6px ${colors.primary[600]}, inset -3px -3px 6px ${colors.primary[400]}`
      : `inset 3px 3px 6px rgba(0, 0, 0, 0.05), inset -3px -3px 6px rgba(255, 255, 255, 0.8)`
  }

  const getNeumorphicPressedShadow = () => {
    return isDark
      ? `inset 2px 2px 5px ${colors.primary[600]}, inset -2px -2px 5px ${colors.primary[400]}`
      : `inset 2px 2px 5px rgba(0, 0, 0, 0.05), inset -2px -2px 5px rgba(255, 255, 255, 0.8)`
  }

  const handlePersonClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    handleClose()
  }

  const handleChangeAvatar = () => {
    fileInputRef.current?.click()
    handleClose()
  }

  // Helper function để convert file sang base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      alert("Chỉ cho phép upload file ảnh (JPEG, PNG, GIF)")
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert("File quá lớn! Vui lòng chọn file nhỏ hơn 5MB")
      return
    }

    try {
      setUploading(true)

      // Convert file to base64
      const base64 = await convertToBase64(file)

      const token = localStorage.getItem("admin-token")
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

      // Sử dụng route admin profile mới
      const response = await fetch(`${API_URL}/api/users/admin/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileImage: base64,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Avatar updated successfully:", data)

        // Update user context với avatar mới
        if (updateUserProfile) {
          updateUserProfile({ profileImage: data.user.profileImage })
        }

        alert("Đổi avatar thành công!")
      } else {
        const errorData = await response.json()
        console.error("Failed to update avatar:", errorData)
        alert(errorData.message || "Có lỗi xảy ra khi đổi avatar")
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Có lỗi xảy ra khi upload avatar")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  return (
    <>
      <style>
        {`
          .neumorphic-navbar-btn {
            background-color: ${colors.primary[500]} !important;
            box-shadow: ${getNeumorphicShadow()} !important;
            border-radius: 12px !important;
            transition: all 0.2s ease !important;
            margin: 0 4px !important;
          }
          
          .neumorphic-navbar-btn:hover {
            transform: translateY(-3px) !important;
          }
          
          .neumorphic-navbar-btn:active {
            box-shadow: ${getNeumorphicPressedShadow()} !important;
            transform: translateY(1px) !important;
          }
          
          .neumorphic-navbar-btn.active {
            box-shadow: ${getNeumorphicInsetShadow()} !important;
          }
          
          .neumorphic-navbar-container {
            background-color: ${colors.primary[500]};
            box-shadow: ${getNeumorphicShadow()};
            border-radius: 20px;
            padding: 8px;
            backdrop-filter: blur(10px);
          }
          
          .neumorphic-dropdown {
            background-color: ${colors.primary[500]} !important;
            box-shadow: ${getNeumorphicShadow()} !important;
            border-radius: 20px !important;
            border: none !important;
            overflow: hidden !important;
          }
          
          .neumorphic-dropdown .MuiMenuItem-root {
            transition: all 0.2s ease !important;
            margin: 4px 8px !important;
            border-radius: 12px !important;
          }
          
          .neumorphic-dropdown .MuiMenuItem-root:hover {
            background-color: ${colors.primary[400]} !important;
            transform: translateY(-2px) !important;
          }
          
          .neumorphic-user-header {
            background-color: ${colors.primary[400]};
            box-shadow: ${getNeumorphicInsetShadow()};
            border-radius: 15px;
            margin: 8px;
            padding: 16px;
          }
          
          .neumorphic-avatar-dropdown {
            box-shadow: ${getNeumorphicShadow()};
            border: 2px solid ${colors.primary[400]};
          }
        `}
      </style>

      <Box
        className="neumorphic-navbar-container"
        sx={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 1200,
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: colors.primary[500],
          borderRadius: "20px",
          padding: "8px",
          boxShadow: getNeumorphicShadow(),
        }}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: "none" }}
        />

        <IconButton
          className="neumorphic-navbar-btn"
          sx={{
            display: `${isMdDevices ? "flex" : "none"}`,
            backgroundColor: colors.primary[500],
            color: colors.gray[100],
            padding: "12px",
            "&:hover": { backgroundColor: colors.primary[500] },
          }}
          onClick={() => setToggled(!toggled)}
        >
          <MenuOutlined sx={{ fontSize: "20px" }} />
        </IconButton>

        <IconButton
          onClick={colorMode.toggleColorMode}
          className="neumorphic-navbar-btn"
          sx={{
            backgroundColor: colors.primary[500],
            color: colors.gray[100],
            padding: "12px",
            "&:hover": { backgroundColor: colors.primary[500] },
          }}
        >
          {theme.palette.mode === "dark" ? (
            <LightModeOutlined sx={{ fontSize: "20px" }} />
          ) : (
            <DarkModeOutlined sx={{ fontSize: "20px" }} />
          )}
        </IconButton>

        <IconButton
          className="neumorphic-navbar-btn"
          sx={{
            backgroundColor: colors.primary[500],
            color: colors.gray[100],
            padding: "12px",
            "&:hover": { backgroundColor: colors.primary[500] },
          }}
        >
          <NotificationsOutlined sx={{ fontSize: "20px" }} />
        </IconButton>

        <IconButton
          className="neumorphic-navbar-btn"
          sx={{
            backgroundColor: colors.primary[500],
            color: colors.gray[100],
            padding: "12px",
            "&:hover": { backgroundColor: colors.primary[500] },
          }}
        >
          <SettingsOutlined sx={{ fontSize: "20px" }} />
        </IconButton>

        <IconButton
          onClick={handlePersonClick}
          className={`neumorphic-navbar-btn ${open ? "active" : ""}`}
          sx={{
            backgroundColor: colors.primary[500],
            color: colors.gray[100],
            padding: "12px",
            boxShadow: open ? getNeumorphicInsetShadow() : getNeumorphicShadow(),
            "&:hover": { backgroundColor: colors.primary[500] },
          }}
        >
          <PersonOutlined sx={{ fontSize: "20px" }} />
        </IconButton>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          className="neumorphic-dropdown"
          
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[500],
              color: colors.gray[100],
              minWidth: 250,
              mt: 1,
              borderRadius: "20px",
              boxShadow: getNeumorphicShadow(),
              border: "none",
              overflow: "hidden",
              "& .MuiMenuItem-root": {
                padding: "12px 16px",
                margin: "4px 8px",
                borderRadius: "12px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: colors.primary[400],
                  transform: "translateY(-2px)",
                },
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {/* User Info Header */}
          <Box className="neumorphic-user-header">
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={user?.profileImage || user?.avatar}
                className="neumorphic-avatar-dropdown"
                sx={{
                  width: 50,
                  height: 50,
                  boxShadow: getNeumorphicShadow(),
                  border: `2px solid ${colors.primary[400]}`,
                }}
              >
                {user?.username?.charAt(0)?.toUpperCase() || "A"}
              </Avatar>
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    color: colors.gray[100],
                    textShadow: `1px 1px 2px ${colors.primary[600]}`,
                  }}
                >
                  {user?.username || "Admin User"}
                </Typography>
                <Typography variant="caption" color={colors.gray[300]} sx={{ fontSize: "12px" }}>
                  {user?.email || "admin@example.com"}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Change Avatar Option */}
          <MenuItem onClick={handleChangeAvatar} disabled={uploading}>
            <Box
              sx={{
                backgroundColor: colors.primary[500],
                boxShadow: getNeumorphicInsetShadow(),
                borderRadius: "8px",
                padding: "6px",
                marginRight: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PhotoCameraOutlined sx={{ fontSize: "18px", color: colors.greenAccent[400] }} />
            </Box>
            <Typography sx={{ color: colors.gray[100] }}>{uploading ? "Đang upload..." : "Đổi avatar"}</Typography>
          </MenuItem>

          <Divider
            sx={{
              backgroundColor: colors.gray[600],
              margin: "8px 16px",
              borderRadius: "2px",
            }}
          />

          {/* Logout Option */}
          <MenuItem
            onClick={handleLogout}
            sx={{
              "&:hover": {
                backgroundColor: `${colors.redAccent[800]} !important`,
                "& .MuiTypography-root": {
                  color: `${colors.redAccent[300]} !important`,
                },
                "& .MuiSvgIcon-root": {
                  color: `${colors.redAccent[300]} !important`,
                },
              },
            }}
          >
            <Box
              sx={{
                backgroundColor: colors.primary[500],
                boxShadow: getNeumorphicInsetShadow(),
                borderRadius: "8px",
                padding: "6px",
                marginRight: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogoutOutlined sx={{ fontSize: "18px", color: colors.redAccent[400] }} />
            </Box>
            <Typography sx={{ color: colors.redAccent[400] }}>Đăng xuất</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </>
  )
}

export default Navbar
