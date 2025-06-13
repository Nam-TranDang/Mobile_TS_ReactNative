import { useState, useEffect } from "react"
import {
  Box,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
} from "@mui/material"
import { Header } from "../../components"
import { DataGrid, GridToolbar } from "@mui/x-data-grid"
import { tokens } from "../../theme"
import useAdminSocket from "../../hooks/useAdminSocket" // Import custom hook for socket connection
import { useLocation, useSearchParams } from "react-router-dom" // navigate từ rp


const Book = () => {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)
  const isDark = theme.palette.mode === "dark"

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState(null)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [searchParams] = useSearchParams() // Thêm này để đọc URL params
  const [highlightedBookId, setHighlightedBookId] = useState(null) // Thêm state để highlight book



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

  const handleNewBook = (data) => {
    console.log("New book received:", data)

    const newBook = {
      id: data.book._id,
      stt: books.length + 1,
      shortId: data.book._id.slice(-4),
      title: data.book.title,
      username: data.user.username || data.user.name || "Unknown",
      rating: data.book.rating,
      status: data.book.process || "pending",
      createdAt: data.book.createdAt,
    }

    setBooks((prev) => [newBook, ...prev])

    setSuccessMessage(`Bài viết mới: ${data.book.title}`)
    setTimeout(() => {
      setSuccessMessage("")
    }, 5000)
  }

  // Initialize socket
  useAdminSocket(handleNewBook)

  // Fetch books from API
  useEffect(() => {
    fetchBooks()
  }, [])

   // Thêm useEffect để xử lý khi có viewBook param từ URL
useEffect(() => {
    const viewBookId = searchParams.get('viewBook');
    console.log("Book page - Received viewBook parameter:", viewBookId); // Debug log
    
    if (viewBookId && books.length > 0) {
      console.log("Book page - Looking for book with ID:", viewBookId);
      console.log("Book page - Available books:", books.map(b => ({ 
        id: b.id, 
        _id: b._id, 
        shortId: b.shortId 
      })));
      
      // Tìm book tương ứng với nhiều cách khác nhau
      const bookToView = books.find(book => 
        book.id === viewBookId || 
        book._id === viewBookId ||
        book.shortId === viewBookId ||
        String(book.id) === String(viewBookId) ||
        String(book._id) === String(viewBookId)
      );
      
      console.log("Book page - Found book:", bookToView);
      
      if (bookToView) {
        console.log("Book page - Opening dialog for book:", bookToView.title || bookToView.id);
        // Tự động mở dialog chi tiết
        setSelectedBook(bookToView);
        setDialogOpen(true);
        
        // Clear URL parameter sau khi mở dialog
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else {
        console.log("Book page - Book not found with ID:", viewBookId);
        // Có thể hiển thị thông báo lỗi
        setError(`Không tìm thấy sách với ID: ${viewBookId}`);
        setTimeout(() => setError(null), 5000);
      }
    }
  }, [searchParams, books]);

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("admin-token")

      if (!token) {
        throw new Error("Không tìm thấy token xác thực")
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/books?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Xử lý dữ liệu trả về (có thể là data.books hoặc data trực tiếp)
      const booksArray = data.books || data

      const formattedBooks = booksArray.map((book, index) => {
        return {
          id: book._id,
          stt: index + 1,
          username: book.user?.username || book.user?.name || "Unknown",
          shortId: book._id ? `...${book._id.slice(-4)}` : "N/A",
          title: String(book.title || ""),
          caption: String(book.caption || ""),
          rating: Number(book.rating || 0),
          createdAt: book.createdAt,
          imageUrl: book.imageUrl || book.image || book.thumbnail || null,
          genres: book.genres || book.category || null,

          // Thử nhiều cách map like/dislike data
          likes: book.likedBy || book.likes || [],
          dislikes: book.dislikedBy || book.dislikes || [],
          likesCount:
            book.like_count ||
            (Array.isArray(book.likedBy) ? book.likedBy.length : 0) ||
            (Array.isArray(book.likes) ? book.likes.length : 0) ||
            book.likesCount ||
            0,
          dislikesCount:
            book.dislike_count ||
            (Array.isArray(book.dislikedBy) ? book.dislikedBy.length : 0) ||
            (Array.isArray(book.dislikes) ? book.dislikes.length : 0) ||
            book.dislikesCount ||
            0,

          userObject: book.user,
          ...book,
        }
      })

      setBooks(formattedBooks)
    } catch (error) {
      console.error("Error fetching books:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

 const handleActionClick = (row) => {
    setSelectedBook(row)
    setDialogOpen(true)
    // Clear highlight nếu có
    if (highlightedBookId) {
      setHighlightedBookId(null)
    }
  }

 const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedBook(null)
    setHighlightedBookId(null) // Clear highlight khi đóng dialog
  }

  const handleDeleteBook = async () => {
    if (!selectedBook) return

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa sách "${selectedBook.title}"?`)
    if (!confirmDelete) return

    try {
      const token = localStorage.getItem("admin-token")
      if (!token) {
        alert("Không tìm thấy token xác thực")
        return
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/books/${selectedBook.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        alert("Xóa sách thành công!")
        await fetchBooks() // Refresh the books list
        setDialogOpen(false)
        setSelectedBook(null)
      } else {
        const errorData = await response.json()
        console.error("Failed to delete book:", errorData.message)
        alert("Không thể xóa sách: " + (errorData.message || "Lỗi không xác định"))
      }
    } catch (error) {
      console.error("Error deleting book:", error)
      alert("Lỗi khi xóa sách: " + error.message)
    }
  }

  // Functions cho xử lý ảnh
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl)
    setImageDialogOpen(true)
  }

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false)
    setSelectedImage("")
  }

  const columns = [
    { field: "stt", headerName: "STT", flex: 0.5 },
    {
      field: "username",
      headerName: "Người đăng",
      flex: 1,
      renderCell: ({ row }) => <span>{row.username || "Unknown"}</span>,
    },
    {
      field: "shortId",
      headerName: "ID",
      flex: 0.8,
      renderCell: ({ row }) => <span title={row.id}>{row.shortId}</span>,
    },
    {
      field: "title",
      headerName: "Tiêu đề",
      flex: 2,
      renderCell: ({ value }) => (
        <span title={value}>
          {String(value || "").substring(0, 50)}
          {String(value || "").length > 50 ? "..." : ""}
        </span>
      ),
    },
    {
      field: "caption",
      headerName: "Mô tả",
      flex: 2,
      renderCell: ({ value }) => (
        <span title={value}>
          {String(value || "").substring(0, 40)}
          {String(value || "").length > 40 ? "..." : ""}
        </span>
      ),
    },
    {
      field: "rating",
      headerName: "Đánh giá",
      flex: 0.8,
      renderCell: ({ value }) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: colors.primary[500],
            padding: "6px 12px",
            borderRadius: "12px",
            boxShadow: getNeumorphicInsetShadow(),
          }}
        >
          <span style={{ color: "#fbbf24" }}>⭐ {Number(value || 0).toFixed(1)}</span>
        </Box>
      ),
    },
    // Cột Like riêng
    {
      field: "likesCount",
      headerName: "Like",
      flex: 0.7,
      renderCell: ({ row }) => {
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              justifyContent: "center",
              backgroundColor: colors.primary[500],
              padding: "6px 12px",
              borderRadius: "12px",
              boxShadow: getNeumorphicInsetShadow(),
            }}
          >
            <span style={{ color: colors.greenAccent[400], fontSize: "16px" }}>👍</span>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: colors.greenAccent[400] }}>
              {row.likesCount || 0}
            </span>
          </Box>
        )
      },
    },
    // Cột Dislike riêng
    {
      field: "dislikesCount",
      headerName: "Dislike",
      flex: 0.7,
      renderCell: ({ row }) => {
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              justifyContent: "center",
              backgroundColor: colors.primary[500],
              padding: "6px 12px",
              borderRadius: "12px",
              boxShadow: getNeumorphicInsetShadow(),
            }}
          >
            <span style={{ color: colors.redAccent[400], fontSize: "16px" }}>👎</span>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: colors.redAccent[400] }}>
              {row.dislikesCount || 0}
            </span>
          </Box>
        )
      },
    },
    {
      field: "createdAt",
      headerName: "Ngày tạo",
      flex: 1,
      renderCell: ({ value }) => <span>{value ? new Date(value).toLocaleDateString("vi-VN") : "N/A"}</span>,
    },
    {
      field: "action",
      headerName: "Hành động",
      flex: 1,
      renderCell: ({ row }) => (
        <Button
          className="neumorphic-btn"
          sx={{
            backgroundColor: colors.primary[500],
            color: colors.greenAccent[400],
            padding: "8px 16px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            boxShadow: getNeumorphicShadow(),
            transition: "all 0.2s ease",
            fontSize: "13px",
            fontWeight: "bold",
            "&:hover": {
              transform: "translateY(-3px)",
            },
            "&:active": {
              boxShadow: getNeumorphicPressedShadow(),
              transform: "translateY(1px)",
            },
          }}
          onClick={() => handleActionClick(row)}
        >
          Chi tiết
        </Button>
      ),
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

      <Header title="Quản lý Sách" subtitle="Danh sách sách được đăng bởi người dùng" />

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
        maxWidth="100%"
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
                  field: "createdAt",
                  sort: "desc",
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
          <Typography variant="h4" fontWeight="bold">
            Chi tiết Sách
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[500], pt: 3, padding: "25px" }}>
          {selectedBook && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Row 1: ID và Người đăng */}
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    color: colors.gray[300],
                    fontSize: "14px",
                    mb: 1,
                  }}
                >
                  ID:
                </Typography>
                <Box
                  sx={{
                    backgroundColor: colors.primary[500],
                    padding: "15px",
                    borderRadius: "12px",
                    boxShadow: getNeumorphicInsetShadow(),
                    color: colors.gray[100],
                    fontSize: "15px",
                    mb: 2,
                  }}
                >
                  {selectedBook.id}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    color: colors.gray[300],
                    fontSize: "14px",
                    mb: 1,
                  }}
                >
                  Người đăng:
                </Typography>
                <Box
                  sx={{
                    backgroundColor: colors.primary[500],
                    padding: "15px",
                    borderRadius: "12px",
                    boxShadow: getNeumorphicInsetShadow(),
                    color: colors.gray[100],
                    fontSize: "15px",
                    mb: 2,
                  }}
                >
                  {selectedBook.userObject?.username || selectedBook.userObject?.name || "Unknown"}
                </Box>
              </Grid>

              {/* Row 2: Tiêu đề và Danh mục */}
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    color: colors.gray[300],
                    fontSize: "14px",
                    mb: 1,
                  }}
                >
                  Tiêu đề:
                </Typography>
                <Box
                  sx={{
                    backgroundColor: colors.primary[500],
                    padding: "15px",
                    borderRadius: "12px",
                    boxShadow: getNeumorphicInsetShadow(),
                    color: colors.greenAccent[400],
                    fontSize: "15px",
                    fontWeight: "bold",
                    mb: 2,
                  }}
                >
                  {selectedBook.title}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    color: colors.gray[300],
                    fontSize: "14px",
                    mb: 1,
                  }}
                >
                  Danh mục:
                </Typography>
                <Box
                  sx={{
                    backgroundColor: colors.primary[500],
                    padding: "15px",
                    borderRadius: "12px",
                    boxShadow: getNeumorphicInsetShadow(),
                    color: colors.gray[100],
                    fontSize: "15px",
                    mb: 2,
                  }}
                >
                  {selectedBook.genres
                    ? Array.isArray(selectedBook.genres)
                      ? selectedBook.genres.join(", ")
                      : selectedBook.genres
                    : "Chưa phân loại"}
                </Box>
              </Grid>

              {/* Row 3: Mô tả (full width) */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    color: colors.gray[300],
                    fontSize: "14px",
                    mb: 1,
                  }}
                >
                  Mô tả:
                </Typography>
                <Box
                  sx={{
                    backgroundColor: colors.primary[500],
                    padding: "15px",
                    borderRadius: "12px",
                    boxShadow: getNeumorphicInsetShadow(),
                    color: colors.gray[100],
                    fontSize: "15px",
                    mb: 2,
                  }}
                >
                  {selectedBook.caption || "Không có mô tả"}
                </Box>
              </Grid>

              {/* Row 4: Đánh giá và Like/Dislike */}
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    color: colors.gray[300],
                    fontSize: "14px",
                    mb: 1,
                  }}
                >
                  Đánh giá:
                </Typography>
                <Box
                  sx={{
                    backgroundColor: colors.primary[500],
                    padding: "15px",
                    borderRadius: "12px",
                    boxShadow: getNeumorphicInsetShadow(),
                    color: "#fbbf24",
                    fontSize: "15px",
                    fontWeight: "bold",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  ⭐ {Number(selectedBook.rating || 0).toFixed(1)} / 5.0
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    color: colors.gray[300],
                    fontSize: "14px",
                    mb: 1,
                  }}
                >
                  Like/Dislike:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: colors.primary[500],
                      padding: "15px",
                      borderRadius: "12px",
                      boxShadow: getNeumorphicInsetShadow(),
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flex: 1,
                    }}
                  >
                    <span style={{ color: colors.greenAccent[400], fontSize: "20px" }}>👍</span>
                    <Typography variant="body1" sx={{ fontWeight: "bold", color: colors.greenAccent[400] }}>
                      {selectedBook.likesCount || 0}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: colors.primary[500],
                      padding: "15px",
                      borderRadius: "12px",
                      boxShadow: getNeumorphicInsetShadow(),
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flex: 1,
                    }}
                  >
                    <span style={{ color: colors.redAccent[400], fontSize: "20px" }}>👎</span>
                    <Typography variant="body1" sx={{ fontWeight: "bold", color: colors.redAccent[400] }}>
                      {selectedBook.dislikesCount || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Row 5: Ngày tạo (full width) */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    color: colors.gray[300],
                    fontSize: "14px",
                    mb: 1,
                  }}
                >
                  Ngày tạo:
                </Typography>
                <Box
                  sx={{
                    backgroundColor: colors.primary[500],
                    padding: "15px",
                    borderRadius: "12px",
                    boxShadow: getNeumorphicInsetShadow(),
                    color: colors.gray[100],
                    fontSize: "15px",
                    mb: 2,
                  }}
                >
                  {selectedBook.createdAt ? new Date(selectedBook.createdAt).toLocaleString("vi-VN") : "N/A"}
                </Box>
              </Grid>

              {/* Row 6: Hình ảnh (full width) */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    color: colors.gray[300],
                    fontSize: "14px",
                    mb: 1,
                  }}
                >
                  Hình ảnh:
                </Typography>
                <Box sx={{ mt: 1, mb: 2 }}>
                  {selectedBook.imageUrl ? (
                    <Box
                      sx={{
                        backgroundColor: colors.primary[500],
                        padding: "15px",
                        borderRadius: "12px",
                        boxShadow: getNeumorphicShadow(),
                        textAlign: "center",
                      }}
                    >
                      <img
                        src={selectedBook.imageUrl || "/placeholder.svg"}
                        alt={selectedBook.title}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "300px",
                          objectFit: "contain",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleImageClick(selectedBook.imageUrl)}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        backgroundColor: colors.primary[500],
                        padding: "15px",
                        borderRadius: "12px",
                        boxShadow: getNeumorphicInsetShadow(),
                        color: colors.gray[300],
                        fontSize: "15px",
                        textAlign: "center",
                      }}
                    >
                      Không có hình ảnh
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.primary[400], p: 3 }}>
          <Button
            onClick={handleCloseDialog}
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
            onClick={handleDeleteBook}
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
        PaperProps={{
          style: {
            backgroundColor: colors.primary[800],
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: colors.primary[700],
            color: colors.gray[100],
            textAlign: "center",
            padding: "20px",
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            {selectedBook?.title || "Hình ảnh"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", p: 4, bgcolor: colors.primary[800] }}>
          {selectedImage && (
            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Full size"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: getNeumorphicShadow(),
              }}
            />
          )}
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            bgcolor: colors.primary[700],
            p: 3,
          }}
        >
          <Button
            onClick={handleCloseImageDialog}
            className="neumorphic-btn"
            sx={{
              backgroundColor: colors.primary[500],
              color: colors.gray[100],
              padding: "10px 20px",
              borderRadius: "12px",
              boxShadow: getNeumorphicShadow(),
              fontSize: "14px",
              fontWeight: "bold",
              "&:hover": { backgroundColor: colors.primary[500] },
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Book
