"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material"
import { Header } from "../../components"
import { DataGrid, GridToolbar } from "@mui/x-data-grid"
import { tokens } from "../../theme"
import useAdminSocket from "../../hooks/useAdminSocket"

const Acc = () => {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)
  const isDark = theme.palette.mode === "dark"

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")

  // THÊM: Socket event handlers
  const handleNewUser = (data) => {
    console.log("New user registered:", data)

    // Thêm user mới vào danh sách
    const newUser = {
      id: data.user._id,
      shortId: data.user._id.slice(-4),
      name: data.user.username || "Không có tên",
      email: data.user.email || "Không có email",
      status: data.user.role || "user",
      accountStatus: "Active",
      isActive: true,
    }

    setUsers((prev) => [newUser, ...prev])

    // Hiển thị thông báo
    setSuccessMessage(`Người dùng mới đã đăng ký: ${data.user.username}`)
    setTimeout(() => {
      setSuccessMessage("")
    }, 5000)
  }
  useAdminSocket(handleNewUser)

  // State cho dialog chỉnh sửa
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    role: "",
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState(null)

  // State cho dialog xác nhận khóa
  const [openLockDialog, setOpenLockDialog] = useState(false)
  const [userToLock, setUserToLock] = useState(null)
  const [lockLoading, setLockLoading] = useState(false)

  // State cho dialog xác nhận xóa
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Lấy token từ localStorage
      const token = localStorage.getItem("admin-token")

      if (!token) {
        throw new Error("Không tìm thấy token xác thực")
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Không thể tải danh sách người dùng")
      }

      const data = await response.json()

      // Chuyển đổi dữ liệu từ API để phù hợp với DataGrid
      const formattedUsers = data.map((user) => ({
        id: user._id,
        shortId: user._id.slice(-4), // Lấy 4 ký tự cuối của ID
        name: user.username || "Không có tên",
        email: user.email || "Không có email",
        status: user.role || "user",
        accountStatus: user.isSuspended ? "Khóa" : "Active", // Sửa lại logic này
        isActive: !user.isSuspended, // Sửa lại logic này
      }))

      setUsers(formattedUsers)
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Hàm mở dialog chỉnh sửa
  const handleOpenEditDialog = (user) => {
    setEditUser(user)
    setEditFormData({
      username: user.name,
      email: user.email,
      role: user.status,
    })
    setEditError(null)
    setOpenEditDialog(true)
  }

  // Hàm đóng dialog chỉnh sửa
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false)
    setEditUser(null)
  }

  // Hàm xử lý thay đổi trong form chỉnh sửa
  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Hàm lưu thay đổi
  const handleSaveEdit = async () => {
    try {
      setEditLoading(true)
      setEditError(null)

      const token = localStorage.getItem("admin-token")
      if (!token) {
        throw new Error("Không tìm thấy token xác thực")
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/users/${editUser.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: editFormData.username,
          role: editFormData.role,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Không thể cập nhật thông tin người dùng")
      }

      // Cập nhật danh sách người dùng
      setUsers(
        users.map((user) =>
          user.id === editUser.id
            ? {
                ...user,
                name: editFormData.username,
                status: editFormData.role,
              }
            : user,
        ),
      )

      setSuccessMessage("Cập nhật thông tin người dùng thành công")

      // Tự động ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)

      handleCloseEditDialog()
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin người dùng:", error)
      setEditError(error.message)
    } finally {
      setEditLoading(false)
    }
  }

  // Hàm mở dialog xác nhận khóa tài khoản
  const handleOpenLockDialog = (user) => {
    setUserToLock(user)
    setOpenLockDialog(true)
  }

  // Hàm đóng dialog xác nhận khóa tài khoản
  const handleCloseLockDialog = () => {
    setOpenLockDialog(false)
    setUserToLock(null)
  }

  // Hàm thực hiện khóa/mở khóa tài khoản
  const handleToggleLock = async () => {
    try {
      setLockLoading(true)

      const token = localStorage.getItem("admin-token")
      if (!token) {
        throw new Error("Không tìm thấy token xác thực")
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/users/${userToLock.id}/toggle-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isSuspended: userToLock.isActive, // Nếu đang active thì chuyển thành suspended
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Không thể ${userToLock.isActive ? "khóa" : "mở khóa"} tài khoản`)
      }

      // Cập nhật danh sách người dùng
      setUsers(users.map((user) => (user.id === userToLock.id ? { ...user, isActive: !user.isActive } : user)))

      setSuccessMessage(`Đã ${userToLock.isActive ? "khóa" : "mở khóa"} tài khoản thành công`)

      // Tự động ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)

      handleCloseLockDialog()
    } catch (error) {
      console.error(`Lỗi khi ${userToLock.isActive ? "khóa" : "mở khóa"} tài khoản:`, error)
      setError(error.message)
    } finally {
      setLockLoading(false)
    }
  }

  // Hàm mở dialog xác nhận xóa
  const handleOpenDeleteDialog = (user) => {
    setUserToDelete(user)
    setOpenDeleteDialog(true)
  }

  // Hàm đóng dialog xác nhận xóa
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
    setUserToDelete(null)
  }

  // Hàm thực hiện xóa tài khoản
  const handleDelete = async () => {
    try {
      setDeleteLoading(true)

      const token = localStorage.getItem("admin-token")
      if (!token) {
        throw new Error("Không tìm thấy token xác thực")
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Không thể xóa tài khoản")
      }

      // Cập nhật danh sách người dùng
      setUsers(users.filter((user) => user.id !== userToDelete.id))

      setSuccessMessage("Đã xóa tài khoản thành công")

      // Tự động ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)

      handleCloseDeleteDialog()
    } catch (error) {
      console.error("Lỗi khi xóa tài khoản:", error)
      setError(error.message)
    } finally {
      setDeleteLoading(false)
    }
  }

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

  const columns = [
    {
      field: "shortId",
      headerName: "ID",
      width: 100,
    },
    {
      field: "name",
      headerName: "Tên người dùng",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    {
      field: "status",
      headerName: "Vai trò",
      flex: 1,
    },
    {
      field: "accountStatus",
      headerName: "Tình trạng",
      flex: 1,
      renderCell: ({ row }) => (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary[500],
            color: row.accountStatus === "Active" ? colors.greenAccent[400] : colors.redAccent[400],
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "bold",
            minWidth: "80px",
            boxShadow: getNeumorphicInsetShadow(),
          }}
        >
          {row.accountStatus}
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Hành động",
      headerAlign: "center",
      flex: 1,
      renderCell: ({ row }) => {
        return (
          <Box width="220px" display="flex" alignItems="center" justifyContent="space-between" gap={1}>
            <button
              className="neumorphic-btn"
              style={{
                backgroundColor: colors.primary[500],
                color: colors.greenAccent[400],
                padding: "8px 16px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                width: "70px",
                textAlign: "center",
                boxShadow: getNeumorphicShadow(),
                transition: "all 0.2s ease",
                fontSize: "13px",
                fontWeight: "bold",
              }}
              onClick={() => handleOpenEditDialog(row)}
            >
              Sửa
            </button>

            <button
              className="neumorphic-btn"
              style={{
                backgroundColor: colors.primary[500],
                color: row.isActive ? colors.blueAccent[400] : colors.greenAccent[400],
                padding: "8px 16px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                width: "70px",
                textAlign: "center",
                boxShadow: getNeumorphicShadow(),
                transition: "all 0.2s ease",
                fontSize: "13px",
                fontWeight: "bold",
              }}
              onClick={() => handleOpenLockDialog(row)}
            >
              {row.isActive ? "Khóa" : "Mở khóa"}
            </button>

            <button
              className="neumorphic-btn"
              style={{
                backgroundColor: colors.primary[500],
                color: colors.redAccent[400],
                padding: "8px 16px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                width: "70px",
                textAlign: "center",
                boxShadow: getNeumorphicShadow(),
                transition: "all 0.2s ease",
                fontSize: "13px",
                fontWeight: "bold",
              }}
              onClick={() => handleOpenDeleteDialog(row)}
            >
              Xóa
            </button>
          </Box>
        )
      },
    },
  ]

  return (
    <Box m="30px">
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Hide scrollbar */
          ::-webkit-scrollbar {
            display: none;
          }
          
          * {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .neumorphic-btn:hover {
            transform: translateY(-3px);
          }
          
          .neumorphic-btn:active {
            box-shadow: ${getNeumorphicPressedShadow()};
            transform: translateY(1px);
          }
          
          .neumorphic-card {
            border-radius: 20px;
            background-color: ${colors.primary[500]};
            box-shadow: ${getNeumorphicShadow()};
            transition: all 0.3s ease;
          }
          
          .neumorphic-card:hover {
            transform: translateY(-5px);
          }
          
          .MuiDataGrid-root {
            border-radius: 20px !important;
            overflow: hidden;
            box-shadow: ${getNeumorphicShadow()} !important;
            border: none !important;
          }
          
          .MuiDataGrid-columnHeaders {
            background-color: ${colors.primary[400]} !important;
            border-bottom: none !important;
          }
          
          .MuiDataGrid-cell {
            border-bottom: 1px solid ${colors.primary[400]} !important;
          }
          
          .MuiDataGrid-footerContainer {
            border-top: none !important;
            background-color: ${colors.primary[400]} !important;
          }
          
          .MuiTablePagination-root {
            color: ${colors.gray[100]} !important;
          }
          
          .MuiTablePagination-selectIcon {
            color: ${colors.gray[100]} !important;
          }
          
          .MuiDataGrid-toolbarContainer {
            padding: 15px !important;
            gap: 10px !important;
          }
          
          .MuiButton-root {
            background-color: ${colors.primary[500]} !important;
            box-shadow: ${getNeumorphicShadow()} !important;
            border-radius: 12px !important;
            padding: 8px 16px !important;
            color: ${colors.gray[100]} !important;
            transition: all 0.2s ease !important;
          }
          
          .MuiButton-root:hover {
            transform: translateY(-3px) !important;
          }
          
          .MuiButton-root:active {
            box-shadow: ${getNeumorphicPressedShadow()} !important;
            transform: translateY(1px) !important;
          }
        `}
      </style>

      <Header title="Danh sách tài khoản" subtitle="Quản lý các tài khoản người dùng" />

      {error && (
        <Box
          className="neumorphic-card"
          bgcolor={colors.primary[500]}
          color={colors.redAccent[400]}
          p={3}
          borderRadius="20px"
          mb={3}
          sx={{
            boxShadow: getNeumorphicShadow(),
          }}
        >
          <Typography fontWeight="bold">Lỗi: {error}</Typography>
        </Box>
      )}

      {successMessage && (
        <Box
          className="neumorphic-card"
          bgcolor={colors.primary[500]}
          color={colors.greenAccent[400]}
          p={3}
          borderRadius="20px"
          mb={3}
          sx={{
            boxShadow: getNeumorphicShadow(),
          }}
        >
          <Typography fontWeight="bold">{successMessage}</Typography>
        </Box>
      )}

      <Box
        mt="40px"
        height="75vh"
        flex={1}
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
            height: "fit-content",
            fontFamily: '"Poppins", sans-serif',
          },
          "& .MuiDataGrid-cell": {
            border: "none",
            fontSize: "15px",
            padding: "16px",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[400],
            fontWeight: "bold",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.primary[400],
            borderBottom: "none",
            fontSize: "16px",
            fontWeight: "bold",
            color: colors.gray[100],
            padding: "10px 0",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[500],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.primary[400],
            fontSize: "15px",
            fontWeight: "bold",
            padding: "10px 0",
          },
          "& .MuiDataGrid-iconSeparator": {
            display: "none",
          },
          "& .MuiCircularProgress-root": {
            color: colors.greenAccent[400],
          },
          "& .MuiDataGrid-toolbarContainer": {
            backgroundColor: colors.primary[400],
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
          },
          "& .MuiButton-root": {
            backgroundColor: colors.primary[500],
            color: colors.gray[100],
            fontWeight: "bold",
            fontSize: "13px",
          },
        }}
      >
        <DataGrid
          rows={users}
          columns={columns}
          components={{ Toolbar: GridToolbar }}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </Box>

      {/* Dialog chỉnh sửa thông tin người dùng */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: colors.primary[500],
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: colors.primary[400],
            color: colors.gray[100],
            fontSize: "20px",
            fontWeight: "bold",
            padding: "20px 25px",
          }}
        >
          Chỉnh sửa thông tin người dùng
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[500], pt: 3, padding: "25px" }}>
          {editError && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: "12px",
                backgroundColor: "transparent",
                color: colors.redAccent[400],
                border: `1px solid ${colors.redAccent[400]}`,
                "& .MuiAlert-icon": {
                  color: colors.redAccent[400],
                },
              }}
            >
              {editError}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                mb: 1,
                color: colors.gray[300],
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Tên người dùng
            </Typography>
            <TextField
              fullWidth
              name="username"
              value={editFormData.username}
              onChange={handleEditFormChange}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: colors.primary[500],
                  borderRadius: "12px",
                  boxShadow: getNeumorphicInsetShadow(),
                  "& fieldset": { border: "none" },
                },
                "& .MuiInputBase-input": {
                  color: colors.gray[100],
                  padding: "15px",
                  fontSize: "15px",
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                mb: 1,
                color: colors.gray[300],
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Email
            </Typography>
            <TextField
              fullWidth
              name="email"
              value={editFormData.email}
              disabled
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: colors.primary[600],
                  borderRadius: "12px",
                  boxShadow: getNeumorphicInsetShadow(),
                  "& fieldset": { border: "none" },
                  "&.Mui-disabled": {
                    backgroundColor: colors.primary[600],
                  },
                },
                "& .MuiInputBase-input": {
                  color: colors.gray[400],
                  padding: "15px",
                  fontSize: "15px",
                  "&.Mui-disabled": {
                    WebkitTextFillColor: colors.gray[400],
                    color: colors.gray[400],
                  },
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                mb: 1,
                color: colors.gray[300],
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Vai trò
            </Typography>
            <FormControl fullWidth>
              <Select
                name="role"
                value={editFormData.role}
                onChange={handleEditFormChange}
                displayEmpty
                sx={{
                  backgroundColor: colors.primary[500],
                  borderRadius: "12px",
                  boxShadow: getNeumorphicInsetShadow(),
                  border: "none",
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-select": {
                    color: colors.gray[100],
                    padding: "15px",
                    fontSize: "15px",
                  },
                  "& .MuiSvgIcon-root": {
                    color: colors.gray[100],
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: colors.primary[400],
                      borderRadius: "12px",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                      "& .MuiMenuItem-root": {
                        color: colors.gray[100],
                        fontSize: "15px",
                        padding: "12px 20px",
                        "&:hover": {
                          backgroundColor: colors.primary[500],
                        },
                        "&.Mui-selected": {
                          backgroundColor: colors.primary[600],
                          color: colors.greenAccent[400],
                          fontWeight: "bold",
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="user">user</MenuItem>
                <MenuItem value="admin">admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.primary[400], p: 3 }}>
          <Button
            onClick={handleCloseEditDialog}
            className="neumorphic-btn"
            sx={{
              backgroundColor: colors.primary[500],
              color: colors.gray[300],
              padding: "10px 20px",
              borderRadius: "12px",
              boxShadow: getNeumorphicShadow(),
              fontSize: "14px",
              fontWeight: "bold",
              "&:hover": { backgroundColor: colors.primary[500] },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={editLoading}
            className="neumorphic-btn"
            sx={{
              backgroundColor: colors.primary[500],
              color: colors.greenAccent[400],
              padding: "10px 20px",
              borderRadius: "12px",
              boxShadow: getNeumorphicShadow(),
              fontSize: "14px",
              fontWeight: "bold",
              "&:hover": { backgroundColor: colors.primary[500] },
            }}
          >
            {editLoading ? <CircularProgress size={24} color="inherit" /> : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xác nhận khóa/mở khóa tài khoản */}
      <Dialog
        open={openLockDialog}
        onClose={handleCloseLockDialog}
        PaperProps={{
          style: {
            backgroundColor: colors.primary[500],
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: colors.primary[400],
            color: colors.gray[100],
            fontSize: "20px",
            fontWeight: "bold",
            padding: "20px 25px",
          }}
        >
          {userToLock?.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[500], pt: 3, padding: "25px" }}>
          <Typography
            color={colors.gray[100]}
            sx={{
              fontSize: "15px",
              backgroundColor: colors.primary[500],
              padding: "15px 20px",
              borderRadius: "12px",
              boxShadow: getNeumorphicInsetShadow(),
            }}
          >
            {userToLock?.isActive
              ? `Bạn có chắc chắn muốn khóa tài khoản ${userToLock?.name} không?`
              : `Bạn có chắc chắn muốn mở khóa tài khoản ${userToLock?.name} không?`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.primary[400], p: 3 }}>
          <Button
            onClick={handleCloseLockDialog}
            className="neumorphic-btn"
            sx={{
              backgroundColor: colors.primary[500],
              color: colors.gray[300],
              padding: "10px 20px",
              borderRadius: "12px",
              boxShadow: getNeumorphicShadow(),
              fontSize: "14px",
              fontWeight: "bold",
              "&:hover": { backgroundColor: colors.primary[500] },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleToggleLock}
            disabled={lockLoading}
            className="neumorphic-btn"
            sx={{
              backgroundColor: colors.primary[500],
              color: userToLock?.isActive ? colors.blueAccent[400] : colors.greenAccent[400],
              padding: "10px 20px",
              borderRadius: "12px",
              boxShadow: getNeumorphicShadow(),
              fontSize: "14px",
              fontWeight: "bold",
              "&:hover": { backgroundColor: colors.primary[500] },
            }}
          >
            {lockLoading ? <CircularProgress size={24} color="inherit" /> : userToLock?.isActive ? "Khóa" : "Mở khóa"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xác nhận xóa tài khoản */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          style: {
            backgroundColor: colors.primary[500],
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: colors.primary[400],
            color: colors.gray[100],
            fontSize: "20px",
            fontWeight: "bold",
            padding: "20px 25px",
          }}
        >
          Xóa tài khoản
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[500], pt: 3, padding: "25px" }}>
          <Typography
            color={colors.gray[100]}
            sx={{
              fontSize: "15px",
              backgroundColor: colors.primary[500],
              padding: "15px 20px",
              borderRadius: "12px",
              boxShadow: getNeumorphicInsetShadow(),
            }}
          >
            {`Bạn có chắc chắn muốn xóa tài khoản ${userToDelete?.name} không? Hành động này không thể hoàn tác.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.primary[400], p: 3 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            className="neumorphic-btn"
            sx={{
              backgroundColor: colors.primary[500],
              color: colors.gray[300],
              padding: "10px 20px",
              borderRadius: "12px",
              boxShadow: getNeumorphicShadow(),
              fontSize: "14px",
              fontWeight: "bold",
              "&:hover": { backgroundColor: colors.primary[500] },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="neumorphic-btn"
            sx={{
              backgroundColor: colors.primary[500],
              color: colors.redAccent[400],
              padding: "10px 20px",
              borderRadius: "12px",
              boxShadow: getNeumorphicShadow(),
              fontSize: "14px",
              fontWeight: "bold",
              "&:hover": { backgroundColor: colors.primary[500] },
            }}
          >
            {deleteLoading ? <CircularProgress size={24} color="inherit" /> : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Acc
