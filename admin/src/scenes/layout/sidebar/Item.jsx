"use client"

import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { MenuItem } from "react-pro-sidebar"
import { Typography } from "@mui/material"

const Item = ({ title, path, icon, colors }) => {
  const location = useLocation()
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    setIsActive(location.pathname === path)
  }, [location, path])

  return (
    <MenuItem
      component={<Link to={path} />}
      icon={icon}
      rootStyles={{
        margin: "4px 8px",
        padding: "10px 16px",
        borderRadius: "12px",
        paddingLeft: "0px",
        color: isActive ? "#4361ee" : colors.gray[100],
        backgroundColor: isActive ? "#e6efff" : "transparent",
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "#f5f5f5",
          color: "#4361ee",
          transform: "translateX(4px)",
        },
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: isActive ? "600" : "500",
          fontSize: "0.95rem",
        }}
      >
        {title}
      </Typography>
    </MenuItem>
  )
}

export default Item
