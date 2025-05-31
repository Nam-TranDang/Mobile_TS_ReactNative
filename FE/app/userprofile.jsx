import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import styles from "../assets/styles/userprofile.styles";

const { width } = Dimensions.get("window");
const imageSize = (width - 48) / 3; // 3 columns với padding

export default function UserProfile() {
  const { userId } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  const { token, user: currentUser } = useAuthStore();
  const router = useRouter();
  const isOwnProfile = currentUser?.id === userId;

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
      setFollowersCount(userData.followersCount || 0);
      setFollowingCount(userData.followingCount || 0);
      setPostsCount(userData.postsCount || 0);

      // Check if current user is following this user
      if (!isOwnProfile) {
        setIsFollowing(userData.followers?.includes(currentUser?.id) || false);
      }

      // Fetch user's books
      const booksResponse = await fetch(`${API_URL}/books?user=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!booksResponse.ok) {
        throw new Error("Failed to fetch user books");
      }

      const booksData = await booksResponse.json();
      const userBooks = booksData.books || [];
      setBooks(userBooks);
      setPostsCount(userBooks.length);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const endpoint = isFollowing
        ? `${API_URL}/users/${userId}/follow`
        : `${API_URL}/users/${userId}/follow`;

      const method = isFollowing ? "DELETE" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      Alert.alert("Error", "Failed to follow/unfollow user");
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

  const renderBookItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.gridItem,
        {
          marginRight: (index + 1) % 3 === 0 ? 0 : 8,
          marginBottom: 8,
        },
      ]}
      onPress={() =>
        router.push({
          pathname: "/bookdetail",
          params: { bookId: item._id },
        })
      }
    >
      <Image
        source={{ uri: item.image }}
        style={styles.gridImage}
        contentFit="cover"
      />
      <View style={styles.ratingOverlay}>
        <Ionicons name="star" size={12} color="#FFD700" />
        <Text style={styles.ratingText}>{item.rating}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.profileContainer}>
      {/* Profile Info Section */}
      <View style={styles.profileInfoSection}>
        <Image
          source={{ uri: user?.profileImage }}
          style={styles.profileImage}
        />

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>

          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              router.push({
                pathname: "/followers",
                params: { userId, type: "followers" },
              })
            }
          >
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              router.push({
                pathname: "/followers",
                params: { userId, type: "following" },
              })
            }
          >
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Details */}
      <View style={styles.userDetails}>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.memberSince}>
          Member since {formatMemberSince(user?.createdAt)}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {isOwnProfile ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/(tabs)/editprofile")}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={handleFollow}
            >
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                ]}
              >
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => {
                // Navigate to message screen
                Alert.alert("Message", "Message feature coming soon!");
              }}
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reportButton}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/report",
                  params: { id: userId, type: "User" },
                })
              }
            >
              <Ionicons
                name="flag-outline"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Books Grid Header */}
      <View style={styles.gridHeader}>
        <Ionicons name="grid-outline" size={24} color={COLORS.textPrimary} />
        <Text style={styles.gridHeaderText}>Books</Text>
      </View>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user?.username}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item._id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        style={styles.booksList} // THÊM STYLE CHO FLATLIST
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={styles.booksRow} // THÊM STYLE CHO MỖI HÀNG
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
            <Text style={styles.emptyText}>No books shared yet</Text>
          </View>
        }
      />
    </View>
  );
}
