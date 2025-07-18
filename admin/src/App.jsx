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

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ToggledContext.Provider value={{ toggled, setToggled }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          
          {/* Navbar floating ở góc phải */}
          <Navbar />
          
          <Box sx={{ 
            height: "100vh", 
            overflow: "hidden", 
            display: "flex"
          }}>
            <SideBar />
            
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                backgroundColor: colors.primary[500],
                overflow: "auto",
                height: "100vh",
                paddingTop: "60px", // Khoảng cách để tránh navbar
                paddingLeft: 2,
                paddingRight: 2,
                paddingBottom: 0, // Loại bỏ padding bottom
              }}
            >
              <Outlet />
            </Box>
          </Box>
        </ThemeProvider>
      </ToggledContext.Provider>
    </ColorModeContext.Provider>
  );
}
export default App;