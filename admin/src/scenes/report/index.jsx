import { useState, useEffect } from "react"
import {
  Box,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Grid,
} from "@mui/material"
import { Header } from "../../components"
import { DataGrid, GridToolbar } from "@mui/x-data-grid"
import { tokens } from "../../theme"
import useAdminSocket from "../../hooks/useAdminSocket" // Import custom hook for socket
import { useNavigate } from "react-router-dom"

const Report = () => {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)
  const isDark = theme.palette.mode === "dark"

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [status, setStatus] = useState("")
  const [suspensionDays, setSuspensionDays] = useState("")
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")

  const navigate = useNavigate()

const handleViewBookDetail = () => {
  console.log("=== EXTRACTING BOOK ID ===");
  console.log("selectedReport:", selectedReport);
  console.log("reportedItemObject:", selectedReport.reportedItemObject);
  
  let bookId;
  
  // Sử dụng reportedItemObject thay vì reportedItemId
  const reportedItem = selectedReport.reportedItemObject;
  
  if (typeof reportedItem === "object" && reportedItem !== null) {
    // Lấy ID từ object gốc
    bookId = reportedItem._id || reportedItem.id;
    console.log("Object case - extracted ID:", bookId);
  } else if (typeof reportedItem === "string") {
    // Kiểm tra xem có phải là ObjectId không
    if (reportedItem.length === 24 && /^[a-f\d]{24}$/i.test(reportedItem)) {
      bookId = reportedItem;
    } else {
      console.warn("Received book title instead of ID:", reportedItem);
      alert("Lỗi: Không thể xác định ID của sách. Dữ liệu báo cáo có thể bị lỗi.");
      return;
    }
  } else {
    bookId = String(reportedItem);
  }
  
  console.log("Final book ID to navigate:", bookId);
  
  if (bookId && bookId !== "undefined" && bookId !== "null") {
    navigate(`/book?viewBook=${bookId}`);
  } else {
    alert("Không thể xác định ID của sách");
  }
};

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


  // Socket event handler cho report mới
  const handleNewReport = (data) => {
    console.log("New report received:", data)

    // Format report data để phù hợp với UI
    const newReport = {
      id: data.report._id,
      stt: reports.length + 1,
      shortId: data.report._id.slice(-4),
      reason: data.report.reason,
      reporter: data.reporter.username || data.reporter.name || "Unknown",
      reportedItemType: data.report.reportedItemType,
      reportedItemId: data.report.reportedItemId,
      status: data.report.status || "pending",
      createdAt: data.report.createdAt,
    }

    setReports((prev) => [newReport, ...prev])

    // Hiển thị thông báo
    setSuccessMessage(`Báo cáo mới: ${data.report.reason}`)
    setTimeout(() => {
      setSuccessMessage("")
    }, 5000)
  }

  // Initialize socket connection
  useAdminSocket(handleNewReport)

  // Fetch reports from API
  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("admin-token")

      if (!token) {
        throw new Error("Không tìm thấy token xác thực")
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      const formattedReports = data.reports.map((report, index) => ({
        id: report._id,
        stt: index + 1,
        // Đảm bảo tất cả field đều là string hoặc primitive values
        reporter: report.reporter?.username || report.reporter?.name || "Unknown",
        reportedItemType: String(report.reportedItemType || ""),
        reason: String(report.reason || ""),
        status: String(report.status || ""),
        // Xử lý reportedItemId để lấy tên thay vì ID
       // THAY ĐỔI: Hiển thị tên nhưng lưu cả object gốc
  reportedItemId:
    typeof report.reportedItemId === "object"
      ? report.reportedItemId?.username ||
        report.reportedItemId?.name ||
        report.reportedItemId?.title ||
        report.reportedItemId?._id ||
        "Unknown"
      : String(report.reportedItemId || ""),
  
  description: String(report.description || ""),
  adminNotes: String(report.adminNotes || ""),
  createdAt: report.createdAt,
  
  // Lưu object riêng cho dialog
  reporterObject: report.reporter,
  reportedItemObject: report.reportedItemId, // <-- THÊM DÒNG NÀY để lưu object gốc
      }))

      setReports(formattedReports)
    } catch (error) {
      console.error("Error fetching reports:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (row) => {
    setSelectedReport(row)
    setStatus(row.status || "")
    setAdminNotes(row.adminNotes || "")
    setSuspensionDays("")
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedReport(null)
    setAdminNotes("")
    setStatus("")
    setSuspensionDays("")
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return colors.redAccent[400]
      case "resolved":
        return colors.greenAccent[400]
      case "rejected":
        return colors.gray[400]
      default:
        return colors.gray[400]
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý"
      case "resolved":
        return "Đã xử lý"
      case "rejected":
        return "Từ chối"
      default:
        return String(status || "")
    }
  }

  const columns = [
    { field: "stt", headerName: "STT", flex: 0.5 },
    {
      field: "reporter",
      headerName: "Người báo cáo",
      flex: 1,
      renderCell: ({ row }) => <span>{typeof row.reporter === "string" ? row.reporter : "Unknown"}</span>,
    },
    {
      field: "reportedItemType",
      headerName: "Loại báo cáo",
      flex: 1,
      renderCell: ({ value }) => <span>{String(value || "")}</span>,
    },
    {
      field: "reason",
      headerName: "Lý do",
      flex: 1.5,
      renderCell: ({ value }) => (
        <span title={value}>
          {String(value || "").substring(0, 30)}
          {String(value || "").length > 30 ? "..." : ""}
        </span>
      ),
    },
    {
      field: "status",
      headerName: "Trạng thái",
      flex: 1,
      renderCell: ({ value }) => (
        <Box
          sx={{
            backgroundColor: colors.primary[500],
            color: getStatusColor(value),
            padding: "6px 16px",
            borderRadius: "12px",
            textAlign: "center",
            fontSize: "13px",
            fontWeight: "bold",
            minWidth: "80px",
            boxShadow: getNeumorphicInsetShadow(),
          }}
        >
          {getStatusLabel(value)}
        </Box>
      ),
    },
    // Thêm cột ngày tạo để user có thể thấy và sort
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

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("admin-token")
      if (!token) {
        alert("Không tìm thấy token xác thực")
        return
      }

      const updateData = {
        status,
        adminNotes,
      }

      // Add suspension days if handling User report and status is resolved
      if (selectedReport.reportedItemType === "User" && status === "resolved" && suspensionDays) {
        updateData.suspensionDurationDays = Number.parseInt(suspensionDays)
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/reports/${selectedReport.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        await fetchReports() // Refresh the reports list
        setDialogOpen(false)
        setSelectedReport(null)
        setAdminNotes("")
        setStatus("")
        setSuspensionDays("")
        setSuccessMessage("Cập nhật báo cáo thành công!")
        setTimeout(() => {
          setSuccessMessage("")
        }, 3000)
      } else {
        const errorData = await response.json()
        console.error("Failed to update report:", errorData.message)
        alert("Failed to update report: " + errorData.message)
      }
    } catch (error) {
      console.error("Error updating report:", error)
      alert("Error updating report")
    }
  }

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

      <Header title="Quản lý Báo cáo" subtitle="Danh sách báo cáo của người dùng" />

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
                  field: "createdAt",
                  sort: "desc", // desc = mới nhất trước, asc = cũ nhất trước
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
            Chi tiết Báo cáo
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[500], pt: 3, padding: "25px" }}>
          {selectedReport && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
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
                  Người báo cáo:
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
                  {selectedReport.reporterObject?.username || selectedReport.reporterObject?.name || "Unknown"}
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
                  Loại báo cáo:
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
                  {selectedReport.reportedItemType}
                </Box>
              </Grid>

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
                    {selectedReport.reportedItemType === "Comment" 
                    ? "Comment bị báo cáo:" 
                    : selectedReport.reportedItemType === "Book" 
                    ? "Sách bị báo cáo:" 
                    : selectedReport.reportedItemType === "User"
                    ? "Người dùng bị báo cáo:"
                    : "Mục bị báo cáo:"}
                </Typography>

                {/* Hiển thị cho Comment */}
               {selectedReport.reportedItemType === "Comment" && (
                <Box
                  sx={{
                    backgroundColor: colors.primary[500],
                    padding: "15px",
                    borderRadius: "12px",
                    boxShadow: getNeumorphicInsetShadow(),
                    color: colors.gray[100],
                    fontSize: "15px",
                    mb: 2,
                    border: `1px solid ${colors.redAccent[400]}`,
                  }}
                >
                  {typeof selectedReport.reportedItemObject === "object" && selectedReport.reportedItemObject?.text ? (
                    <div>
                      <Typography sx={{ fontWeight: "bold", mb: 0.5 }}>
                        📝 Nội dung: "{selectedReport.reportedItemObject.text}"
                      </Typography>
                      <Typography>
                        👤 Người viết: {selectedReport.reportedItemObject.user?.username || "Unknown"}
                      </Typography>
                      <Typography>
                        📚 Sách: {selectedReport.reportedItemObject.book?.title || "Không xác định"}
                      </Typography>
                    </div>
                  ) : (
                    <Typography sx={{ color: colors.gray[400], fontStyle: "italic" }}>
                      Comment ID: {selectedReport.reportedItemId}
                      <br />
                      <small>(Nội dung comment có thể đã bị xóa hoặc không tải được)</small>
                    </Typography>
                  )}
                </Box>
              )}
                {/* Hiển thị cho Book */}
                {selectedReport.reportedItemType === "Book" && (
                  <Box
                    sx={{
                      backgroundColor: colors.primary[500],
                      padding: "15px",
                      borderRadius: "12px",
                      boxShadow: getNeumorphicInsetShadow(),
                      color: colors.gray[100],
                      fontSize: "15px",
                      mb: 2,
                      border: `1px solid ${colors.redAccent[400]}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {typeof selectedReport.reportedItemId === "object" && selectedReport.reportedItemId?.title ? (
                        <div>
                          <Typography variant="body1" sx={{ fontWeight: "bold", mb: 0.5 }}>
                            📚 {selectedReport.reportedItemId.title}
                          </Typography>
                          {selectedReport.reportedItemId.user && (
                            <Typography variant="body2" sx={{ color: colors.gray[400], mb: 0.5 }}>
                              👤 Tác giả: {selectedReport.reportedItemId.user.username || selectedReport.reportedItemId.user.name}
                            </Typography>
                          )}
                          {selectedReport.reportedItemId.caption && (
                            <Typography variant="caption" sx={{ color: colors.gray[300] }}>
                              📝 {selectedReport.reportedItemId.caption.substring(0, 100)}
                              {selectedReport.reportedItemId.caption.length > 100 ? "..." : ""}
                            </Typography>
                          )}
                        </div>
                      ) : (
                        <div>
                          <Typography>📚 Book ID: {selectedReport.reportedItemId}</Typography>
                          <Typography variant="caption" sx={{ color: colors.gray[400] }}>
                            Click "Xem chi tiết" để tải thông tin sách
                          </Typography>
                        </div>
                      )}
                    </div>
    <Button
    onClick={() => {
      const bookId = typeof selectedReport.reportedItemId === "object" 
        ? selectedReport.reportedItemId._id || selectedReport.reportedItemId.id
        : selectedReport.reportedItemId;
      handleViewBookDetail(bookId);
    }}
    sx={{
      backgroundColor: colors.primary[500],
      color: colors.blueAccent[400],
      padding: "10px 20px",
      borderRadius: "8px",
      boxShadow: getNeumorphicShadow(),
      fontSize: "12px",
      fontWeight: "bold",
      minWidth: "120px",
      whiteSpace: "nowrap",
      "&:hover": {
        transform: "translateY(-2px)",
        backgroundColor: colors.primary[500],
        boxShadow: `${getNeumorphicShadow()}, 0 0 15px ${colors.blueAccent[400]}40`,
      },
    }}
  >
    🔍 Xem chi tiết
  </Button>
                  </Box>
                )}

                {/* Hiển thị cho User */}
                {selectedReport.reportedItemType === "User" && (
                  <Box
                    sx={{
                      backgroundColor: colors.primary[500],
                      padding: "15px",
                      borderRadius: "12px",
                      boxShadow: getNeumorphicInsetShadow(),
                      color: colors.gray[100],
                      fontSize: "15px",
                      mb: 2,
                      border: `1px solid ${colors.redAccent[400]}`,
                    }}
                  >
                    {typeof selectedReport.reportedItemId === "object" && selectedReport.reportedItemId?.username ? (
                      <div>
                        <Typography variant="body1" sx={{ fontWeight: "bold", mb: 0.5 }}>
                          👤 {selectedReport.reportedItemId.username}
                        </Typography>
                        {selectedReport.reportedItemId.email && (
                          <Typography variant="body2" sx={{ color: colors.gray[400] }}>
                            📧 {selectedReport.reportedItemId.email}
                          </Typography>
                        )}
                        {selectedReport.reportedItemId.role && (
                          <Typography variant="caption" sx={{ color: colors.gray[300] }}>
                            🔑 Vai trò: {selectedReport.reportedItemId.role}
                          </Typography>
                        )}
                      </div>
                    ) : (
                      <Typography>
                        👤 User: {selectedReport.reportedItemId}
                      </Typography>
                    )}
                  </Box>
                )}
              </Grid>

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
                  Lý do báo cáo:
                </Typography>
                <Box
                  sx={{
                    backgroundColor: colors.primary[500],
                    padding: "15px",
                    borderRadius: "12px",
                    boxShadow: getNeumorphicInsetShadow(),
                    color: colors.redAccent[400],
                    fontSize: "15px",
                    fontWeight: "bold",
                    mb: 2,
                  }}
                >
                  {selectedReport.reason}
                </Box>
              </Grid>

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
                  Mô tả chi tiết:
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
                  {selectedReport.description || "Không có mô tả"}
                </Box>
              </Grid>

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
                  {selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString("vi-VN") : "N/A"}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    mb: 1,
                    color: colors.gray[300],
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Trạng thái
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
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
                    <MenuItem value="pending">Chờ xử lý</MenuItem>
                    <MenuItem value="resolved">Đã xử lý</MenuItem>
                    <MenuItem value="rejected">Từ chối</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {selectedReport.reportedItemType === "User" && status === "resolved" && (
                <Grid item xs={12} sm={6}>
                  <Typography
                    sx={{
                      mb: 1,
                      color: colors.gray[300],
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Số ngày tạm khóa (tùy chọn)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={suspensionDays}
                    onChange={(e) => setSuspensionDays(e.target.value)}
                    placeholder="Để trống nếu chỉ cảnh cáo"
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
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography
                  sx={{
                    mb: 1,
                    color: colors.gray[300],
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Ghi chú của Admin
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Nhập ghi chú của admin..."
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
            onClick={handleSave}
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
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Report
