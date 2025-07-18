import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Platform, Linking, Alert } from "react-native"
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useLocalSearchParams, router } from 'expo-router'
import { useEffect, useState } from 'react'

const SuspendedPage = () => {
  const params = useLocalSearchParams()
  const [suspensionInfo, setSuspensionInfo] = useState(null)
  
  const defaultLogo = require("../../assets/images/logo.png")

  useEffect(() => {
    if (params.suspensionInfo) {
      try {
        const info = JSON.parse(params.suspensionInfo)
        setSuspensionInfo(info)
      } catch (error) {
        console.error('Error parsing suspension info:', error)
      }
    }
  }, [params.suspensionInfo]) // Chỉ theo dõi suspensionInfo, không phải toàn bộ params

  const handleBackPress = () => {
    router.replace('/(auth)')
  }

  const handleEmailPress = () => {
    const email = "thuvientanvo@enticorp.com"
    const subject = "Yêu cầu hỗ trợ tài khoản bị tạm khóa"
    const body = `Xin chào đội ngũ Thư viện tan vỡ,

Tôi muốn liên hệ về việc tài khoản của tôi bị tạm khóa.
${suspensionInfo ? `
Thông tin tạm khóa:
- Thời gian kết thúc: ${suspensionInfo.endDate || 'Không xác định'}
- Lý do: ${suspensionInfo.reason || 'Không có thông tin'}
` : ''}
Cảm ơn!`

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(mailtoUrl)
        } else {
          Alert.alert("Không thể mở ứng dụng email", "Vui lòng gửi email thủ công đến: thuvientanvo@enticorp.com")
        }
      })
      .catch((err) => {
        console.error("Error opening email:", err)
        Alert.alert("Lỗi", "Không thể mở ứng dụng email. Vui lòng thử lại sau.")
      })
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header với nút back */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Nội dung chính */}
      <View style={styles.content}>
        {/* Icon cảnh báo */}

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={defaultLogo} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Tiêu đề */}
        <Text style={styles.title}>Tài khoản bị tạm khóa</Text>
        <View style={styles.alertIconContainer}>
          <MaterialIcons name="error-outline" size={24} color="#EF4444" />
        </View>

        {/* Mô tả với thông tin chi tiết nếu có */}
        <Text style={styles.description}>
          Tài khoản của bạn hiện đang bị tạm khóa. 
          {suspensionInfo && suspensionInfo.endDate && (
            ` Thời gian kết thúc: ${new Date(suspensionInfo.endDate).toLocaleDateString('vi-VN')}.`
          )}
          {' '}Vui lòng liên hệ với đội ngũ hỗ trợ để được giải quyết.
        </Text>

        {/* Hiển thị lý do tạm khóa nếu có */}
        {suspensionInfo && suspensionInfo.reason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonTitle}>Lý do tạm khóa:</Text>
            <Text style={styles.reasonText}>{suspensionInfo.reason}</Text>
          </View>
        )}

        {/* Thông tin liên hệ */}
        <View style={styles.contactContainer}>
          <Text style={styles.contactTitle}>Liên hệ hỗ trợ</Text>
          <Text style={styles.teamName}>Dev Thư viện tan vỡ</Text>

          <View style={styles.emailContainer}>
            <Ionicons name="mail" size={20} color="#6366F1" />
            <Text style={styles.emailText}>thuvientanvo@enticorp.com</Text>
          </View>
        </View>

        {/* Nút gửi email */}
        <TouchableOpacity style={styles.emailButton} onPress={handleEmailPress}>
          <Ionicons name="mail" size={20} color="#FFFFFF" style={styles.emailButtonIcon} />
          <Text style={styles.emailButtonText}>Gửi email hỗ trợ</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  alertIconContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 50,
  },
  logoContainer: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 120,
    height: 110,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "JetBrainsMono-Medium",
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  reasonContainer: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: "#7F1D1D",
    lineHeight: 20,
  },
  contactContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6366F1",
    textAlign: "center",
    marginBottom: 16,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emailText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
    fontFamily: "monospace",
  },
  emailButton: {
    backgroundColor: "#6366F1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emailButtonIcon: {
    marginRight: 8,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})

export default SuspendedPage
