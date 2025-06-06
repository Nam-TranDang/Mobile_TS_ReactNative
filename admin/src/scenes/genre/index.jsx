"use client"

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
  Typography,
  IconButton,
} from "@mui/material"
import { Header } from "../../components"
import { DataGrid, GridToolbar, GridToolbarContainer } from "@mui/x-data-grid"
import { tokens } from "../../theme"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material"

const Genre = () => {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)
  const isDark = theme.palette.mode === "dark"

  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [genreName, setGenreName] = useState("")
  const [error, setError] = useState(null)
  const [editingRowId, setEditingRowId] = useState(null)
  const [tempEditValue, setTempEditValue] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

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

  // Tạo custom toolbar
  const CustomToolbar = () => {
    return (
      <GridToolbarContainer sx={{ justifyContent: "space-between", p: 2 }}>
        <Box>
          <GridToolbar />
        </Box>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            className="neumorphic-btn"
            sx={{
              backgroundColor: colors.primary[500],
              color: colors.greenAccent[400],
              padding: "10px 20px",
              borderRadius: "12px",
              boxShadow: getNeumorphicShadow(),
              fontSize: "14px",
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: colors.primary[500],
                transform: "translateY(-3px)",
              },
              "&:active": {
                boxShadow: getNeumorphicPressedShadow(),
                transform: "translateY(1px)",
              },
            }}
          >
            Thêm thể loại mới
          </Button>
        </Box>
      </GridToolbarContainer>
    )
  }

  // Fetch genres from API
  useEffect(() => {
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("admin-token")

      if (!token) {
        throw new Error("Không tìm thấy token xác thực")
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/admin/genres`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      const formattedGenres = data.map((genre, index) => ({
        id: genre._id,
        stt: index + 1,
        genre_name: String(genre.genre_name || ""),
        soft_delete: Boolean(genre.soft_delete || false),
        status: genre.soft_delete ? "hidden" : "visible",
        ...genre,
      }))

      setGenres(formattedGenres)
    } catch (error) {
      console.error("Error fetching genres:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGenre = async () => {
    if (!genreName.trim()) {
      alert("Vui lòng nhập tên thể loại")
      return
    }

    try {
      const token = localStorage.getItem("admin-token")
      if (!token) {
        alert("Không tìm thấy token xác thực")
        return
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/admin/genres`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ genre_name: genreName.trim() }),
      })

      if (response.ok) {
        setSuccessMessage("Thêm thể loại thành công!")
        setTimeout(() => setSuccessMessage(""), 3000)
        await fetchGenres()
        setAddDialogOpen(false)
        setGenreName("")
      } else {
        const errorData = await response.json()
        alert("Lỗi khi thêm thể loại: " + errorData.message)
      }
    } catch (error) {
      console.error("Error adding genre:", error)
      alert("Lỗi khi thêm thể loại: " + error.message)
    }
  }

  const handleToggleVisibility = async (genreId, currentSoftDelete) => {
    try {
      const token = localStorage.getItem("admin-token")
      if (!token) {
        alert("Không tìm thấy token xác thực")
        return
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/admin/genres/${genreId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ soft_delete: !currentSoftDelete }),
      })

      if (response.ok) {
        setSuccessMessage(`${currentSoftDelete ? "Hiển thị" : "Ẩn"} thể loại thành công!`)
        setTimeout(() => setSuccessMessage(""), 3000)
        await fetchGenres()
      } else {
        const errorData = await response.json()
        alert("Lỗi khi cập nhật trạng thái: " + errorData.message)
      }
    } catch (error) {
      console.error("Error toggling visibility:", error)
      alert("Lỗi khi cập nhật trạng thái: " + error.message)
    }
  }

  const handleCellDoubleClick = (params) => {
    if (params.field === "genre_name" && !params.row.soft_delete) {
      setEditingRowId(params.id)
      setTempEditValue(params.value)
    }
  }

  const handleEditSave = async (genreId) => {
    if (!tempEditValue.trim()) {
      alert("Tên thể loại không được để trống")
      return
    }

    try {
      const token = localStorage.getItem("admin-token")
      if (!token) {
        alert("Không tìm thấy token xác thực")
        return
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/admin/genres/${genreId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ genre_name: tempEditValue.trim() }),
      })

      if (response.ok) {
        setSuccessMessage("Cập nhật tên thể loại thành công!")
        setTimeout(() => setSuccessMessage(""), 3000)
        await fetchGenres()
        setEditingRowId(null)
        setTempEditValue("")
      } else {
        const errorData = await response.json()
        alert("Lỗi khi cập nhật tên thể loại: " + errorData.message)
      }
    } catch (error) {
      console.error("Error updating genre name:", error)
      alert("Lỗi khi cập nhật tên thể loại: " + error.message)
    }
  }

  const handleEditCancel = () => {
    setEditingRowId(null)
    setTempEditValue("")
  }

  const columns = [
    { field: "stt", headerName: "STT", flex: 0.5 },
    {
      field: "genre_name",
      headerName: "Tên thể loại",
      flex: 2,
      renderCell: ({ row, value }) => {
        if (editingRowId === row.id) {
          return (
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <TextField
                value={tempEditValue}
                onChange={(e) => setTempEditValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleEditSave(row.id)
                  } else if (e.key === "Escape") {
                    handleEditCancel()
                  }
                }}
                onBlur={() => handleEditCancel()}
                autoFocus
                size="small"
                sx={{
                  mr: 1,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: colors.primary[500],
                    borderRadius: "8px",
                    boxShadow: getNeumorphicInsetShadow(),
                    "& fieldset": { border: "none" },
                  },
                  "& .MuiInputBase-input": {
                    color: colors.gray[100],
                    padding: "8px 12px",
                    fontSize: "14px",
                  },
                }}
              />
            </Box>
          )
        }
        return (
          <Box
            sx={{
              opacity: row.soft_delete ? 0.5 : 1,
              cursor: !row.soft_delete ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              borderRadius: "8px",
              backgroundColor: colors.primary[500],
              boxShadow: getNeumorphicInsetShadow(),
              transition: "all 0.2s ease",
              "&:hover": {
                transform: !row.soft_delete ? "translateY(-2px)" : "none",
              },
            }}
            title={!row.soft_delete ? "Double-click để chỉnh sửa" : "Không thể chỉnh sửa khi ẩn"}
          >
            <span style={{ color: colors.gray[100], fontSize: "14px", fontWeight: "500" }}>{value}</span>
            {!row.soft_delete && (
              <EditIcon
                sx={{
                  ml: 1,
                  fontSize: "14px",
                  opacity: 0.6,
                  color: colors.greenAccent[400],
                }}
              />
            )}
          </Box>
        )
      },
    },
    {
      field: "status",
      headerName: "Trạng thái",
      flex: 1,
      renderCell: ({ row }) => (
        <Box
          sx={{
            backgroundColor: colors.primary[500],
            color: row.soft_delete ? colors.redAccent[400] : colors.greenAccent[400],
            padding: "6px 16px",
            borderRadius: "12px",
            textAlign: "center",
            fontSize: "13px",
            fontWeight: "bold",
            minWidth: "80px",
            boxShadow: getNeumorphicInsetShadow(),
          }}
        >
          {row.soft_delete ? "Ẩn" : "Hiển thị"}
        </Box>
      ),
    },
    {
      field: "action",
      headerName: "Hành động",
      flex: 1,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={() => handleToggleVisibility(row.id, row.soft_delete)}
            className="neumorphic-btn"
            sx={{
              backgroundColor: colors.primary[500],
              color: row.soft_delete ? colors.greenAccent[400] : colors.redAccent[400],
              padding: "8px",
              borderRadius: "12px",
              boxShadow: getNeumorphicShadow(),
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: colors.primary[500],
                transform: "translateY(-3px)",
              },
              "&:active": {
                boxShadow: getNeumorphicPressedShadow(),
                transform: "translateY(1px)",
              },
            }}
            title={row.soft_delete ? "Hiển thị" : "Ẩn"}
          >
            {row.soft_delete ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
          </IconButton>
        </Box>
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

      <Header title="Quản lý Thể loại" subtitle="Danh sách thể loại sách" />

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
        mt="20px"
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
          rows={genres}
          columns={columns}
          components={{ Toolbar: CustomToolbar }}
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
                  field: "genre_name",
                  sort: "asc",
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
            Thêm thể loại mới
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[500], pt: 3, padding: "25px" }}>
          <Typography
            sx={{
              mb: 1,
              color: colors.gray[300],
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Tên thể loại
          </Typography>
          <TextField
            fullWidth
            value={genreName}
            onChange={(e) => setGenreName(e.target.value)}
            placeholder="Nhập tên thể loại..."
            autoFocus
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
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.primary[400], p: 3 }}>
          <Button
            onClick={() => setAddDialogOpen(false)}
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
            onClick={handleAddGenre}
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
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Genre
