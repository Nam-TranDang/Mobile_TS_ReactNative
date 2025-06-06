import { Box, useTheme, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Typography, Grid } from "@mui/material";
import { Header } from "../../components";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { useState, useEffect } from "react";

const Report = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [status, setStatus] = useState("");
  const [suspensionDays, setSuspensionDays] = useState("");
  const [error, setError] = useState(null);
  // Fetch reports from API
  useEffect(() => {
    fetchReports();
  }, []);

const fetchReports = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('admin-token');
    
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_URL}/api/reports`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Debug chi tiết để xem tất cả các field
    console.log('Full report data:', data.reports[0]);
    console.log('All fields:');
    if (data.reports[0]) {
      Object.keys(data.reports[0]).forEach(key => {
        console.log(`${key}:`, typeof data.reports[0][key], data.reports[0][key]);
      });
    }
    
    const formattedReports = data.reports.map((report, index) => ({
      id: report._id,
      stt: index + 1,
      // Đảm bảo tất cả field đều là string hoặc primitive values
      reporter: report.reporter?.username || report.reporter?.name || "Unknown",
      reportedItemType: String(report.reportedItemType || ''),
      reason: String(report.reason || ''),
      status: String(report.status || ''),
            // Xử lý reportedItemId để lấy tên thay vì ID
      reportedItemId: typeof report.reportedItemId === 'object' 
        ? (report.reportedItemId?.username || 
           report.reportedItemId?.name || 
           report.reportedItemId?.title || 
           report.reportedItemId?._id || 
           'Unknown')
        : String(report.reportedItemId || ''),
      description: String(report.description || ''),
      adminNotes: String(report.adminNotes || ''),
      createdAt: report.createdAt,
      // Lưu object riêng cho dialog
      reporterObject: report.reporter
    }));
    
    console.log('Formatted reports:', formattedReports[0]);
    setReports(formattedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

const handleActionClick = (row) => {
  setSelectedReport(row);
  setStatus(row.status || "");
  setAdminNotes(row.adminNotes || "");
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'resolved': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const columns = [
  { field: "stt", headerName: "STT", flex: 0.5 },
  { 
    field: "reporter", 
    headerName: "Người báo cáo", 
    flex: 1,
    renderCell: ({ row }) => (
      <span>
        {typeof row.reporter === 'string' ? row.reporter : 'Unknown'}
      </span>
    )
  },
  { 
    field: "reportedItemType", 
    headerName: "Loại báo cáo", 
    flex: 1,
    renderCell: ({ value }) => (
      <span>{String(value || '')}</span>
    )
  },
  { 
    field: "reason", 
    headerName: "Lý do", 
    flex: 1.5,
    renderCell: ({ value }) => (
      <span>{String(value || '')}</span>
    )
  },
  {
    field: "status",
    headerName: "Trạng thái",
    flex: 1,
    renderCell: ({ value }) => (
      <Box
        sx={{
          backgroundColor: getStatusColor(value),
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        {value === 'pending' ? 'Chờ xử lý' :
         value === 'resolved' ? 'Đã xử lý' :
         value === 'rejected' ? 'Từ chối' : String(value || '')}
      </Box>
    )
  },
  // Thêm cột ngày tạo để user có thể thấy và sort
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
const handleSave = async () => {
  try {
    const token = localStorage.getItem('admin-token');
    if (!token) {
      alert('Không tìm thấy token xác thực');
      return;
    }

    const updateData = {
      status,
      adminNotes
    };

    // Add suspension days if handling User report and status is resolved
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
      await fetchReports(); // Refresh the reports list
      setDialogOpen(false);
      setSelectedReport(null);
      setAdminNotes("");
      setStatus("");
      setSuspensionDays("");
    } else {
      const errorData = await response.json();
      console.error('Failed to update report:', errorData.message);
      alert('Failed to update report: ' + errorData.message);
    }
  } catch (error) {
    console.error('Error updating report:', error);
    alert('Error updating report');
  }
};
  return (
    <Box m="20px">
      <Header
        title="Quản lý Báo cáo"
        subtitle="Danh sách báo cáo của người dùng"
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
  rows={reports}
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
          sort: 'desc', // desc = mới nhất trước, asc = cũ nhất trước
        },
      ],
    },
  }}
/>
      </Box>

      {/* Report Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h4" fontWeight="bold">
            Chi tiết Báo cáo
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
    {selectedReport.reporterObject?.username || 
     selectedReport.reporterObject?.name || 
     'Unknown'}
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
          ID mục bị báo cáo:
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {selectedReport.reportedItemId}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold">
          Lý do báo cáo:
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
          Ngày tạo:
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
            label="Số ngày tạm khóa (tùy chọn)"
            type="number"
            value={suspensionDays}
            onChange={(e) => setSuspensionDays(e.target.value)}
            helperText="Để trống nếu chỉ cảnh cáo"
          />
        </Grid>
      )}

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Ghi chú của Admin"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Nhập ghi chú của admin..."
        />
      </Grid>
    </Grid>
  )}
</DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Hủy
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            sx={{ backgroundColor: "#4caf50" }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Report;