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
import { useLanguage } from "../../context/LanguageContext";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();
  const { t, currentLanguage, changeLanguage } = useLanguage();

  // Function to handle resetting password
  const handleSend = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert(t("login.erro"), t("login.p1"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t("login.erro"),t("login.valid"));
      return;
    }

    if (!verifyCode || !newPassword || !confirmNewPassword) {
      Alert.alert(t("login.erro"), t("login.erro16"));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert(t("login.erro"), t("login.p8"));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t("login.erro"), t("login.erro7"));
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
        Alert.alert(t("login.sus"),t("login.p19"), [
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
      Alert.alert(t("login.erro"), t("login.p1"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", t("login.p20"));
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
          t("login.sus"),
          t("login.p21")
        );
      } else {
        Alert.alert(t("login.erro"), data.message || t("login.p22"));
      }
    } catch (error) {
      console.error("Send code error:", error);
      Alert.alert(t("login.erro"), t("login.p23"));
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
            <Text style={styles.title}>{t("login.fp")}</Text>
            <Text style={styles.subtitle}>
              {t("login.p13")}
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
                  placeholder={t("login.p1")}
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
              <Text style={styles.label}>{t("login.code")}</Text>
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
                    placeholder={t("login.p11")}
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
                    <Text style={styles.buttonText}>{t("login.send")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* NEW PASSWORD INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("login.newpassword")}</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("login.p4")}
                  placeholderTextColor={COLORS.placeholderText}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* CONFIRM NEW PASSWORD INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("login.p5")}</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("login.p24")}
                  placeholderTextColor={COLORS.placeholderText}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>               
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
                <Text style={styles.buttonText}>{t("login.rsp")}</Text>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("login.p12")}</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.link}>{t("login.title")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
