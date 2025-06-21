import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "../../assets/styles/login.styles";
import COLORS from "../../constants/colors";
import { useAuthStore } from "./../../store/authStore";
import { useLanguage } from "../../context/LanguageContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, login, isCheckingAuth } = useAuthStore();
  const router = useRouter();
  const { t, currentLanguage, changeLanguage } = useLanguage();

  const handleLogin = async () => {
    const result = await login(email, password);

    if (!result.success) {
      if (result.isSuspended) {
        // Redirect đến trang suspended với thông tin
        router.push({
          pathname: '/(auth)/suspended',
          params: {
            suspensionInfo: JSON.stringify(result.suspensionInfo)
          }
        });
      } else {
        Alert.alert("Error", result.error);
      }
    }
  };

  if (isCheckingAuth) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* illusration */}
        <View style={styles.topIllustration}>
          <View style={styles.cardHeader}>
            <Text style={styles.illustrationText}>
              {t("login.p15")}
            </Text>
          </View>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.illustrationImage}
            resizeMode="contain"
            bottom={30}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.formContainer}>
            {/*Email */}
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
                />
              </View>
            </View>

            {/*Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("login.password")}</Text>
              <View style={styles.inputContainer}>
                {/*Left icon */}
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                {/*Input */}
                <TextInput
                  style={styles.input}
                  placeholder={t("login.p2")}
                  placeholderTextColor={COLORS.placeholderText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginBottom: 16 }}
              onPress={() => {
                router.push("/(auth)/forgetpassword");
              }}
            >
              <Text style={[styles.link, { fontSize: 14 }]}>
                {t("login.fp")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t("login.title")}</Text>
              )}
            </TouchableOpacity>

            {/*Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("login.p10")}</Text>
              <Link href="../(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>{t("login.signup")}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
