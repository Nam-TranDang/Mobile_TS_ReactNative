import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import COLORS from "../constants/colors";
import { API_URL } from "../constants/api";
import { formatMemberSince, formatPublishDate } from "../lib/utils";
import { useAuthStore } from "../store/authStore";
import { sleep } from "../lib/helper";
import styles from "../assets/styles/profile.styles";

export default function UserProfile() {
  const { userId } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { token } = useAuthStore();
  const router = useRouter();

  const fetchUserData = async () => {
    try {
      setIsLoading(true);

      // Fetch user data
      const userResponse = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await userResponse.json();
      setUser(userData);

      // Fetch user's books using the existing endpoint with user filter
      const booksResponse = await fetch(`${API_URL}/books?user=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!booksResponse.ok) {
        throw new Error("Failed to fetch user books");
      }

      const booksData = await booksResponse.json();
      setBooks(booksData.books || []);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await sleep(500);
    await fetchUserData();
    setRefreshing(false);
  };

  const renderBookItem = ({ item }) => {
    // Kiểm tra dữ liệu trước khi render
    if (!item || !item._id) {
      console.warn("Book item is invalid:", item);
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.bookItem}
        onPress={() =>
          router.push({
            pathname: "/bookdetail",
            params: { bookId: item._id },
          })
        }
      >
        <Image
          source={{ uri: item.image || "" }}
          style={styles.bookImage}
          placeholder="https://via.placeholder.com/150x200?text=No+Image"
        />
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.title || "Untitled"}</Text>
          <View style={styles.ratingContainer}>
            {renderRatingStars(item.rating || 0)}
          </View>
          <Text style={styles.bookCaption} numberOfLines={2}>
            {item.caption || "No description available"}
          </Text>
          <Text style={styles.publishDate}>
            {item.createdAt
              ? formatPublishDate(item.createdAt)
              : "Unknown date"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={[styles.header, { marginBottom: 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
      </View>

      {/* User Profile Header */}
      {user && (
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: user.profileImage }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {user.createdAt && (
              <Text style={styles.memberSince}>
                Joined {formatMemberSince(user.createdAt)}
              </Text>
            )}
            <TouchableOpacity
              style={styles.userReportButton}
              onPress={() => router.push({
                pathname: "/(tabs)/report",
                params: { id: userId, type: 'User' }
              })}
            >
              <Ionicons name="flag-outline" size={20} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* User's Books */}
      <View style={styles.booksHeader}>
        <Text style={styles.booksTitle}>Recommendations</Text>
        <Text style={styles.booksCount}>{books.length} books</Text>
      </View>

      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={50}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>No recommendations yet</Text>
          </View>
        }
      />
    </View>
  );
}
