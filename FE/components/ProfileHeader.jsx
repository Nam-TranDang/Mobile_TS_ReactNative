import { Image } from "expo-image";
import { Text, View, TouchableOpacity } from "react-native";
import styles from "../assets/styles/profile.styles";
import { formatMemberSince } from "../lib/utils";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";

export default function ProfileHeader() {
  const { user } = useAuthStore();
  const router = useRouter();

  if (!user) return null;

  return (
    <View style={styles.profileHeader}>
      <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
      <View style={styles.profileInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.memberSince}>
          Joined {formatMemberSince(user.createdAt)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push("/(tabs)/editprofile")}
      >
        <Ionicons name="pencil-outline" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}