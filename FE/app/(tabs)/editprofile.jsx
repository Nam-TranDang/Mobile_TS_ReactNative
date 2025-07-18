import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import styles from "../../assets/styles/editprofile.styles";
import COLORS from "../../constants/colors";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { useLanguage } from "../../context/LanguageContext";

export default function EditProfile() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [username, setUsername] = useState("");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t, currentLanguage, changeLanguage } = useLanguage();
  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setImage(user.profileImage || null);
    }
  }, [user]);

  const MAX_IMAGE_SIZE = 7 * 1024 * 1024; // 7MB

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(t("profile.p1"));
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled) {
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (fileInfo.size > MAX_IMAGE_SIZE) {
          Alert.alert(
            t("profile.im1"),
            t("profile.im2")
          );
          return;
        }
        setImage(result.assets[0].uri);

        // if base64 is provided
        if (result.assets[0].base64) {
          setImageBase64(result.assets[0].base64);
        } else {
          // otherwise, convert the image to base64
          const base64 = await FileSystem.readAsStringAsync(
            result.assets[0].uri,
            {
              encoding: FileSystem.EncodingType.Base64,
            }
          );
          setImageBase64(base64);
        }
      }
    } catch (error) {
      console.error("Error picking image: ", error);
      Alert.alert("Error picking image");
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      Alert.alert("Error",t("profile.a1"));
      return;
    }

    if (showPasswordSection) {
      if (!currentPassword) {
        Alert.alert("Error", t("profile.a2"));
        return;
      }
      if (!password) {
        Alert.alert("Error", t("profile.a3"));
        return;
      }
      if (!confirmPassword) {
        Alert.alert("Error", t("profile.a4"));
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert(
          t("profile.error"),
          t("profile.a5")
        );
        return;
      }
      //Tránh chờ BE phản hồi lỗi này, giảm tải server
      if (password.length < 6) {
        Alert.alert(t("profile.error"), t("profile.a6"));
        return;
      }
    }

    try {
      setIsLoading(true);

      let imageDataUrl = null;
      if (imageBase64) {
        const uriParts = image.split(".");
        const fileType = uriParts[uriParts.length - 1];
        const imageType = fileType
          ? `image/${fileType.toLowerCase()}`
          : "image/jpeg";
        imageDataUrl = `data:${imageType};base64,${imageBase64}`;
      }

      const userId = user.id;
      if (!userId) {
        throw new Error("User ID not found");
      }

      const requestBody = {
        username,
        ...(showPasswordSection && {
          currentPassword,
          password,
        }),
        ...(imageDataUrl && { profileImage: imageDataUrl }),
      };

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || t("profile.a7"));
      }

      Alert.alert(
        t("profile.success"),
        t("profile.a8"),
        [
          {
            text: "OK",
            onPress: async () => {
              await useAuthStore.getState().logout();
              router.replace("/(auth)");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", error.message || t("profile.a9"));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordSection = () => {
    setShowPasswordSection(!showPasswordSection);
    // Reset các trường mật khẩu khi ẩn phần đổi mật khẩu
    if (showPasswordSection) {
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("(tabs)/profile")}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("profile.editprofile")}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: image || user?.profileImage }}
                style={styles.profileImage}
              />
              <TouchableOpacity
                style={styles.cameraIconContainer}
                onPress={pickImage}
              >
                <Ionicons name="camera" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* Username field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("profile.username")}</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder= {t("profile.usernameplaceholder")}
                  placeholderTextColor={COLORS.placeholderText}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Email field */}
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
                  value={user?.email || ""}
                  editable={false}
                  placeholderTextColor={COLORS.placeholderText}
                />
              </View>
            </View>

            {/* Button to show/hide password section */}
            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={togglePasswordSection}
            >
              <Text style={styles.changePasswordButtonText}>
                {showPasswordSection
                  ? t("profile.changep")
                  : t("profile.changep")}
              </Text>
              <Ionicons
                name={
                  showPasswordSection
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={20}
                color={COLORS.white}
              />
            </TouchableOpacity>

            {showPasswordSection && (
              <>
                {/* Current Password field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t("profile.currentp")}</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={t("profile.p4")}
                      placeholderTextColor={COLORS.placeholderText}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      <Ionicons
                        name={
                          showCurrentPassword
                            ? "eye-outline"
                            : "eye-off-outline"
                        }
                        size={20}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t("profile.newp")}</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={t("profile.p5")}
                      placeholderTextColor={COLORS.placeholderText}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Ionicons
                        name={
                          showNewPassword ? "eye-outline" : "eye-off-outline"
                        }
                        size={20}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm New Password field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t("profile.cnfp")}</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={t("profile.p6")}
                      placeholderTextColor={COLORS.placeholderText}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-outline"
                            : "eye-off-outline"
                        }
                        size={20}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>{t("profile.save")}</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
