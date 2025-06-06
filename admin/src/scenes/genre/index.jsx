import { Box, useTheme, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Grid, IconButton } from "@mui/material";
import { Header } from "../../components";
import { DataGrid, GridToolbar, GridToolbarContainer } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { useState, useEffect } from "react";
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from "@mui/icons-material";

const Genre = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [genreName, setGenreName] = useState("");
  const [error, setError] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);
  const [tempEditValue, setTempEditValue] = useState("");

  // Fetch genres from API
  useEffect(() => {
    fetchGenres();
  }, []);

    // Tạo custom toolbar
  const CustomToolbar = () => {
    return (
      <GridToolbarContainer sx={{ justifyContent: 'space-between', p: 1 }}>
        <Box>
          <GridToolbar />
        </Box>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              backgroundColor: "#4caf50",
              color: "#fff",
              "&:hover": { backgroundColor: "#45a049" }
            }}
          >
            Thêm thể loại mới
          </Button>
        </Box>
      </GridToolbarContainer>
    );
  };

  const fetchGenres = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('admin-token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/admin/genres`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const formattedGenres = data.map((genre, index) => ({
        id: genre._id,
        stt: index + 1,
        genre_name: String(genre.genre_name || ''),
        soft_delete: Boolean(genre.soft_delete || false),
        status: genre.soft_delete ? 'hidden' : 'visible',
        ...genre
      }));
      
      console.log('Formatted genres:', formattedGenres);
      setGenres(formattedGenres);
    } catch (error) {
      console.error('Error fetching genres:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGenre = async () => {
    if (!genreName.trim()) {
      alert('Vui lòng nhập tên thể loại');
      return;
    }

    try {
      const token = localStorage.getItem('admin-token');
      if (!token) {
        alert('Không tìm thấy token xác thực');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/admin/genres`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ genre_name: genreName.trim() })
      });

      if (response.ok) {
        alert('Thêm thể loại thành công!');
        await fetchGenres();
        setAddDialogOpen(false);
        setGenreName("");
      } else {
        const errorData = await response.json();
        alert('Lỗi khi thêm thể loại: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error adding genre:', error);
      alert('Lỗi khi thêm thể loại: ' + error.message);
    }
  };

  const handleToggleVisibility = async (genreId, currentSoftDelete) => {
    try {
      const token = localStorage.getItem('admin-token');
      if (!token) {
        alert('Không tìm thấy token xác thực');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/admin/genres/${genreId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ soft_delete: !currentSoftDelete })
      });

      if (response.ok) {
        await fetchGenres();
      } else {
        const errorData = await response.json();
        alert('Lỗi khi cập nhật trạng thái: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Lỗi khi cập nhật trạng thái: ' + error.message);
    }
  };

  const handleCellDoubleClick = (params) => {
    if (params.field === 'genre_name' && !params.row.soft_delete) {
      setEditingRowId(params.id);
      setTempEditValue(params.value);
    }
  };

  const handleEditSave = async (genreId) => {
    if (!tempEditValue.trim()) {
      alert('Tên thể loại không được để trống');
      return;
    }

    try {
      const token = localStorage.getItem('admin-token');
      if (!token) {
        alert('Không tìm thấy token xác thực');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/admin/genres/${genreId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ genre_name: tempEditValue.trim() })
      });

      if (response.ok) {
        await fetchGenres();
        setEditingRowId(null);
        setTempEditValue("");
      } else {
        const errorData = await response.json();
        alert('Lỗi khi cập nhật tên thể loại: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error updating genre name:', error);
      alert('Lỗi khi cập nhật tên thể loại: ' + error.message);
    }
  };

  const handleEditCancel = () => {
    setEditingRowId(null);
    setTempEditValue("");
  };

  const columns = [
    { field: "stt", headerName: "STT", flex: 0.5 },
    { 
      field: "genre_name", 
      headerName: "Tên thể loại", 
      flex: 2,
      renderCell: ({ row, value }) => {
        if (editingRowId === row.id) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <TextField
                value={tempEditValue}
                onChange={(e) => setTempEditValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleEditSave(row.id);
                  } else if (e.key === 'Escape') {
                    handleEditCancel();
                  }
                }}
                onBlur={() => handleEditCancel()}
                autoFocus
                size="small"
                sx={{ mr: 1 }}
              />
            </Box>
          );
        }
        return (
          <Box 
            sx={{ 
              opacity: row.soft_delete ? 0.5 : 1,
              cursor: !row.soft_delete ? 'pointer' : 'not-allowed'
            }}
            title={!row.soft_delete ? 'Double-click để chỉnh sửa' : 'Không thể chỉnh sửa khi ẩn'}
          >
            {value}
            {!row.soft_delete && (
              <EditIcon sx={{ ml: 1, fontSize: '14px', opacity: 0.6 }} />
            )}
          </Box>
        );
      }
    },
    {
      field: "status",
      headerName: "Trạng thái",
      flex: 1,
      renderCell: ({ row }) => (
        <Box
          sx={{
            backgroundColor: row.soft_delete ? '#e74c3c' : '#27ae60',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {row.soft_delete ? 'Ẩn' : 'Hiển thị'}
        </Box>
      )
    },
    {
      field: "action",
      headerName: "Hành động",
      flex: 1,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => handleToggleVisibility(row.id, row.soft_delete)}
            sx={{
              backgroundColor: row.soft_delete ? '#27ae60' : '#e74c3c',
              color: '#fff',
              '&:hover': {
                backgroundColor: row.soft_delete ? '#229954' : '#c0392b',
              },
              padding: '4px 8px',
              borderRadius: '4px'
            }}
            title={row.soft_delete ? 'Hiển thị' : 'Ẩn'}
          >
            {row.soft_delete ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
          </IconButton>
        </Box>
      )
    },
  ];

  return (
    <Box m="20px">
      <Header
        title="Quản lý Thể loại"
        subtitle="Danh sách thể loại sách"
      />
      
      {error && (
        <Box 
          bgcolor="error.main" 
          color="white" 
          p={2} 
          borderRadius={1} 
          mb={2}
        >
          <Typography>Lỗi: {error}</Typography>
        </Box>
      )}

      {/* Add Genre Button */}
      {/* <Box mb={2} mt={1}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          sx={{
            backgroundColor: "#4caf50",
            color: "#fff",
            "&:hover": { backgroundColor: "#45a049" }
          }}
        >
          Thêm thể loại mới
        </Button>
      </Box> */}

      <Box
        mt="20px"
        height="75vh"
        maxWidth="100%"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
            height: "fit-content", // Thêm dòng này
          },
          "& .MuiDataGrid-cell": {
            border: "none",
            fontSize: "17px",
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
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-iconSeparator": {
            color: colors.primary[100],
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.gray[100]} !important`,
          },
        }}
      >
        <DataGrid
          rows={genres}
          columns={columns}
           components={{ Toolbar: CustomToolbar }} // Thay đổi từ GridToolbar thành CustomToolbar
          loading={loading}
          onCellDoubleClick={handleCellDoubleClick}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
            sorting: {
              sortModel: [
                {
                  field: 'genre_name',
                  sort: 'asc',
                },
              ],
            },
          }}
        />
      </Box>

      {/* Add Genre Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h4" fontWeight="bold">
            Thêm thể loại mới
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Tên thể loại"
            value={genreName}
            onChange={(e) => setGenreName(e.target.value)}
            placeholder="Nhập tên thể loại..."
            autoFocus
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} color="secondary">
            Hủy
          </Button>
          <Button 
            onClick={handleAddGenre} 
            variant="contained" 
            sx={{ backgroundColor: "#4caf50" }}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Genre;