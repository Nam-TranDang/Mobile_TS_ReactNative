import { useState, useEffect } from "react";
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
  InputLabel,
  Select,
  MenuItem,
  CircularProgress, 
  Alert
} from "@mui/material";
import { Header } from "../../components";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import useAdminSocket from "../../hooks/useAdminSocket";

const Acc = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // THÊM: Socket event handlers
  const handleNewUser = (data) => {
    console.log('New user registered:', data);
    
    // Thêm user mới vào danh sách
    const newUser = {
      id: data.user._id,
      shortId: data.user._id.slice(-4),
      name: data.user.username || "Không có tên",
      email: data.user.email || "Không có email", 
      status: data.user.role || "user",
      accountStatus: "Active",
      isActive: true
    };
    
    setUsers(prev => [newUser, ...prev]);
    
    // Hiển thị thông báo
    setSuccessMessage(`Người dùng mới đã đăng ký: ${data.user.username}`);
    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };
    useAdminSocket(
    handleNewUser, 
  );

  // State cho dialog chỉnh sửa
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    role: ""
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  
  // State cho dialog xác nhận khóa
  const [openLockDialog, setOpenLockDialog] = useState(false);
  const [userToLock, setUserToLock] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);
  
  // State cho dialog xác nhận xóa
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

   const fetchUsers = async () => {
    try {
      setLoading(true);
      // Lấy token từ localStorage
      const token = localStorage.getItem("admin-token");
      
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể tải danh sách người dùng");
      }

      const data = await response.json();
      
      // Chuyển đổi dữ liệu từ API để phù hợp với DataGrid
      const formattedUsers = data.map((user) => ({
        id: user._id,
        shortId: user._id.slice(-4), // Lấy 4 ký tự cuối của ID
        name: user.username || "Không có tên",
        email: user.email || "Không có email",
        status: user.role || "user",
        accountStatus: user.isSuspended ? "Khóa" : "Active", // Sửa lại logic này
        isActive: !user.isSuspended // Sửa lại logic này
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Hàm mở dialog chỉnh sửa
  const handleOpenEditDialog = (user) => {
    setEditUser(user);
    setEditFormData({
      username: user.name,
      email: user.email,
      role: user.status
    });
    setEditError(null);
    setOpenEditDialog(true);
  };

  // Hàm đóng dialog chỉnh sửa
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditUser(null);
  };

  // Hàm xử lý thay đổi trong form chỉnh sửa
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Hàm lưu thay đổi
  const handleSaveEdit = async () => {
    try {
      setEditLoading(true);
      setEditError(null);
      
      const token = localStorage.getItem("admin-token");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/users/${editUser.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: editFormData.username,
          role: editFormData.role
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể cập nhật thông tin người dùng");
      }
      
      // Cập nhật danh sách người dùng
      setUsers(users.map(user => 
        user.id === editUser.id 
          ? { 
              ...user, 
              name: editFormData.username,
              status: editFormData.role
            }
          : user
      ));
      
      setSuccessMessage("Cập nhật thông tin người dùng thành công");
      
      // Tự động ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      
      handleCloseEditDialog();
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin người dùng:", error);
      setEditError(error.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Hàm mở dialog xác nhận khóa tài khoản
  const handleOpenLockDialog = (user) => {
    setUserToLock(user);
    setOpenLockDialog(true);
  };

  // Hàm đóng dialog xác nhận khóa tài khoản
  const handleCloseLockDialog = () => {
    setOpenLockDialog(false);
    setUserToLock(null);
  };

  // Hàm thực hiện khóa/mở khóa tài khoản
  const handleToggleLock = async () => {
    try {
      setLockLoading(true);
      
      const token = localStorage.getItem("admin-token");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/users/${userToLock.id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isSuspended: userToLock.isActive // Nếu đang active thì chuyển thành suspended
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Không thể ${userToLock.isActive ? 'khóa' : 'mở khóa'} tài khoản`);
      }
      
      // Cập nhật danh sách người dùng
      setUsers(users.map(user => 
        user.id === userToLock.id 
          ? { ...user, isActive: !user.isActive }
          : user
      ));
      
      setSuccessMessage(`Đã ${userToLock.isActive ? 'khóa' : 'mở khóa'} tài khoản thành công`);
      
      // Tự động ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      
      handleCloseLockDialog();
    } catch (error) {
      console.error(`Lỗi khi ${userToLock.isActive ? 'khóa' : 'mở khóa'} tài khoản:`, error);
      setError(error.message);
    } finally {
      setLockLoading(false);
    }
  };

  // Hàm mở dialog xác nhận xóa
  const handleOpenDeleteDialog = (user) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  // Hàm đóng dialog xác nhận xóa
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  // Hàm thực hiện xóa tài khoản
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      const token = localStorage.getItem("admin-token");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể xóa tài khoản");
      }
      
      // Cập nhật danh sách người dùng
      setUsers(users.filter(user => user.id !== userToDelete.id));
      
      setSuccessMessage("Đã xóa tài khoản thành công");
      
      // Tự động ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Lỗi khi xóa tài khoản:", error);
      setError(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { 
      field: "shortId", 
      headerName: "ID", 
      width: 100
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
      flex: 1
    },
    {
      field: "status",
      headerName: "Vai trò",
      flex: 1
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
            backgroundColor: row.accountStatus === "Active" 
              ? colors.greenAccent[600] 
              : colors.redAccent[600],
            color: colors.gray[100],
            padding: "4px 12px",
            borderRadius: "16px",
            fontSize: "12px",
            fontWeight: "bold",
            minWidth: "60px"
          }}
        >
          {row.accountStatus}
        </Box>
      )
    },
    {
      field: "actions",
      headerName: "Hành động",
      headerAlign: "center",
      flex: 1,
      renderCell: ({ row }) => {
        return (
          <Box
            width="200px"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
          >
            <button
              style={{
                backgroundColor: colors.greenAccent[600],
                color: colors.gray[100],
                padding: "5px 10px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                width: "70px", 
                textAlign: "center", 
              }}
              onClick={() => handleOpenEditDialog(row)}
            >
              Sửa
            </button>
            
            <button
              style={{
                backgroundColor: row.isActive ? colors.blueAccent[300] : colors.greenAccent[500],
                color: colors.gray[100],
                padding: "5px 10px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                width: "70px", 
                textAlign: "center", 
              }}
              onClick={() => handleOpenLockDialog(row)}
            >
              {row.isActive ? "Khóa" : "Mở khóa"}
            </button>

            <button
              style={{
                backgroundColor: colors.redAccent[600],
                color: colors.gray[100],
                padding: "5px 10px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                width: "70px", 
                textAlign: "center", 
              }}
              onClick={() => handleOpenDeleteDialog(row)}
            >
              Xóa
            </button>
          </Box>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Header title="Danh sách tài khoản" subtitle="Quản lý các tài khoản người dùng" />
      
      {error && (
        <Box 
          bgcolor={colors.redAccent[500]} 
          color={colors.gray[100]} 
          p={2} 
          borderRadius={1} 
          mb={2}
        >
          <Typography>Lỗi: {error}</Typography>
        </Box>
      )}
      
      {successMessage && (
        <Box 
          bgcolor={colors.greenAccent[600]} 
          color={colors.gray[100]} 
          p={2} 
          borderRadius={1} 
          mb={2}
        >
          <Typography>{successMessage}</Typography>
        </Box>
      )}
      
      <Box
        mt="40px"
        height="75vh"
        flex={1}
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
            height: "fit-content", // Thêm dòng này
          },
          "& .MuiDataGrid-cell": {
            border: "none",
            fontSize: "17px",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#56c3b7",
            borderBottom: "none",
            fontSize: "18px", 
            fontWeight: "bold", 
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: "#56c3b7",
            fontSize: "17px", 
            fontWeight: "bold",
          },
          "& .MuiDataGrid-iconSeparator": {
            color: colors.primary[100],
          },
          "& .MuiCircularProgress-root": {
            color: colors.greenAccent[500],
          }
        }}
      >
        <DataGrid
          rows={users}
          columns={columns}
          components={{ Toolbar: GridToolbar }} // Đây là phần tạo ra toolbar
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
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.primary[400], color: colors.gray[100] }}>
          Chỉnh sửa thông tin người dùng
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[400], pt: 2 }}>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}
          
          <TextField
            fullWidth
            margin="dense"
            label="Tên người dùng"
            name="username"
            value={editFormData.username}
            onChange={handleEditFormChange}
            sx={{
              mb: 2,
              "& .MuiInputLabel-root": { color: colors.gray[100] },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: colors.gray[100] },
                "&:hover fieldset": { borderColor: colors.greenAccent[400] },
                "&.Mui-focused fieldset": { borderColor: colors.greenAccent[400] },
              },
              "& .MuiInputBase-input": { color: colors.gray[100] }
            }}
          />
          
          <TextField
            fullWidth
            margin="dense"
            label="Email"
            name="email"
            value={editFormData.email}
            disabled
            sx={{
              mb: 2,
              "& .MuiInputLabel-root": { color: colors.gray[100] },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: colors.gray[100] },
                "&:hover fieldset": { borderColor: colors.gray[100] },
                "&.Mui-focused fieldset": { borderColor: colors.gray[100] },
                "&.Mui-disabled fieldset": { borderColor: colors.gray[500] },
              },
              "& .MuiInputBase-input": { 
                color: colors.gray[400],
                "&.Mui-disabled": { 
                  WebkitTextFillColor: colors.gray[400],
                  color: colors.gray[400] 
                }
              }
            }}
          />
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="role-select-label" sx={{ color: colors.gray[100] }}>Vai trò</InputLabel>
            <Select
              labelId="role-select-label"
              name="role"
              value={editFormData.role}
              onChange={handleEditFormChange}
              sx={{
                color: colors.gray[100],
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.gray[100]
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.greenAccent[400]
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.greenAccent[400]
                },
                "& .MuiSvgIcon-root": {
                  color: colors.gray[100]
                }
              }}
            >
              <MenuItem value="user" sx={{ color: colors.gray[800] }}>user</MenuItem>
              <MenuItem value="admin" sx={{ color: colors.gray[800] }}>admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.primary[400], p: 2 }}>
          <Button 
            onClick={handleCloseEditDialog} 
            sx={{ 
              color: colors.gray[100],
              "&:hover": { backgroundColor: colors.redAccent[700] }
            }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            disabled={editLoading}
            sx={{ 
              bgcolor: colors.greenAccent[600],
              color: colors.gray[100],
              "&:hover": { backgroundColor: colors.greenAccent[400] }
            }}
          >
            {editLoading ? <CircularProgress size={24} color="inherit" /> : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog xác nhận khóa/mở khóa tài khoản */}
      <Dialog open={openLockDialog} onClose={handleCloseLockDialog}>
        <DialogTitle sx={{ bgcolor: colors.primary[400], color: colors.gray[100] }}>
          {userToLock?.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[400], pt: 2 }}>
          <Typography color={colors.gray[100]}>
            {userToLock?.isActive 
              ? `Bạn có chắc chắn muốn khóa tài khoản ${userToLock?.name} không?` 
              : `Bạn có chắc chắn muốn mở khóa tài khoản ${userToLock?.name} không?`
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.primary[400], p: 2 }}>
          <Button 
            onClick={handleCloseLockDialog}
            sx={{ 
              color: colors.gray[100],
              "&:hover": { backgroundColor: colors.redAccent[700] }
            }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleToggleLock} 
            variant="contained" 
            disabled={lockLoading}
            sx={{ 
              bgcolor: userToLock?.isActive ? colors.blueAccent[600] : colors.greenAccent[600],
              color: colors.gray[100],
              "&:hover": { 
                backgroundColor: userToLock?.isActive 
                  ? colors.blueAccent[400] 
                  : colors.greenAccent[400] 
              }
            }}
          >
            {lockLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              userToLock?.isActive ? "Khóa" : "Mở khóa"
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog xác nhận xóa tài khoản */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle sx={{ bgcolor: colors.primary[400], color: colors.gray[100] }}>
          Xóa tài khoản
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[400], pt: 2 }}>
          <Typography color={colors.gray[100]}>
            {`Bạn có chắc chắn muốn xóa tài khoản ${userToDelete?.name} không? Hành động này không thể hoàn tác.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.primary[400], p: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            sx={{ 
              color: colors.gray[100],
              "&:hover": { backgroundColor: colors.primary[300] }
            }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            disabled={deleteLoading}
            sx={{ 
              bgcolor: colors.redAccent[600],
              color: colors.gray[100],
              "&:hover": { backgroundColor: colors.redAccent[400] }
            }}
          >
            {deleteLoading ? <CircularProgress size={24} color="inherit" /> : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Acc;