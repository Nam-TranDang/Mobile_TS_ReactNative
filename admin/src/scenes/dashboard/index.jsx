import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import {
  Header,
  StatBox,
} from "../../components";
import {
  ReportProblemTwoTone,
  ImportContactsTwoTone,
  Diversity3TwoTone,
  PermIdentityTwoTone,
  VisibilityTwoTone,
} from "@mui/icons-material";
import { tokens } from "../../theme";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isXlDevices = useMediaQuery("(min-width: 1260px)");
  const isMdDevices = useMediaQuery("(min-width: 724px)");
  const isXsDevices = useMediaQuery("(max-width: 436px)");
  const navigate = useNavigate();
  
 // Thêm state cho statistics
  const [stats, setStats] = useState({
    totalReports: 0,
    totalBooks: 0,
    totalUsers: 0,
    totalVisitors: 0
  });



  // Gọi API để lấy số lượng user




// Fetch statistics
const fetchStatistics = async () => {
  try {
    const token = localStorage.getItem('admin-token');
    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Fetch total reports
    const reportsResponse = await fetch(`${API_URL}/api/reports`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Fetch total books với API count mới
    const booksCountResponse = await fetch(`${API_URL}/api/admin/books/count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Fetch total users với API count
    const usersCountResponse = await fetch(`${API_URL}/api/admin/users/count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (reportsResponse.ok) {
      const reportsData = await reportsResponse.json();
      
      let totalUsers = 0;
      if (usersCountResponse.ok) {
        const usersCountData = await usersCountResponse.json();
        console.log('Users count response:', usersCountData);
        totalUsers = usersCountData.success ? usersCountData.count : 0;
      } else {
        console.error('Failed to fetch users count:', usersCountResponse.statusText);
      }

      let totalBooks = 0;
      if (booksCountResponse.ok) {
        const booksCountData = await booksCountResponse.json();
        console.log('Books count response:', booksCountData);
        totalBooks = booksCountData.success ? booksCountData.count : 0;
      } else {
        console.error('Failed to fetch books count:', booksCountResponse.statusText);
      }

      setStats({
        totalReports: reportsData.reports?.length || reportsData.total || 0,
        totalBooks: totalBooks,
        totalUsers: totalUsers,
        totalVisitors: 1325134
      });

      console.log('Updated stats:', {
        totalReports: reportsData.reports?.length || reportsData.total || 0,
        totalBooks: totalBooks,
        totalUsers: totalUsers,
        totalVisitors: 1325134
      });
    }
  } catch (error) {
    console.error('Error fetching statistics:', error);
  }
};
  // State for reports
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [status, setStatus] = useState("");
  const [suspensionDays, setSuspensionDays] = useState("");

  // State for books
  const [recentBooks, setRecentBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);

  // Fetch recent reports (same as report page but limited)
  useEffect(() => {
    fetchStatistics();
    fetchRecentReports();
    fetchRecentBooks();
  }, []);

// Thêm function để format ngày giờ
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
};



  // Fetch recent books
   const fetchRecentBooks = async () => {
    try {
      setBooksLoading(true);
      const token = localStorage.getItem('admin-token');
      if (!token) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/books?limit=10&sort=createdAt&order=desc`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const booksArray = data.books || data;
        
        const formattedBooks = booksArray.map((book) => ({
          id: book._id,
          title: String(book.title || ''),
          username: book.user?.username || book.user?.name || 'Unknown',
          caption: String(book.caption || ''),
          rating: Number(book.rating || 0),
          likesCount: book.like_count || 
                     (Array.isArray(book.likedBy) ? book.likedBy.length : 0) ||
                     (Array.isArray(book.likes) ? book.likes.length : 0) || 0,
          dislikesCount: book.dislike_count || 
                        (Array.isArray(book.dislikedBy) ? book.dislikedBy.length : 0) ||
                        (Array.isArray(book.dislikes) ? book.dislikes.length : 0) || 0,
          createdAt: book.createdAt,
          imageUrl: book.imageUrl || book.image || book.thumbnail || null,
          genres: book.genres || book.category || null,
          userObject: book.user,
          ...book
        }));
        
        setRecentBooks(formattedBooks);
      }
    } catch (error) {
      console.error('Error fetching recent books:', error);
    } finally {
      setBooksLoading(false);
    }
  };
   const handleBookActionClick = (book) => {
    setSelectedBook(book);
    setBookDialogOpen(true);
  };

  const handleCloseBookDialog = () => {
    setBookDialogOpen(false);
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
        await fetchRecentBooks();
        handleCloseBookDialog();
      } else {
        const errorData = await response.json();
        alert('Không thể xóa sách: ' + (errorData.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Lỗi khi xóa sách: ' + error.message);
    }
  };

  const handleViewAllBooks = () => {
    navigate('/book');
  };

  
  /// rp
  const fetchRecentReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin-token');
      if (!token) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/reports?limit=10sort=createdAt&order=desc`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedReports = data.reports.map((report) => ({
          id: report._id,
          reporter: report.reporter?.username || report.reporter?.name || "Unknown",
          reportedItemType: String(report.reportedItemType || ''),
          reportedItemId: typeof report.reportedItemId === 'object' 
            ? (report.reportedItemId?.username || 
               report.reportedItemId?.name || 
               report.reportedItemId?.title || 
               'Unknown')
            : String(report.reportedItemId || ''),
          reason: String(report.reason || ''),
          status: String(report.status || ''),
          description: String(report.description || ''),
          adminNotes: String(report.adminNotes || ''),
          createdAt: report.createdAt,
          reporterObject: report.reporter
        }));
        setRecentReports(formattedReports);
      }
    } catch (error) {
      console.error('Error fetching recent reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (report) => {
    setSelectedReport(report);
    setStatus(report.status || "");
    setAdminNotes(report.adminNotes || "");
    setSuspensionDays("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedReport(null);
    setAdminNotes("");
    setStatus("");
    setSuspensionDays("");
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      if (!token) {
        alert('Không tìm thấy token xác thực');
        return;
      }

      const updateData = { status, adminNotes };

      if (selectedReport.reportedItemType === 'User' && status === 'resolved' && suspensionDays) {
        updateData.suspensionDurationDays = parseInt(suspensionDays);
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchRecentReports();
        handleCloseDialog();
      } else {
        const errorData = await response.json();
        alert('Failed to update report: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Error updating report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.redAccent[500];
      case 'resolved': return colors.greenAccent[500];
      case 'rejected': return colors.gray[500];
      default: return colors.gray[500];
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'resolved': return 'Đã xử lý';
      case 'rejected': return 'Từ chối';
      default: return 'Không xác định';
    }
  };

  const handleViewAllReports = () => {
    navigate('/report');
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between">
        <Header title="Trang tổng quan" subtitle="Trang tổng quan quản lý hệ thống" />
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns={
          isXlDevices
            ? "repeat(12, 1fr)"
            : isMdDevices
            ? "repeat(6, 1fr)"
            : "repeat(3, 1fr)"
        }
        gridAutoRows="140px"
        gap="20px"
      >
        {/* Statistics with real data */}
        <Box
          gridColumn="span 3"
          bgcolor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={stats.totalReports.toLocaleString()}
            subtitle="Báo cáo"
            progress="0.75"
            increase="+14%"
            icon={
              <ReportProblemTwoTone
                sx={{ color: colors.redAccent[600], fontSize: "50px" , marginBottom: "-23px"}}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={stats.totalBooks.toLocaleString()}
            subtitle="Số lượng bài viết"
            progress="0.50"
            increase="+21%"
            icon={
              <ImportContactsTwoTone
                sx={{ color: colors.greenAccent[600],  fontSize: "50px" , marginBottom: "-23px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
            <StatBox
            title={stats.totalUsers.toLocaleString()}
            subtitle="Số lượng người dùng"
            progress="0.30"
            increase="+5%"
            icon={
              <Diversity3TwoTone
                sx={{ color: colors.blueAccent[600],  fontSize: "50px" , marginBottom: "-23px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={stats.totalVisitors.toLocaleString()}
            subtitle="Người truy cập"
            progress="0.80"
            increase="+43%"
            icon={
              <PermIdentityTwoTone
                sx={{ color: "#76ff03",  fontSize: "50px" , marginBottom: "-23px" }}
              />
            }
          />
        </Box>

        {/* ---------------- Row 2 ---------------- */}

        {/* Reports Shortcut Section */}
        <Box
          gridColumn={isXlDevices ? "span 8" : "span 3"}
          gridRow="span 4"
          bgcolor={colors.primary[400]}
          display="flex"
          flexDirection="column"
        >
          <Box 
            borderBottom={`4px solid ${colors.primary[500]}`} 
            p="15px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography color={colors.gray[100]} variant="h5" fontWeight="600">
              Báo cáo gần đây
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleViewAllReports}
              sx={{
                color: colors.greenAccent[500],
                borderColor: colors.greenAccent[500],
                "&:hover": {
                  borderColor: colors.greenAccent[400],
                  backgroundColor: colors.greenAccent[900]
                }
              }}
            >
              Xem tất cả
            </Button>
          </Box>

          <Box 
            flex="1" 
            overflow="auto"
            sx={{
              '&::-webkit-scrollbar': {
                display: 'none', // Ẩn scrollbar
              },
              '&::-webkit-scrollbar-track': {
                background: colors.primary[500],
              },
              '&::-webkit-scrollbar-thumb': {
                background: colors.gray[500],
                borderRadius: '3px',
              },
            }}
          >
            {loading ? (
              <Box p="15px" textAlign="center">
                <Typography color={colors.gray[100]}>Đang tải...</Typography>
              </Box>
            ) : recentReports.length === 0 ? (
              <Box p="15px" textAlign="center">
                <Typography color={colors.gray[100]}>Không có báo cáo nào</Typography>
              </Box>
            ) : (
              recentReports.map((report, index) => (
                <Box
                  key={`${report.id}-${index}`}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  borderBottom={`2px solid ${colors.primary[500]}`}
                  p="12px"
                  sx={{
                    fontSize: "14px",
                    "&:hover": {
                      backgroundColor: colors.primary[500]
                    }
                  }}
                >
                  <Box flex="2">
                    <Typography
                      color={colors.greenAccent[500]}
                      variant="h6"
                      fontWeight="600"
                      sx={{ fontSize: "14px" }}
                    >
                      {report.reason}
                    </Typography>
                    <Typography color={colors.gray[100]} variant="body2" sx={{ fontSize: "12px" }}>
                      {report.reporter}
                    </Typography>
                  </Box>
                  
                  <Box flex="1" textAlign="center">
                    <Typography color={colors.redAccent[400]} variant="body2" sx={{ fontSize: "12px", fontWeight: "bold" }}>
                      {report.reportedItemId}
                    </Typography>
                  </Box>

                  <Box flex="1" textAlign="center">
                    <Chip
                      label={getStatusLabel(report.status)}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(report.status),
                        color: colors.gray[100],
                        fontSize: "14px",
                        minheight: "24px",
                        minWidth: "70px",
                      }}
                    />
                  </Box>

                  <Box flex="1" textAlign="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleActionClick(report)}
                      sx={{
                        backgroundColor: colors.blueAccent[500],
                        color: colors.gray[100],
                        fontSize: "14px",
                        minWidth: "60px",
                        height: "28px",
                        "&:hover": {
                          backgroundColor: colors.blueAccent[700]
                        }
                      }}
                    >
                      Hành động
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* ...existing code... Bài viết gần đây section remains the same */}
        
      <Box
          gridColumn={isXlDevices ? "span 4" : "span 3"}
          gridRow="span 4"
          bgcolor={colors.primary[400]}
          display="flex"
          flexDirection="column"
        >
          <Box 
            borderBottom={`4px solid ${colors.primary[500]}`} 
            p="15px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography color={colors.gray[100]} variant="h5" fontWeight="600">
              Bài viết gần đây
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleViewAllBooks}
              sx={{
                color: colors.greenAccent[500],
                borderColor: colors.greenAccent[500],
                "&:hover": {
                  borderColor: colors.greenAccent[400],
                  backgroundColor: colors.greenAccent[900]
                }
              }}
            >
              Xem tất cả
            </Button>
          </Box>

          <Box 
            flex="1" 
            overflow="auto"
            sx={{
              '&::-webkit-scrollbar': {
                display: 'none', // Ẩn scrollbar
              },
              '&::-webkit-scrollbar-track': {
                background: colors.primary[500],
              },
              '&::-webkit-scrollbar-thumb': {
                background: colors.gray[500],
                borderRadius: '3px',
              },
            }}
          >
            {booksLoading ? (
              <Box p="15px" textAlign="center">
                <Typography color={colors.gray[100]}>Đang tải...</Typography>
              </Box>
            ) : recentBooks.length === 0 ? (
              <Box p="15px" textAlign="center">
                <Typography color={colors.gray[100]}>Không có bài viết nào</Typography>
              </Box>
            ) : (
              recentBooks.map((book, index) => (
                <Box
                  key={`${book.id}-${index}`}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  borderBottom={`2px solid ${colors.primary[500]}`}
                  p="12px"
                  sx={{
                    "&:hover": {
                      backgroundColor: colors.primary[500]
                    }
                  }}
                >
                  <Box flex="3" display="flex" alignItems="center" gap="10px">
                    {book.imageUrl && (
                      <img 
                        src={book.imageUrl} 
                        alt={book.title}
                        style={{
                          width: '40px',
                          height: '40px',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    )}
                    <Box>
                      <Typography
                        color={colors.greenAccent[500]}
                        variant="h6"
                        fontWeight="600"
                        sx={{ fontSize: "14px" }}
                      >
                        {book.title.length > 25 ? `${book.title.substring(0, 25)}...` : book.title}
                      </Typography>
                      <Typography color={colors.gray[100]} variant="body2" sx={{ fontSize: "14px" }}>
                        {book.username}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box flex="1" textAlign="center">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: "14px", 
                        color: colors.gray[300],
                        lineHeight: 1.2,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {formatDateTime(book.createdAt)}
                    </Typography>
                  </Box>

                  <Box flex="1" textAlign="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleBookActionClick(book)}
                      sx={{
                        backgroundColor: colors.blueAccent[500],
                        color: colors.gray[100],
                        fontSize: "13px",
                        minWidth: "50px",
                        height: "26px",
                        "&:hover": {
                          backgroundColor: colors.blueAccent[700]
                        }
                      }}
                    >
                      Chi tiết
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      {/* Report Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h4" fontWeight="bold">
            Xử lý Báo cáo
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Người báo cáo:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedReport.reporterObject?.username || selectedReport.reporterObject?.name || 'Unknown'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Loại báo cáo:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedReport.reportedItemType}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Đối tượng bị báo cáo:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedReport.reportedItemId}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Lý do:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedReport.reason}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Mô tả chi tiết:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedReport.description || 'Không có mô tả'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Ngày báo cáo:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString('vi-VN') : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={status}
                    label="Trạng thái"
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <MenuItem value="pending">Chờ xử lý</MenuItem>
                    <MenuItem value="resolved">Đã xử lý</MenuItem>
                    <MenuItem value="rejected">Từ chối</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {selectedReport.reportedItemType === 'User' && status === 'resolved' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Số ngày tạm khóa"
                    type="number"
                    value={suspensionDays}
                    onChange={(e) => setSuspensionDays(e.target.value)}
                    placeholder="Nhập số ngày (tùy chọn)"
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Ghi chú của admin"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Nhập ghi chú..."
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Hủy
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Book Detail Dialog */}
      <Dialog 
        open={bookDialogOpen} 
        onClose={handleCloseBookDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h4" fontWeight="bold">
            Chi tiết Bài viết
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedBook && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Người đăng:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedBook.userObject?.username || selectedBook.userObject?.name || 'Unknown'}
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

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Tiêu đề:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedBook.title}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Mô tả:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedBook.caption || 'Không có mô tả'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Đánh giá:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  ⭐ {selectedBook.rating.toFixed(1)} / 5.0
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
                      {selectedBook.likesCount}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ color: '#f44336', fontSize: '20px' }}>👎</span>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      {selectedBook.dislikesCount}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Ngày tạo:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedBook.createdAt ? new Date(selectedBook.createdAt).toLocaleString('vi-VN') : 'N/A'}
                </Typography>
              </Grid>

              {selectedBook.imageUrl && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Hình ảnh:
                  </Typography>
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <img 
                      src={selectedBook.imageUrl} 
                      alt={selectedBook.title}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBookDialog} color="secondary">
            Hủy
          </Button>
          <Button 
            onClick={handleDeleteBook} 
            variant="contained" 
            sx={{ backgroundColor: "#e74c3c" }}
          >
            Xóa bài viết
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;