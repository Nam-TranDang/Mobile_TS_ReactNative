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
import { API_URL } from "../../constants/api";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();

  // Function to handle resetting password
  const handleSend = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Invalid email format!");
      return;
    }

    if (!verifyCode || !newPassword || !confirmNewPassword) {
      Alert.alert("Error", "Please enter verification code and new password!");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", "Passwords don't match!");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters!");
      return;
    }

    setIsLoading(true);
    try {
      // Call the reset-password API endpoint
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: verifyCode,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Your password has been successfully changed!", [
          {
            text: "Login",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to reset password!");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Error", "Something went wrong. Please try again later!");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to send verification code
  const handleSendVerifyCode = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email first!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Invalid email format!");
      return;
    }

    setIsSendingCode(true);
    try {
      // Call the forgot-password API endpoint
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setCodeSent(true);
        Alert.alert(
          "Success",
          "If your email exists in our system, a verification code has been sent to your email."
        );
      } else {
        Alert.alert("Error", data.message || "Could not send verification code!");
      }
    } catch (error) {
      console.error("Send code error:", error);
      Alert.alert("Error", "Something went wrong. Please try again later!");
    } finally {
      setIsSendingCode(false);
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
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive a verification code
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
                  editable={!codeSent}
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
              <Text style={styles.label}>Confirm new password</Text>
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

            {/* RESET PASSWORD BUTTON */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSend}
              disabled={
                isLoading ||
                !email ||
                !verifyCode ||
                !newPassword ||
                !confirmNewPassword
              }
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password?</Text>
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
