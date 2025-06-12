import { Box, Typography, CircularProgress, GlobalStyles } from "@mui/material"
import { keyframes } from "@mui/system"
import logo from "../../assets/images/logo.png"

// Định nghĩa các animation keyframes
const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
`

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`

const fadeInOut = keyframes`
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
`

const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`

const LoadingPage = ({ message = "Đang đăng nhập..." }) => {
  return (
    <>
      {/* CSS Reset để loại bỏ thanh cuộn */}
      <GlobalStyles
        styles={{
          "*": {
            margin: 0,
            padding: 0,
            boxSizing: "border-box",
          },
          "html, body": {
            margin: 0,
            padding: 0,
            overflow: "hidden",
            height: "100%",
            width: "100%",
          },
          "#root": {
            margin: 0,
            padding: 0,
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
          },
        }}
      />

      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          overflow: "hidden", // Ngăn thanh cuộn
        }}
      >
        {/* Background animated circles - Tăng kích thước gấp 3 */}
        <Box
          sx={{
            position: "absolute",
            width: "600px", // Tăng từ 200px lên 600px
            height: "600px", // Tăng từ 200px lên 600px
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.1)",
            animation: `${ripple} 3s infinite`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: "600px", // Tăng từ 200px lên 600px
            height: "600px", // Tăng từ 200px lên 600px
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.1)",
            animation: `${ripple} 3s infinite 1s`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: "600px", // Tăng từ 200px lên 600px
            height: "600px", // Tăng từ 200px lên 600px
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.1)",
            animation: `${ripple} 3s infinite 2s`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Main content container - Đảm bảo nằm chính giữa */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute", // Thay đổi từ relative sang absolute
            top: "50%", // Đặt ở giữa theo chiều dọc
            left: "50%", // Đặt ở giữa theo chiều ngang
            transform: "translate(-50%, -50%)", // Căn chỉnh chính xác vào giữa
            zIndex: 10,
            width: "100%", // Đảm bảo chiều rộng đầy đủ
          }}
        >
          {/* Logo container với hiệu ứng - Tăng kích thước */}
          <Box
            sx={{
              position: "relative",
              mb: 6, // Tăng margin bottom
              animation: `${float} 3s ease-in-out infinite`,
            }}
          >
            {/* Outer glow ring - Tăng kích thước */}
            <Box
              sx={{
                position: "absolute",
                top: "-60px", // Tăng từ -20px lên -60px
                left: "-60px", // Tăng từ -20px lên -60px
                right: "-60px", // Tăng từ -20px lên -60px
                bottom: "-60px", // Tăng từ -20px lên -60px
                borderRadius: "50%",
                border: "6px solid rgba(255, 255, 255, 0.3)", // Tăng từ 2px lên 6px
                animation: `${rotate} 4s linear infinite`,
              }}
            />

            {/* Inner glow ring - Tăng kích thước */}
            <Box
              sx={{
                position: "absolute",
                top: "-30px", // Tăng từ -10px lên -30px
                left: "-30px", // Tăng từ -10px lên -30px
                right: "-30px", // Tăng từ -10px lên -30px
                bottom: "-30px", // Tăng từ -10px lên -30px
                borderRadius: "50%",
                border: "3px solid rgba(255, 255, 255, 0.5)", // Tăng từ 1px lên 3px
                animation: `${rotate} 2s linear infinite reverse`,
              }}
            />

            {/* Logo background circle - Tăng kích thước */}
            <Box
              sx={{
                width: "360px", // Tăng từ 120px lên 360px
                height: "360px", // Tăng từ 120px lên 360px
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
                animation: `${pulse} 2s ease-in-out infinite`,
              }}
            >
              <img
                src={logo || "/placeholder.svg?height=180&width=180"}
                alt="Logo"
                style={{
                  width: "180px", // Tăng từ 60px lên 180px
                  height: "180px", // Tăng từ 60px lên 180px
                  borderRadius: "8px",
                  objectFit: "cover",
                }}
              />
            </Box>
          </Box>

          {/* Loading spinner - Tăng kích thước */}
          <Box
            sx={{
              position: "relative",
              mb: 4, // Tăng margin bottom
            }}
          >
            <CircularProgress
              size={80} // Tăng từ 60px lên 80px
              thickness={4} // Tăng từ 3px lên 4px
              sx={{
                color: "rgba(255, 255, 255, 0.8)",
                animation: `${rotate} 1s linear infinite`,
              }}
            />
            <CircularProgress
              size={80} // Tăng từ 60px lên 80px
              thickness={4} // Tăng từ 3px lên 4px
              variant="determinate"
              value={25}
              sx={{
                color: "rgba(255, 255, 255, 0.3)",
                position: "absolute",
                top: 0,
                left: 0,
                animation: `${rotate} 2s linear infinite reverse`,
              }}
            />
          </Box>

          {/* Loading text - Tăng kích thước */}
          <Typography
            variant="h5"
            sx={{
              color: "white",
              fontWeight: "600",
              fontSize: "1.5rem", // Tăng từ 1.2rem lên 1.5rem
              textAlign: "center",
              animation: `${fadeInOut} 2s ease-in-out infinite`,
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
              marginTop: "16px", // Thêm margin top
            }}
          >
            {message}
          </Typography>

          {/* Loading dots - Tăng kích thước */}
          <Box
            sx={{
              display: "flex",
              gap: "12px", // Tăng từ 8px lên 12px
              mt: 3, // Tăng margin top
            }}
          >
            {[0, 1, 2].map((index) => (
              <Box
                key={index}
                sx={{
                  width: "12px", // Tăng từ 8px lên 12px
                  height: "12px", // Tăng từ 8px lên 12px
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  animation: `${fadeInOut} 1.5s ease-in-out infinite`,
                  animationDelay: `${index * 0.3}s`,
                }}
              />
            ))}
          </Box>

          {/* Progress bar - Tăng kích thước */}
          <Box
            sx={{
              width: "300px", // Tăng từ 200px lên 300px
              height: "6px", // Tăng từ 4px lên 6px
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "3px", // Tăng từ 2px lên 3px
              mt: 5, // Tăng margin top
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: "90px", // Tăng từ 60px lên 90px
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)",
                animation: `${keyframes`
                  0% { transform: translateX(-150px); }
                  100% { transform: translateX(450px); }
                `} 2s ease-in-out infinite`,
              }}
            />
          </Box>
        </Box>

        {/* Bottom text */}
        <Box
          sx={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            width: "100%", // Đảm bảo chiều rộng đầy đủ
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "1rem", // Tăng từ 0.9rem lên 1rem
              animation: `${fadeInOut} 3s ease-in-out infinite`,
            }}
          >
            Thư viện tan
          </Typography>
        </Box>
      </Box>
    </>
  )
}

export default LoadingPage
