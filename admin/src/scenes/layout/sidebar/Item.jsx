import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MenuItem } from "react-pro-sidebar";
import { Typography } from "@mui/material";

const Item = ({ title, path, icon, colors }) => {
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setIsActive(location.pathname === path);
  }, [location, path]);

  return (
    <MenuItem
      component={<Link to={path} />}
      icon={icon}
      rootStyles={{
        color: isActive ? colors.greenAccent[500] : colors.gray[100],
        "&:hover": {
          backgroundColor: "transparent",
          color: colors.greenAccent[500],
        },
      }}
    >
      <Typography variant="h5">{title}</Typography>
    </MenuItem>
  );
};

export default Item;