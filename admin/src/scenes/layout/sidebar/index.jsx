"use client"

import { Avatar, Box, IconButton, Typography, useTheme } from "@mui/material"
import { useContext, useState } from "react"
import { tokens } from "../../../theme"
import { Menu, MenuItem, Sidebar } from "react-pro-sidebar"
import {
  ReportGmailerrorred,
  DashboardOutlined,
  PeopleAltOutlined,
  Category,
  BookOutlined,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material"
import avatar from "../../../assets/images/avatar.png"
import logo from "../../../assets/images/logo.png"
import Item from "./Item"
import { ToggledContext } from "../../../App"
import { useAuth } from "../../../context/AuthContext"

const SideBar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { toggled, setToggled } = useContext(ToggledContext)
  const { user } = useAuth()
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)
  const isDark = theme.palette.mode === "dark"

  // Sử dụng theme colors thay vì hard-code
  const textColor = colors.gray[100]
  const primaryColor = colors.blueAccent[500]
  const bgColor = colors.primary[500]
  const secondaryBgColor = colors.primary[500]
  const borderColor = colors.primary[300]

  return (
    <Sidebar
      backgroundColor={bgColor}
      rootStyles={{
        border: "none",
        height: "100%",
        boxShadow: isDark 
          ? "0 2px 8px rgba(0,0,0,0.3)" 
          : "0 2px 8px rgba(0,0,0,0.1)",
      }}
      collapsed={collapsed}
      onBackdropClick={() => setToggled(false)}
      toggled={toggled}
      breakPoint="md"
    >
      <Menu
        menuItemStyles={{
          button: { ":hover": { background: "transparent" } },
        }}
      >
        <MenuItem
          rootStyles={{
            margin: "16px 0 20px 0",
            color: textColor,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {!collapsed && (
              <Box display="flex" alignItems="center" gap="12px" sx={{ transition: ".3s ease" }}>
                <img
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    objectFit: "cover",
                  }}
                  src={logo || "/placeholder.svg"}
                  alt="Logo"
                />
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    fontSize: "1.2rem",
                    color: primaryColor,
                  }}
                >
                  Thư viện tan
                </Typography>
              </Box>
            )}
            <IconButton
              onClick={() => setCollapsed(!collapsed)}
              sx={{
                backgroundColor: secondaryBgColor,
                borderRadius: "8px",
                width: "36px",
                height: "36px",
                color: textColor,
                "&:hover": {
                  backgroundColor: borderColor,
                },
              }}
            >
              {collapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </Box>
        </MenuItem>
      </Menu>

      {!collapsed && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            mb: "25px",
            padding: "16px",
            margin: "0 12px",
            borderRadius: "12px",
          }}
        >
          <Avatar
            alt="avatar"
            src={user?.profileImage || avatar}
            sx={{
              width: "80px",
              height: "80px",
              border: `3px solid ${primaryColor}`,
            }}
          />
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h3"
              fontWeight="600"
              sx={{
                fontSize: "1.1rem",
                marginBottom: "6px",
                color: textColor,
              }}
            >
              {user?.username || "Admin User"}
            </Typography>
            <Box
              sx={{
                backgroundColor: primaryColor,
                color: "white",
                fontSize: "0.8rem",
                fontWeight: "500",
                padding: "4px 12px",
                borderRadius: "20px",
                display: "inline-block",
              }}
            >
              Admin
            </Box>
          </Box>
        </Box>
      )}

      <Box mb={5} pl={collapsed ? undefined : "8px"} pr="8px">
        <Menu
          menuItemStyles={{
            button: {
              ":hover": {
                background: "transparent",
                transition: ".3s ease",
              },
            },
          }}
        >
          <Item
            title="Tổng quan"
            path="/"
            colors={colors}
            icon={<DashboardOutlined sx={{ fontSize: "22px", color: primaryColor }} />}
          />
        </Menu>

        <Typography
          variant="h6"
          sx={{
            margin: "20px 16px 12px 16px",
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: colors.gray[300],
            fontWeight: "600",
          }}
        >
          {!collapsed ? "Quản lý" : " "}
        </Typography>

        <Menu
          menuItemStyles={{
            button: {
              ":hover": {
                background: "transparent",
                transition: ".3s ease",
              },
            },
          }}
        >
          <Item
            title="Quản lý tài khoản"
            path="/acc"
            colors={colors}
            icon={<PeopleAltOutlined sx={{ fontSize: "22px", color: colors.greenAccent[500] }} />}
          />
          <Item
            title="Quản lý bài viết"
            path="/book"
            colors={colors}
            icon={<BookOutlined sx={{ fontSize: "22px", color: colors.blueAccent[500] }} />}
          />
          <Item
            title="Quản lý báo cáo"
            path="/report"
            colors={colors}
            icon={<ReportGmailerrorred sx={{ fontSize: "22px", color: colors.redAccent[500] }} />}
          />
          <Item
            title="Quản lý thể loại"
            path="/genre"
            colors={colors}
            icon={<Category sx={{ fontSize: "22px", color: colors.primary[200] }} />}
          />
        </Menu>
      </Box>
    </Sidebar>
  )
}

export default SideBar