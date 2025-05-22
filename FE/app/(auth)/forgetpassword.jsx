import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import styles from "../../assets/styles/forgetpassword.styles";
import COLORS from "../../constants/colors";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const router = useRouter();

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email!");
      return;
    }
    // Kiểm tra định dạng email đơn giản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ!");
      return;
    }
    // Kiểm tra mật khẩu mới và nhập lại mật khẩu
    if (!newPassword || !confirmNewPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ mật khẩu mới!");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Lỗi", "Mật khẩu nhập lại không khớp!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "http://192.168.100.184:3000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      setIsLoading(false);

      if (response.ok) {
        Alert.alert(
          "Thành công",
          "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi tới email của bạn."
        );
        router.back();
      } else {
        Alert.alert("Lỗi", data.message || "Email không hợp lệ!");
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại sau!");
    }
  };

  const handleSendVerifyCode = async () => {
    if (!email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email trước!");
      return;
    }
    setIsSendingCode(true);
    try {
      const response = await fetch(
        "http://<YOUR_BACKEND_URL>/api/auth/send-verify-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      setIsSendingCode(false);
      if (response.ok) {
        Alert.alert("Thành công", "Mã xác thực đã được gửi về email của bạn!");
      } else {
        Alert.alert("Lỗi", data.message || "Không thể gửi mã xác thực!");
      }
    } catch (error) {
      setIsSendingCode(false);
      Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại sau!");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Forget Password</Text>
            <Text style={styles.subtitle}>
              Please enter your email to search for your account.
            </Text>
          </View>
          {/* FORM */}
          <View style={styles.formContainer}>
            {/* EMAIL INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.placeholderText}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* VERIFY CODE INPUT + SEND BUTTON */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification code</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Ô nhập mã xác thực */}
                <View
                  style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}
                >
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter verification code"
                    placeholderTextColor={COLORS.placeholderText}
                    value={verifyCode}
                    onChangeText={setVerifyCode}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                  />
                </View>
                {/* Nút Send */}
                <TouchableOpacity
                  style={[styles.buttonSend]}
                  onPress={handleSendVerifyCode}
                  disabled={isSendingCode || !email}
                >
                  {isSendingCode ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* NEW PASSWORD INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New password</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.placeholderText}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* CONFIRM NEW PASSWORD INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter new password</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password again"
                  placeholderTextColor={COLORS.placeholderText}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* SEND BUTTON */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSend}
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Change Password</Text>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Remembered Password?</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.link}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
