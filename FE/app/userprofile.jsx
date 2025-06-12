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
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

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
  const [isFollowLoading, setIsFollowLoading] = useState(false); // THÊM TRẠNG THÁI TẢI CHO FOLLOW

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

      // SỬA: Sử dụng length của mảng thay vì virtual field
      const actualFollowersCount = userData.followers
        ? userData.followers.length
        : 0;
      const actualFollowingCount = userData.following
        ? userData.following.length
        : 0;

      setFollowersCount(actualFollowersCount);
      setFollowingCount(actualFollowingCount);

      // Check follow status - PHƯƠNG PHÁP MỚI
      if (!isOwnProfile && currentUser?.id) {
        // Fetch current user data để lấy danh sách following mới nhất
        try {
          const currentUserResponse = await fetch(
            `${API_URL}/users/${currentUser.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (currentUserResponse.ok) {
            const currentUserData = await currentUserResponse.json();
            // Kiểm tra xem userId có trong danh sách following của current user không
            const isUserFollowing =
              currentUserData.following &&
              Array.isArray(currentUserData.following) &&
              currentUserData.following.some((followedUser) => {
                // Kiểm tra cả trường hợp ID string và object
                if (typeof followedUser === "string") {
                  return followedUser === userId;
                } else if (
                  typeof followedUser === "object" &&
                  followedUser._id
                ) {
                  return followedUser._id === userId;
                }
                return false;
              });

            // console.log("Following check result:", {
            //   currentUserFollowing: currentUserData.following,
            //   targetUserId: userId,
            //   isFollowing: isUserFollowing,
            // });

            setIsFollowing(isUserFollowing);
          }
        } catch (followCheckError) {
          // console.error("Error checking follow status:", followCheckError);
          // Fallback: kiểm tra từ userData.followers
          const fallbackCheck =
            userData.followers &&
            Array.isArray(userData.followers) &&
            userData.followers.some((follower) => {
              if (typeof follower === "string") {
                return follower === currentUser.id;
              } else if (typeof follower === "object" && follower._id) {
                return follower._id === currentUser.id;
              }
              return false;
            });
          setIsFollowing(fallbackCheck);
        }
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
      // console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (isFollowLoading) return; // Tránh multiple calls

    try {
      setIsFollowLoading(true);

      // Lưu trạng thái hiện tại để tránh confusion
      const currentFollowStatus = isFollowing;
      const currentFollowersCount = followersCount;

      // Endpoint cho follow/unfollow
      const endpoint = `${API_URL}/users/${userId}/${
        currentFollowStatus ? "unfollow" : "follow"
      }`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Không thể ${
            currentFollowStatus ? "hủy theo dõi" : "theo dõi"
          } người dùng`
        );
      }

      const data = await response.json();
      // console.log("Follow/Unfollow response:", data);

      // Cập nhật state ngay lập tức
      const newFollowStatus = !currentFollowStatus;
      setIsFollowing(newFollowStatus);

      // Cập nhật followers count
      if (currentFollowStatus) {
        // Vừa unfollow
        setFollowersCount(Math.max(0, currentFollowersCount - 1));
      } else {
        // Vừa follow
        setFollowersCount(currentFollowersCount + 1);
      }

      // // Sau 1 giây, refresh lại data để đảm bảo sync với server
      // setTimeout(() => {
      //   fetchUserData();
      // }, 1000);

      // console.log(
      //   currentFollowStatus
      //     ? `Unfollowed ${user?.username}`
      //     : `Following ${user?.username}`
      // );
    } catch (error) {
      // console.error("Error following/unfollowing user:", error);
      Alert.alert("Lỗi", "Không thể thực hiện thao tác. Vui lòng thử lại sau.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchUserData();
      }
    }, [userId])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await sleep(500);
      await fetchUserData();
    } catch (error) {
      // console.error("Error refreshing user profile:", error);
    } finally {
      setRefreshing(false);
    }
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

          {/* Chỉ hiển thị số Followers - không có TouchableOpacity */}
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>

          {/* Chỉ hiển thị số Following - không có TouchableOpacity */}
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
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
              disabled={isFollowLoading}
            >
              {isFollowLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? COLORS.primary : COLORS.white}
                />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && styles.followingButtonText,
                  ]}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              )}
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
