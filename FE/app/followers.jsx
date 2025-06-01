import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import COLORS from "../constants/colors";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/authStore";
import styles from "../assets/styles/followers.styles"; // IMPORT STYLES

export default function FollowersScreen() {
  const { userId, type } = useLocalSearchParams(); // type: 'followers' or 'following'
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [userId, type]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() =>
        router.push({
          pathname: "/userprofile",
          params: { userId: item._id },
        })
      }
    >
      <Image
        source={{ uri: item.profileImage }}
        style={styles.userAvatar}
        placeholder="https://via.placeholder.com/40x40?text=User"
      />
      <Text style={styles.username}>{item.username}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === "followers" ? "Followers" : "Following"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={50}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>
              {type === "followers"
                ? "No followers yet"
                : "Not following anyone yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}
