import { Text, TouchableOpacity, Alert } from "react-native";
import { useAuthStore } from "../store/authStore";
import styles from "../assets/styles/profile.styles";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";



export default function LogoutButton() {
  const { logout } = useAuthStore();
  const { t, currentLanguage, changeLanguage } = useLanguage();

  const confirmLogout = () => {
    Alert.alert(  t("login.logout") , t("login.logoutcnf"), [
      { text: t("login.cancel"), style: t("login.cancel") },
      { text: t("login.logout"), onPress: () => logout(), style: "destructive" },
    ]);
  };

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
      <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
      <Text style={styles.logoutText}>{t("login.logout")}</Text>
    </TouchableOpacity>
  );
}
