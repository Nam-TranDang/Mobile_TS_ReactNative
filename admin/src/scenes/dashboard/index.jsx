import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Header,
  StatBox,
} from "../../components";
import {
  Email,
  PersonAdd,
  PointOfSale,
  Traffic,
  ReportProblemTwoTone,
  ImportContactsTwoTone,
  Diversity3TwoTone,
  PermIdentityTwoTone,
} from "@mui/icons-material";
import { tokens } from "../../theme";
import { mockTransactions } from "../../data/mockData";

function Dashboard() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isXlDevices = useMediaQuery("(min-width: 1260px)");
  const isMdDevices = useMediaQuery("(min-width: 724px)");
  const isXsDevices = useMediaQuery("(max-width: 436px)");
  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between">
        <Header title="Trang tổng quan" subtitle="Trang tổng quan tung tung tung sahur" />
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns={
          isXlDevices
            ? "repeat(12, 1fr)"
            : isMdDevices
            ? "repeat(6, 1fr)"
            : "repeat(3, 1fr)"
        }
        gridAutoRows="140px"
        gap="20px"
      >
        {/* Statistic Items */}
        <Box
          gridColumn="span 3"
          bgcolor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="11,361"
            subtitle="Báo cáo"
            progress="0.75"
            increase="+14%"
            icon={
              <ReportProblemTwoTone
                sx={{ color: colors.redAccent[600], fontSize: "50px" , marginBottom: "-23px"}}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="431,225"
            subtitle="Số lượng bài viết"
            progress="0.50"
            increase="+21%"
            icon={
              <ImportContactsTwoTone
                sx={{ color: colors.greenAccent[600],  fontSize: "50px" , marginBottom: "-23px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="32,441"
            subtitle="Số lượng người dùng"
            progress="0.30"
            increase="+5%"
            icon={
              <Diversity3TwoTone
                sx={{ color: colors.blueAccent[600],  fontSize: "50px" , marginBottom: "-23px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="1,325,134"
            subtitle="Người truy cập"
            progress="0.80"
            increase="+43%"
            icon={
              <PermIdentityTwoTone
                sx={{ color: "#76ff03",  fontSize: "50px" , marginBottom: "-23px" }}
              />
            }
          />
        </Box>

        {/* ---------------- Row 2 ---------------- */}

        {/* Line Chart */}
        <Box
          gridColumn={isXlDevices ? "span 8" : "span 3"}
          gridRow="span 4"
          bgcolor={colors.primary[400]}
          overflow="auto"
        >
          <Box borderBottom={`4px solid ${colors.primary[500]}`} p="15px">
            <Typography color={colors.gray[100]} variant="h5" fontWeight="600">
              Báo cáo gần đây
            </Typography>
          </Box>

          {mockTransactions.map((transaction, index) => (
            <Box
              key={`${transaction.txId}-${index}`}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              borderBottom={`4px solid ${colors.primary[500]}`}
              p="15px"
            >
              <Box>
                <Typography
                  color={colors.greenAccent[500]}
                  variant="h5"
                  fontWeight="600"
                >
                  {transaction.txId}
                </Typography>
                <Typography color={colors.gray[100]}>
                  {transaction.user}
                </Typography>
              </Box>
              <Typography color={colors.gray[100]}>
                {transaction.date}
              </Typography>
                  <Typography color={colors.gray[100]}>
                  <div style={{ color: colors.redAccent[600], fontWeight : "bold"  }}>Người bị báo cáo</div>
                </Typography>
                <Typography color={colors.gray[100]}>
                  <div>Trạng thái</div>
                </Typography>
              <button style={{
                backgroundColor: colors.greenAccent[600],
                color: colors.gray[100],
                padding: "5px 10px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer"
              }}>
                Hành động
              </button>
            </Box>
          ))}
        </Box>

        {/* Transaction Data */}
        <Box
          gridColumn={isXlDevices ? "span 4" : "span 3"}
          gridRow="span 4"
          bgcolor={colors.primary[400]}
          overflow="auto"
        >
          <Box borderBottom={`4px solid ${colors.primary[500]}`} p="15px">
            <Typography color={colors.gray[100]} variant="h5" fontWeight="600">
              Bài viết gần đây
            </Typography>
          </Box>

          {mockTransactions.map((transaction, index) => (
            <Box
              key={`${transaction.txId}-${index}`}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              borderBottom={`4px solid ${colors.primary[500]}`}
              p="15px"
            >
              <Box>
                <Typography
                  color={colors.greenAccent[500]}
                  variant="h5"
                  fontWeight="600"
                >
                  {transaction.txId}
                </Typography>
                <Typography color={colors.gray[100]}>
                  {transaction.user}
                </Typography>
              </Box>
              <Typography color={colors.gray[100]}>
                {transaction.date}
              </Typography>
              <button style={{
                backgroundColor: colors.greenAccent[500],
                color: colors.gray[100],
                padding: "5px 10px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer"
              }}>
                Xem ngay
              </button>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;
