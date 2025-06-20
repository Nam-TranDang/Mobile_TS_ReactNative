// app/settings.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/settings.styles";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");

  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("appLanguage");
        if (savedLanguage) {
          setCurrentLanguage(savedLanguage);
        }
      } catch (error) {
        console.error("Error loading language preference:", error);
      }
    };

    loadLanguagePreference();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: () => {
          logout();
          router.replace("/(auth)");
        },
        style: "destructive",
      },
    ]);
  };

  const showDeleteAccountConfirmation = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Account",
          onPress: () => router.push("/deleteaccount"),
          style: "destructive",
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/(tabs)/editprofile")}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.settingText}>Edit Profile</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name="language-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Language</Text>
                <Text style={styles.settingSubtext}>
                  {currentLanguage === "en" ? "English" : "Tiếng Việt"}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.settingText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={showDeleteAccountConfirmation}
          >
            <View style={styles.settingContent}>
              <View style={[styles.settingIconContainer, styles.dangerIcon]}>
                <Ionicons name="trash-outline" size={22} color={COLORS.red} />
              </View>
              <Text style={[styles.settingText, { color: COLORS.red }]}>
                Delete Account
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLanguageModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.languageModalContent}>
                <View style={styles.languageModalHeader}>
                  <Text style={styles.languageModalTitle}>Select Language</Text>
                  <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Tùy chọn tiếng Anh */}
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    currentLanguage === "en" && styles.selectedLanguageOption,
                  ]}
                  onPress={() => {
                    setCurrentLanguage("en");
                    // Lưu vào AsyncStorage và cập nhật ngôn ngữ toàn app
                    AsyncStorage.setItem("appLanguage", "en");
                    // Đóng modal
                    setShowLanguageModal(false);
                  }}
                >
                  <View style={styles.languageFlag}>
                    <Text style={styles.flagEmoji}>🇺🇸</Text>
                  </View>
                  <Text style={styles.languageName}>English</Text>
                  {currentLanguage === "en" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>

                {/* Tùy chọn tiếng Việt */}
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    currentLanguage === "vi" && styles.selectedLanguageOption,
                  ]}
                  onPress={() => {
                    setCurrentLanguage("vi");
                    // Lưu vào AsyncStorage và cập nhật ngôn ngữ toàn app
                    AsyncStorage.setItem("appLanguage", "vi");
                    // Đóng modal
                    setShowLanguageModal(false);
                  }}
                >
                  <View style={styles.languageFlag}>
                    <Text style={styles.flagEmoji}>🇻🇳</Text>
                  </View>
                  <Text style={styles.languageName}>Tiếng Việt</Text>
                  {currentLanguage === "vi" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
