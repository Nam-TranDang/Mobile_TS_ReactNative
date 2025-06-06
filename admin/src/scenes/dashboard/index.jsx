"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@mui/material"
import { Header } from "../../components"
import {
  ReportProblemTwoTone,
  ImportContactsTwoTone,
  Diversity3TwoTone,
  PermIdentityTwoTone,
  Delete,
  Star,
  ThumbUp,
  ThumbDown,
  Person,
  Schedule,
  Article,
  Close,
  Search,
  FilterList,
  ArrowForward,
} from "@mui/icons-material"
import { tokens } from "../../theme"
import useAdminSocket from "../../hooks/useAdminSocket"

function Dashboard() {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)
  const navigate = useNavigate()
  const isDark = theme.palette.mode === "dark"

  // Thêm state cho statistics
  const [stats, setStats] = useState({
    totalReports: 0,
    totalBooks: 0,
    totalUsers: 0,
    totalVisitors: 0,
    onlineUsers: 0,
  })

  const handleNewReport = useCallback((data) => {
    console.log("New report received in real-time!", data)

    setStats((prev) => ({
      ...prev,
      totalReports: prev.totalReports + 1,
    }))

    const formattedReport = {
      id: data.report._id,
      reporter: data.reporter?.username || data.reporter?.name || "Unknown",
      reportedItemType: data.report.reportedItemType || "",
      reportedItemId: data.report.reportedItemId || "",
      reason: data.report.reason || "",
      status: data.report.status || "pending",
      description: data.report.description || "",
      adminNotes: data.report.adminNotes || "",
      createdAt: data.report.createdAt,
      reporterObject: data.reporter,
    }

    setRecentReports((prev) => [formattedReport, ...prev.slice(0, 9)])
  }, [])

  const handleNewBook = useCallback((data) => {
    console.log("New book received in real-time!", data)

    setStats((prev) => ({
      ...prev,
      totalBooks: prev.totalBooks + 1,
    }))

    const formattedBook = {
      id: data.book._id,
      title: data.book.title || "",
      username: data.user?.username || data.user?.name || "Unknown",
      caption: data.book.caption || "",
      rating: data.book.rating || 0,
      likesCount: data.book.like_count || 0,
      dislikesCount: data.book.dislike_count || 0,
      createdAt: data.book.createdAt,
      imageUrl: data.book.image || null,
      genres: data.book.genre || null,
      userObject: data.user,
      ...data.book,
    }

    setRecentBooks((prev) => [formattedBook, ...prev.slice(0, 9)])
  }, [])

  const handleNewUser = useCallback((data) => {
    console.log("New user registered in real-time!", data)

    setStats((prev) => ({
      ...prev,
      totalUsers: prev.totalUsers + 1,
    }))
  }, [])

  const handleOnlineUsersUpdate = useCallback((count) => {
    console.log("Online users updated:", count)
    setStats((prev) => ({
      ...prev,
      onlineUsers: count,
    }))
  }, [])

  useAdminSocket(handleNewReport, handleNewBook, handleNewUser, handleOnlineUsersUpdate)

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem("admin-token")
      if (!token) return

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

      const reportsResponse = await fetch(`${API_URL}/api/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const booksCountResponse = await fetch(`${API_URL}/api/admin/books/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const usersCountResponse = await fetch(`${API_URL}/api/admin/users/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()

        let totalUsers = 0
        if (usersCountResponse.ok) {
          const usersCountData = await usersCountResponse.json()
          console.log("Users count response:", usersCountData)
          totalUsers = usersCountData.success ? usersCountData.count : 0
        } else {
          console.error("Failed to fetch users count:", usersCountResponse.statusText)
        }

        let totalBooks = 0
        if (booksCountResponse.ok) {
          const booksCountData = await booksCountResponse.json()
          console.log("Books count response:", booksCountData)
          totalBooks = booksCountData.success ? booksCountData.count : 0
        } else {
          console.error("Failed to fetch books count:", booksCountResponse.statusText)
        }

        setStats((prev) => ({
          ...prev,
          totalReports: reportsData.reports?.length || reportsData.total || 0,
          totalBooks: totalBooks,
          totalUsers: totalUsers,
          totalVisitors: 1325134,
        }))

        console.log("Updated stats:", {
          totalReports: reportsData.reports?.length || reportsData.total || 0,
          totalBooks: totalBooks,
          totalUsers: totalUsers,
          totalVisitors: 1325134,
        })
      }
    } catch (error) {
      console.error("Error fetching statistics:", error)
    }
  }

  // State for reports
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [status, setStatus] = useState("")
  const [suspensionDays, setSuspensionDays] = useState("")

  // State for books
  const [recentBooks, setRecentBooks] = useState([])
  const [booksLoading, setBooksLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookDialogOpen, setBookDialogOpen] = useState(false)

  useEffect(() => {
    fetchStatistics()
    fetchRecentReports()
    fetchRecentBooks()
  }, [])

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()

    return `${hours}:${minutes} ${day}/${month}/${year}`
  }

  const fetchRecentBooks = async () => {
    try {
      setBooksLoading(true)
      const token = localStorage.getItem("admin-token")
      if (!token) return

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/books?limit=6&sort=createdAt&order=desc`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        const booksArray = data.books || data

        const formattedBooks = booksArray.map((book) => ({
          id: book._id,
          title: String(book.title || ""),
          username: book.user?.username || book.user?.name || "Unknown",
          caption: String(book.caption || ""),
          rating: Number(book.rating || 0),
          likesCount:
            book.like_count ||
            (Array.isArray(book.likedBy) ? book.likedBy.length : 0) ||
            (Array.isArray(book.likes) ? book.likes.length : 0) ||
            0,
          dislikesCount:
            book.dislike_count ||
            (Array.isArray(book.dislikedBy) ? book.dislikedBy.length : 0) ||
            (Array.isArray(book.dislikes) ? book.dislikes.length : 0) ||
            0,
          createdAt: book.createdAt,
          imageUrl: book.imageUrl || book.image || book.thumbnail || null,
          genres: book.genres || book.category || null,
          userObject: book.user,
          ...book,
        }))

        setRecentBooks(formattedBooks)
      }
    } catch (error) {
      console.error("Error fetching recent books:", error)
    } finally {
      setBooksLoading(false)
    }
  }

  const handleBookActionClick = (book) => {
    setSelectedBook(book)
    setBookDialogOpen(true)
  }

  const handleCloseBookDialog = () => {
    setBookDialogOpen(false)
    setSelectedBook(null)
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
        await fetchRecentBooks()
        handleCloseBookDialog()
      } else {
        const errorData = await response.json()
        alert("Không thể xóa sách: " + (errorData.message || "Lỗi không xác định"))
      }
    } catch (error) {
      console.error("Error deleting book:", error)
      alert("Lỗi khi xóa sách: " + error.message)
    }
  }

  const handleViewAllBooks = () => {
    navigate("/book")
  }

  const fetchRecentReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("admin-token")
      if (!token) return

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await fetch(`${API_URL}/api/reports?limit=6&sort=createdAt&order=desc`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        const formattedReports = data.reports.map((report) => ({
          id: report._id,
          reporter: report.reporter?.username || report.reporter?.name || "Unknown",
          reportedItemType: String(report.reportedItemType || ""),
          reportedItemId:
            typeof report.reportedItemId === "object"
              ? report.reportedItemId?.username ||
                report.reportedItemId?.name ||
                report.reportedItemId?.title ||
                "Unknown"
              : String(report.reportedItemId || ""),
          reason: String(report.reason || ""),
          status: String(report.status || ""),
          description: String(report.description || ""),
          adminNotes: String(report.adminNotes || ""),
          createdAt: report.createdAt,
          reporterObject: report.reporter,
        }))
        setRecentReports(formattedReports)
      }
    } catch (error) {
      console.error("Error fetching recent reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (report) => {
    setSelectedReport(report)
    setStatus(report.status || "")
    setAdminNotes(report.adminNotes || "")
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

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("admin-token")
      if (!token) {
        alert("Không tìm thấy token xác thực")
        return
      }

      const updateData = { status, adminNotes }

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
        await fetchRecentReports()
        handleCloseDialog()
      } else {
        const errorData = await response.json()
        alert("Failed to update report: " + errorData.message)
      }
    } catch (error) {
      console.error("Error updating report:", error)
      alert("Error updating report")
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
        return "Không xác định"
    }
  }

  const handleViewAllReports = () => {
    navigate("/report")
  }

  // Stats data with theme colors
  const statsData = [
    {
      title: "Báo cáo",
      value: stats.totalReports.toLocaleString(),
      icon: ReportProblemTwoTone,
      color: isDark ? "#ff6b6b" : "#ff6b6b",
      iconBg: isDark ? "rgba(255, 107, 107, 0.2)" : "rgba(255, 107, 107, 0.1)",
       onClick: () => navigate("/report"),
    },
    {
      title: "Bài viết",
      value: stats.totalBooks.toLocaleString(),
      icon: ImportContactsTwoTone,
      color: isDark ? "#4ecdc4" : "#4ecdc4",
      iconBg: isDark ? "rgba(78, 205, 196, 0.2)" : "rgba(78, 205, 196, 0.1)",
      onClick: () => navigate("/book"),
    },
    {
      title: "Người dùng",
      value: stats.totalUsers.toLocaleString(),
      icon: Diversity3TwoTone,
      color: isDark ? "#667eea" : "#667eea",
      iconBg: isDark ? "rgba(102, 126, 234, 0.2)" : "rgba(102, 126, 234, 0.1)",
      onClick: () => navigate("/acc"),
    },
    {
      title: "Đang truy cập",
      value: stats.onlineUsers.toLocaleString(),
      icon: PermIdentityTwoTone,
      color: isDark ? "#f093fb" : "#f093fb",
      iconBg: isDark ? "rgba(240, 147, 251, 0.2)" : "rgba(240, 147, 251, 0.1)",
    },
  ]

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

  // Styles
  const styles = {
    container: {
      minHeight: "100vh",
      padding: "30px",
      fontFamily: '"Poppins", sans-serif',
      backgroundColor: colors.primary[500],
      color: colors.gray[100],
      overflow: "hidden",
    },
    header: {
      marginBottom: "40px",
    },
    searchContainer: {
      display: "flex",
      alignItems: "center",
      marginBottom: "30px",
      gap: "15px",
    },
    searchBox: {
      display: "flex",
      alignItems: "center",
      flex: 1,
      maxWidth: "500px",
      backgroundColor: colors.primary[500],
      borderRadius: "50px",
      padding: "5px 20px",
      boxShadow: getNeumorphicInsetShadow(),
    },
    searchInput: {
      backgroundColor: "transparent",
      border: "none",
      color: colors.gray[100],
      padding: "12px",
      fontSize: "14px",
      width: "100%",
      outline: "none",
    },
    filterButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary[500],
      color: colors.gray[100],
      borderRadius: "50%",
      width: "45px",
      height: "45px",
      border: "none",
      boxShadow: getNeumorphicShadow(),
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "30px",
      marginBottom: "40px",
    },
    statCard: {
      borderRadius: "20px",
      padding: "25px",
      backgroundColor: colors.primary[500],
      boxShadow: getNeumorphicShadow(),
      transition: "all 0.3s ease",
      position: "relative",
      overflow: "hidden",
      cursor: "pointer",
    },
    statHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    statTitle: {
      fontSize: "16px",
      fontWeight: 500,
      color: colors.gray[300],
      margin: 0,
    },
    statIconContainer: {
      width: "50px",
      height: "50px",
      borderRadius: "15px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: getNeumorphicShadow(),
    },
    statValue: {
      fontSize: "36px",
      fontWeight: 700,
      margin: "15px 0",
      color: colors.gray[100],
    },
    statFooter: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    statTrend: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "14px",
      fontWeight: 600,
      padding: "5px 12px",
      borderRadius: "20px",
      backgroundColor: colors.primary[500],
      boxShadow: getNeumorphicInsetShadow(),
    },
    mainContent: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "30px",
      height: "calc(100vh - 350px)",
    },
    sectionCard: {
      borderRadius: "20px",
      backgroundColor: colors.primary[500],
      boxShadow: getNeumorphicShadow(),
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    sectionHeader: {
      padding: "20px 25px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.primary[500],
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    sectionTitle: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    sectionTitleText: {
      fontSize: "18px",
      fontWeight: 600,
      margin: 0,
      color: colors.gray[100],
    },
    viewAllBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      border: "none",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: 500,
      backgroundColor: colors.primary[500],
      color: colors.gray[100],
      cursor: "pointer",
      boxShadow: getNeumorphicShadow(),
      transition: "all 0.2s ease",
    },
    sectionContent: {
      flex: 1,
      padding: "20px",
      overflow: "hidden",
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
    },
    loadingSpinner: {
      width: "40px",
      height: "40px",
      border: `3px solid ${colors.primary[400]}`,
      borderTop: `3px solid ${colors.blueAccent[500]}`,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      marginBottom: "15px",
    },
    emptyState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: colors.gray[300],
    },
    reportsList: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "15px",
      height: "100%",
      overflow: "hidden",
    },
    reportItem: {
      padding: "20px",
      borderRadius: "15px",
      backgroundColor: colors.primary[500],
      boxShadow: getNeumorphicShadow(),
      transition: "all 0.2s ease",
      cursor: "pointer",
    },
    reportHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
    },
    reportReason: {
      fontSize: "16px",
      fontWeight: 600,
      margin: 0,
      color: colors.gray[100],
    },
    statusBadge: {
      padding: "5px 10px",
      borderRadius: "10px",
      fontSize: "12px",
      fontWeight: 500,
      boxShadow: getNeumorphicInsetShadow(),
    },
    reportMeta: {
      display: "flex",
      gap: "15px",
    },
    metaItem: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "13px",
      color: colors.gray[300],
    },
    booksGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      gap: "20px",
      height: "100%",
      overflow: "hidden",
    },
    bookCard: {
      borderRadius: "15px",
      backgroundColor: colors.primary[500],
      boxShadow: getNeumorphicShadow(),
      overflow: "hidden",
      transition: "all 0.2s ease",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
    },
    bookImageContainer: {
      height: "120px",
      overflow: "hidden",
      position: "relative",
    },
    bookImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    bookImagePlaceholder: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary[400],
    },
    bookContent: {
      padding: "15px",
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    bookTitle: {
      fontSize: "14px",
      fontWeight: 600,
      margin: "0 0 8px 0",
      color: colors.gray[100],
      lineHeight: "1.3",
    },
    bookMeta: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      color: colors.gray[300],
      marginBottom: "10px",
    },
    bookStats: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "auto",
    },
    bookRating: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "12px",
      color: "#fbbf24",
      padding: "4px 8px",
      borderRadius: "8px",
      backgroundColor: colors.primary[500],
      boxShadow: getNeumorphicInsetShadow(),
    },
    bookLikes: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "12px",
      color: colors.gray[300],
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      backdropFilter: "blur(5px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
    },
    modalContent: {
      borderRadius: "20px",
      backgroundColor: colors.primary[500],
      maxWidth: "550px",
      width: "100%",
      maxHeight: "80vh",
      overflow: "hidden",
      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
    },
    modalHeader: {
      padding: "20px 25px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${colors.primary[400]}`,
    },
    modalHeaderTitle: {
      fontSize: "20px",
      fontWeight: 600,
      margin: 0,
      color: colors.gray[100],
    },
    closeBtn: {
      width: "36px",
      height: "36px",
      border: "none",
      borderRadius: "50%",
      backgroundColor: colors.primary[500],
      color: colors.gray[100],
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: getNeumorphicShadow(),
      transition: "all 0.2s ease",
    },
    modalBody: {
      padding: "25px",
      maxHeight: "60vh",
      overflow: "auto",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "20px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    formLabel: {
      fontSize: "14px",
      fontWeight: 500,
      color: colors.gray[300],
    },
    formText: {
      fontSize: "15px",
      margin: 0,
      padding: "10px 15px",
      color: colors.gray[100],
      backgroundColor: colors.primary[500],
      borderRadius: "10px",
      boxShadow: getNeumorphicInsetShadow(),
    },
    formInput: {
      padding: "12px 15px",
      backgroundColor: colors.primary[500],
      color: colors.gray[100],
      border: "none",
      borderRadius: "10px",
      fontSize: "15px",
      fontFamily: "inherit",
      outline: "none",
      boxShadow: getNeumorphicInsetShadow(),
    },
    formTextarea: {
      padding: "12px 15px",
      backgroundColor: colors.primary[500],
      color: colors.gray[100],
      border: "none",
      borderRadius: "10px",
      fontSize: "15px",
      fontFamily: "inherit",
      resize: "none",
      minHeight: "100px",
      outline: "none",
      boxShadow: getNeumorphicInsetShadow(),
    },
    modalFooter: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "15px",
      padding: "20px 25px",
      borderTop: `1px solid ${colors.primary[400]}`,
    },
    btn: {
      padding: "12px 24px",
      border: "none",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: 500,
      cursor: "pointer",
      boxShadow: getNeumorphicShadow(),
      transition: "all 0.2s ease",
    },
    cancelBtn: {
      backgroundColor: colors.primary[500],
      color: colors.gray[300],
    },
    saveBtn: {
      backgroundColor: colors.primary[500],
      color: colors.greenAccent[400],
    },
    deleteBtn: {
      backgroundColor: colors.primary[500],
      color: colors.redAccent[400],
    },
    "@keyframes spin": {
      "0%": { transform: "rotate(0deg)" },
      "100%": { transform: "rotate(360deg)" },
    },
    "@media (max-width: 1024px)": {
      mainContent: {
        gridTemplateColumns: "1fr",
        height: "auto",
      },
    },
    "@media (max-width: 768px)": {
      container: {
        padding: "20px",
      },
      statsGrid: {
        gridTemplateColumns: "1fr",
        gap: "20px",
      },
    },
  }

  return (
    <div style={styles.container}>
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
          
          .neumorphic-hover:hover {
            transform: translateY(-5px);
          }
          
          .neumorphic-pressed:active {
            box-shadow: ${getNeumorphicPressedShadow()};
            transform: translateY(2px);
          }
        `}
      </style>

      <div style={styles.header}>
        <Header title="Trang tổng quan" subtitle="Trang tổng quan quản lý hệ thống" />
      </div>


      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        {statsData.map((stat, index) => (
          <div key={index} className="neumorphic-hover" style={styles.statCard} onClick={stat.onClick}>
            <div style={styles.statHeader}>
              <h3 style={styles.statTitle}>{stat.title}</h3>
              <div
                style={{
                  ...styles.statIconContainer,
                  backgroundColor: stat.iconBg,
                }}
              >
                <stat.icon style={{ color: stat.color, fontSize: "24px" }} />
              </div>
            </div>
            <p style={styles.statValue}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Reports Section */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              <ReportProblemTwoTone style={{ color: "#ff6b6b", fontSize: "22px" }} />
              <h2 style={styles.sectionTitleText}>Báo cáo gần đây</h2>
            </div>
            <button
              className="neumorphic-hover neumorphic-pressed"
              style={styles.viewAllBtn}
              onClick={handleViewAllReports}
            >
              Xem tất cả <ArrowForward style={{ fontSize: "16px" }} />
            </button>
          </div>

          <div style={styles.sectionContent}>
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.loadingSpinner}></div>
                <p style={{ color: colors.gray[300] }}>Đang tải...</p>
              </div>
            ) : recentReports.length === 0 ? (
              <div style={styles.emptyState}>
                <Article style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }} />
                <p>Không có báo cáo nào</p>
              </div>
            ) : (
              <div style={styles.reportsList}>
                {recentReports.map((report, index) => (
                  <div
                    key={`${report.id}-${index}`}
                    className="neumorphic-hover neumorphic-pressed"
                    style={styles.reportItem}
                    onClick={() => handleActionClick(report)}
                  >
                    <div style={styles.reportHeader}>
                      <h4 style={styles.reportReason}>{report.reason}</h4>
                      <span
                        style={{
                          ...styles.statusBadge,
                          color:
                            report.status === "pending"
                              ? "#ef4444"
                              : report.status === "resolved"
                                ? "#4ade80"
                                : "#9ca3af",
                        }}
                      >
                        {getStatusLabel(report.status)}
                      </span>
                    </div>
                    <div style={styles.reportMeta}>
                      <div style={styles.metaItem}>
                        <Person style={{ fontSize: "16px" }} />
                        <span>{report.reporter}</span>
                      </div>
                      <div style={styles.metaItem}>
                        <Schedule style={{ fontSize: "16px" }} />
                        <span>{formatDateTime(report.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Books Section */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              <ImportContactsTwoTone style={{ color: "#4ecdc4", fontSize: "22px" }} />
              <h2 style={styles.sectionTitleText}>Bài viết gần đây</h2>
            </div>
            <button
              className="neumorphic-hover neumorphic-pressed"
              style={styles.viewAllBtn}
              onClick={handleViewAllBooks}
            >
              Xem tất cả <ArrowForward style={{ fontSize: "16px" }} />
            </button>
          </div>

          <div style={styles.sectionContent}>
            {booksLoading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.loadingSpinner}></div>
                <p style={{ color: colors.gray[300] }}>Đang tải...</p>
              </div>
            ) : recentBooks.length === 0 ? (
              <div style={styles.emptyState}>
                <ImportContactsTwoTone style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }} />
                <p>Không có bài viết nào</p>
              </div>
            ) : (
              <div style={styles.booksGrid}>
                {recentBooks.map((book, index) => (
                  <div
                    key={`${book.id}-${index}`}
                    className="neumorphic-hover"
                    style={styles.bookCard}
                    onClick={() => handleBookActionClick(book)}
                  >
                    <div style={styles.bookImageContainer}>
                      {book.imageUrl ? (
                        <img src={book.imageUrl || "/placeholder.svg"} alt={book.title} style={styles.bookImage} />
                      ) : (
                        <div style={styles.bookImagePlaceholder}>
                          <ImportContactsTwoTone style={{ color: colors.gray[300], fontSize: "30px" }} />
                        </div>
                      )}
                    </div>
                    <div style={styles.bookContent}>
                      <h4 style={styles.bookTitle}>
                        {book.title.length > 30 ? `${book.title.substring(0, 30)}...` : book.title}
                      </h4>
                      <div style={styles.bookMeta}>
                        <Person style={{ fontSize: "14px" }} />
                        <span>{book.username}</span>
                      </div>
                      <div style={styles.bookStats}>
                        <div style={styles.bookRating}>
                          <Star style={{ fontSize: "14px" }} />
                          <span>{book.rating.toFixed(1)}</span>
                        </div>
                        <div style={styles.bookLikes}>
                          <ThumbUp style={{ fontSize: "14px", color: colors.greenAccent[400] }} />
                          <span>{book.likesCount}</span>
                          <ThumbDown style={{ fontSize: "14px", color: colors.redAccent[400], marginLeft: "5px" }} />
                          <span>{book.dislikesCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      {dialogOpen && (
        <div style={styles.modalOverlay} onClick={handleCloseDialog}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalHeaderTitle}>Xử lý Báo cáo</h2>
              <button
                className="neumorphic-hover neumorphic-pressed"
                style={styles.closeBtn}
                onClick={handleCloseDialog}
              >
                <Close />
              </button>
            </div>

            {selectedReport && (
              <div style={styles.modalBody}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Người báo cáo:</label>
                    <p style={styles.formText}>
                      {selectedReport.reporterObject?.username || selectedReport.reporterObject?.name || "Unknown"}
                    </p>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Loại báo cáo:</label>
                    <p style={styles.formText}>{selectedReport.reportedItemType}</p>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Đối tượng bị báo cáo:</label>
                    <p style={styles.formText}>{selectedReport.reportedItemId}</p>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Lý do:</label>
                    <p style={styles.formText}>{selectedReport.reason}</p>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Mô tả chi tiết:</label>
                    <p style={styles.formText}>{selectedReport.description || "Không có mô tả"}</p>
                  </div>

                  <div style={styles.formGroup}>
                    <label htmlFor="status" style={styles.formLabel}>
                      Trạng thái:
                    </label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={styles.formInput}
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="resolved">Đã xử lý</option>
                      <option value="rejected">Từ chối</option>
                    </select>
                  </div>

                  {selectedReport.reportedItemType === "User" && status === "resolved" && (
                    <div style={styles.formGroup}>
                      <label htmlFor="suspensionDays" style={styles.formLabel}>
                        Số ngày tạm khóa:
                      </label>
                      <input
                        type="number"
                        id="suspensionDays"
                        value={suspensionDays}
                        onChange={(e) => setSuspensionDays(e.target.value)}
                        placeholder="Nhập số ngày (tùy chọn)"
                        style={styles.formInput}
                      />
                    </div>
                  )}

                  <div style={styles.formGroup}>
                    <label htmlFor="adminNotes" style={styles.formLabel}>
                      Ghi chú của admin:
                    </label>
                    <textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Nhập ghi chú..."
                      style={styles.formTextarea}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={styles.modalFooter}>
              <button
                className="neumorphic-hover neumorphic-pressed"
                style={{ ...styles.btn, ...styles.cancelBtn }}
                onClick={handleCloseDialog}
              >
                Hủy
              </button>
              <button
                className="neumorphic-hover neumorphic-pressed"
                style={{ ...styles.btn, ...styles.saveBtn }}
                onClick={handleSave}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Detail Dialog */}
      {bookDialogOpen && (
        <div style={styles.modalOverlay} onClick={handleCloseBookDialog}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalHeaderTitle}>Chi tiết Bài viết</h2>
              <button
                className="neumorphic-hover neumorphic-pressed"
                style={styles.closeBtn}
                onClick={handleCloseBookDialog}
              >
                <Close />
              </button>
            </div>

            {selectedBook && (
              <div style={styles.modalBody}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Người đăng:</label>
                    <p style={styles.formText}>
                      {selectedBook.userObject?.username || selectedBook.userObject?.name || "Unknown"}
                    </p>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Danh mục:</label>
                    <p style={styles.formText}>
                      {selectedBook.genres
                        ? Array.isArray(selectedBook.genres)
                          ? selectedBook.genres.join(", ")
                          : selectedBook.genres
                        : "Chưa phân loại"}
                    </p>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Tiêu đề:</label>
                    <p style={styles.formText}>{selectedBook.title}</p>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Mô tả:</label>
                    <p style={styles.formText}>{selectedBook.caption || "Không có mô tả"}</p>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Đánh giá:</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Star style={{ color: "#fbbf24", fontSize: "18px" }} />
                      <span style={{ color: colors.gray[100], fontSize: "16px" }}>
                        {selectedBook.rating.toFixed(1)} / 5.0
                      </span>
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Tương tác:</label>
                    <div style={{ display: "flex", gap: "15px", fontSize: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <ThumbUp style={{ color: colors.greenAccent[400], fontSize: "18px" }} />
                        <span style={{ color: colors.gray[100] }}>{selectedBook.likesCount}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <ThumbDown style={{ color: colors.redAccent[400], fontSize: "18px" }} />
                        <span style={{ color: colors.gray[100] }}>{selectedBook.dislikesCount}</span>
                      </div>
                    </div>
                  </div>

                  {selectedBook.imageUrl && (
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Hình ảnh:</label>
                      <div
                        style={{
                          marginTop: "10px",
                          borderRadius: "15px",
                          overflow: "hidden",
                          boxShadow: getNeumorphicShadow(),
                        }}
                      >
                        <img
                          src={selectedBook.imageUrl || "/placeholder.svg"}
                          alt={selectedBook.title}
                          style={{
                            maxWidth: "100%",
                            height: "200px",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={styles.modalFooter}>
              <button
                className="neumorphic-hover neumorphic-pressed"
                style={{ ...styles.btn, ...styles.cancelBtn }}
                onClick={handleCloseBookDialog}
              >
                Đóng
              </button>
              <button
                className="neumorphic-hover neumorphic-pressed"
                style={{ ...styles.btn, ...styles.deleteBtn }}
                onClick={handleDeleteBook}
              >
                <Delete style={{ fontSize: "18px", marginRight: "5px" }} />
                Xóa bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
