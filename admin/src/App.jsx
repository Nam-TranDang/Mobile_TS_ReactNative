import { useState, createContext } from "react";
import { Outlet } from "react-router-dom";
import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider, Box, IconButton } from "@mui/material";
import { Navbar, SideBar } from "./scenes";
import { useAuth } from "./context/AuthContext";
import { LogoutOutlined } from "@mui/icons-material";
import { tokens } from "./theme";

// Tạo context cho toggle sidebar
export const ToggledContext = createContext();

function App() {
  const [theme, colorMode] = useMode();
  const colors = tokens(theme.palette.mode);
  const [toggled, setToggled] = useState(false);
  const { logout } = useAuth();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ToggledContext.Provider value={{ toggled, setToggled }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ height: "100vh", position: "relative" }}>
            <Navbar />
            <Box sx={{ display: "flex", height: "calc(100% - 64px)" }}>
              <SideBar />
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  p: 2,
                  backgroundColor: colors.primary[500],
                  overflow: "auto",
                }}
              >
                {/* Nút đăng xuất */}
                <Box 
                  sx={{ 
                    position: "absolute", 
                    top: "16px", 
                    right: "16px", 
                    zIndex: 1100 
                  }}
                >
                  <IconButton
                    onClick={logout}
                    sx={{
                      backgroundColor: colors.redAccent[600],
                      color: colors.gray[100],
                      "&:hover": { backgroundColor: colors.redAccent[500] },
                    }}
                  >
                    <LogoutOutlined />
                  </IconButton>
                </Box>
                
                <Outlet />
              </Box>
            </Box>
          </Box>
        </ThemeProvider>
      </ToggledContext.Provider>
    </ColorModeContext.Provider>
  );
}

export default App;