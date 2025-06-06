import { Box, useTheme, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Grid } from "@mui/material";
import { Header } from "../../components";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { useState, useEffect } from "react";
import  useAdminSocket  from "../../hooks/useAdminSocket"; // Import custom hook for socket connection

const Book = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
    
  // Fetch books from API
  useEffect(() => {
    fetchBooks();
  }, []);
 const [successMessage, setSuccessMessage] = useState("");

  const handleNewBook = (data) => {
  console.log('New book received:', data);
  
  const newBook = {
    id: data.book._id,
    shortId: data.book._id.slice(-4),
    title: data.book.title,
    username: data.user.username || data.user.name || 'Unknown',
    rating: data.book.rating,
    status: data.book.process || 'pending',
    createdAt: data.book.createdAt
  };
  
  setBooks(prev => [newBook, ...prev]);
  
  setSuccessMessage(`Bài viết mới: ${data.book.title}`);
  setTimeout(() => {
    setSuccessMessage("");
  }, 5000);
};

// Initialize socket
useAdminSocket(
  handleNewBook, // onNewBook
);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('admin-token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/books?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Debug để xem cấu trúc dữ liệu
      console.log('Full book data:', data.books?.[0] || data[0]);
      console.log('Like data:', (data.books?.[0] || data[0])?.likedBy);
      console.log('Dislike data:', (data.books?.[0] || data[0])?.dislikedBy);
      console.log('Like count:', (data.books?.[0] || data[0])?.like_count);
      console.log('Dislike count:', (data.books?.[0] || data[0])?.dislike_count);
      
      // Xử lý dữ liệu trả về (có thể là data.books hoặc data trực tiếp)
      const booksArray = data.books || data;
      
      const formattedBooks = booksArray.map((book, index) => {
        // Debug cho từng book
        console.log(`Book ${index + 1}:`, {
          title: book.title,
          likedBy: book.likedBy,
          dislikedBy: book.dislikedBy,
          like_count: book.like_count,
          dislike_count: book.dislike_count
        });
        
        return {
          id: book._id,
          stt: index + 1,
          username: book.user?.username || book.user?.name || 'Unknown',
          shortId: book._id ? `...${book._id.slice(-4)}` : 'N/A',
          title: String(book.title || ''),
          caption: String(book.caption || ''),
          rating: Number(book.rating || 0),
          createdAt: book.createdAt,
          imageUrl: book.imageUrl || book.image || book.thumbnail || null,
          genres: book.genres || book.category || null,
          
          // Thử nhiều cách map like/dislike data
          likes: book.likedBy || book.likes || [],
          dislikes: book.dislikedBy || book.dislikes || [],
          likesCount: book.like_count || 
                     (Array.isArray(book.likedBy) ? book.likedBy.length : 0) ||
                     (Array.isArray(book.likes) ? book.likes.length : 0) || 
                     book.likesCount || 0,
          dislikesCount: book.dislike_count || 
                        (Array.isArray(book.dislikedBy) ? book.dislikedBy.length : 0) ||
                        (Array.isArray(book.dislikes) ? book.dislikes.length : 0) || 
                        book.dislikesCount || 0,
          
          userObject: book.user,
          ...book
        };
      });
      
      console.log('Formatted books:', formattedBooks[0]);
      console.log('Total books:', formattedBooks.length);
      setBooks(formattedBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (row) => {
    setSelectedBook(row);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBook(null);
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa sách "${selectedBook.title}"?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('admin-token');
      if (!token) {
        alert('Không tìm thấy token xác thực');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/books/${selectedBook.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Xóa sách thành công!');
        await fetchBooks(); // Refresh the books list
        setDialogOpen(false);
        setSelectedBook(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete book:', errorData.message);
        alert('Không thể xóa sách: ' + (errorData.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Lỗi khi xóa sách: ' + error.message);
    }
  };

  // Functions cho xử lý ảnh
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
    setSelectedImage('');
  };

  const columns = [
    { field: "stt", headerName: "STT", flex: 0.5 },
    { 
      field: "username", 
      headerName: "Người đăng", 
      flex: 1,
      renderCell: ({ row }) => (
        <span>
          {row.username || 'Unknown'}
        </span>
      )
    },
    { 
      field: "shortId", 
      headerName: "ID", 
      flex: 0.8,
      renderCell: ({ row }) => (
        <span title={row.id}>
          {row.shortId}
        </span>
      )
    },
    { 
      field: "title", 
      headerName: "Tiêu đề", 
      flex: 2,
      renderCell: ({ value }) => (
        <span title={value}>{String(value || '').substring(0, 50)}{String(value || '').length > 50 ? '...' : ''}</span>
      )
    },
    { 
      field: "caption", 
      headerName: "Mô tả", 
      flex: 2,
      renderCell: ({ value }) => (
        <span title={value}>{String(value || '').substring(0, 40)}{String(value || '').length > 40 ? '...' : ''}</span>
      )
    },
    {
      field: "rating",
      headerName: "Đánh giá",
      flex: 0.8,
      renderCell: ({ value }) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <span>⭐ {Number(value || 0).toFixed(1)}</span>
        </Box>
      )
    },
    // Cột Like riêng
    {
      field: "likesCount",
      headerName: "Like",
      flex: 0.7,
      renderCell: ({ row }) => {
        console.log('Like data for row:', row.title, 'Count:', row.likesCount, 'Array:', row.likes);
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              justifyContent: 'center'
            }}
          >
            <span style={{ color: '#4caf50', fontSize: '16px' }}>👍</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4caf50' }}>
              {row.likesCount || 0}
            </span>
          </Box>
        );
      }
    },
    // Cột Dislike riêng
    {
      field: "dislikesCount",
      headerName: "Dislike",
      flex: 0.7,
      renderCell: ({ row }) => {
        console.log('Dislike data for row:', row.title, 'Count:', row.dislikesCount, 'Array:', row.dislikes);
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              justifyContent: 'center'
            }}
          >
            <span style={{ color: '#f44336', fontSize: '16px' }}>👎</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f44336' }}>
              {row.dislikesCount || 0}
            </span>
          </Box>
        );
      }
    },
    {
      field: "createdAt",
      headerName: "Ngày tạo",
      flex: 1,
      renderCell: ({ value }) => (
        <span>
          {value ? new Date(value).toLocaleDateString('vi-VN') : 'N/A'}
        </span>
      )
    },
    {
      field: "action",
      headerName: "Hành động",
      flex: 1,
      renderCell: ({ row }) => (
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#4caf50",
            color: "#fff",
            "&:hover": { backgroundColor: "#45a049" }
          }}
          onClick={() => handleActionClick(row)}
        >
          Chi tiết
        </Button>
      )
    },
  ];

  return (
    <Box m="20px">
      <Header
        title="Quản lý Sách"
        subtitle="Danh sách sách được đăng bởi người dùng"
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

      <Box
        mt="40px"
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
          rows={books}
          columns={columns}
          components={{ Toolbar: GridToolbar }}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
            sorting: {
              sortModel: [
                {
                  field: 'createdAt',
                  sort: 'desc',
                },
              ],
            },
          }}
        />
      </Box>

      {/* Book Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h4" fontWeight="bold">
            Chi tiết Sách
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedBook && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Row 1: ID và Người đăng */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  ID:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedBook.id}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Người đăng:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedBook.userObject?.username || selectedBook.userObject?.name || 'Unknown'}
                </Typography>
              </Grid>

              {/* Row 2: Tiêu đề và Danh mục */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Tiêu đề:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedBook.title}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Danh mục:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedBook.genres ? 
                    (Array.isArray(selectedBook.genres) ? 
                      selectedBook.genres.join(', ') : 
                      selectedBook.genres
                    ) : 
                    'Chưa phân loại'
                  }
                </Typography>
              </Grid>

              {/* Row 3: Mô tả (full width) */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Mô tả:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedBook.caption || 'Không có mô tả'}
                </Typography>
              </Grid>

              {/* Row 4: Đánh giá và Like/Dislike */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Đánh giá:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  ⭐ {Number(selectedBook.rating || 0).toFixed(1)} / 5.0
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Like/Dislike:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ color: '#4caf50', fontSize: '20px' }}>👍</span>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {selectedBook.likesCount || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ color: '#f44336', fontSize: '20px' }}>👎</span>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      {selectedBook.dislikesCount || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Row 5: Ngày tạo (full width) */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Ngày tạo:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedBook.createdAt ? new Date(selectedBook.createdAt).toLocaleString('vi-VN') : 'N/A'}
                </Typography>
              </Grid>

              {/* Row 6: Hình ảnh (full width) */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Hình ảnh:
                </Typography>
                <Box sx={{ mt: 1, mb: 2 }}>
                  {selectedBook.imageUrl ? (
                    <img 
                      src={selectedBook.imageUrl} 
                      alt={selectedBook.title}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        objectFit: 'contain',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px solid #ddd',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                      onClick={() => handleImageClick(selectedBook.imageUrl)}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Không có hình ảnh
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Hủy
          </Button>
          <Button 
            onClick={handleDeleteBook} 
            variant="contained" 
            sx={{ backgroundColor: "#e74c3c" }}
          >
            Xóa bài đăng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog hiển thị ảnh full size */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={handleCloseImageDialog}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', textAlign: 'center' }}>
          <Typography variant="h5">
            {selectedBook?.title || 'Hình ảnh'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 2 }}>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Full size"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '80vh', 
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button 
            onClick={handleCloseImageDialog} 
            sx={{ color: 'white', borderColor: 'white' }}
            variant="outlined"
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Book;