import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  // Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import COLORS from "../../constants/colors";
import { API_URL } from "../../constants/api";
import { formatMemberSince } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import { sleep } from "../../lib/helper";
import styles from "../../assets/styles/userprofile.styles"; // Use userprofile styles
import { useFocusEffect } from "@react-navigation/native";

// const { width } = Dimensions.get("window");
// const imageSize = (width - 48) / 3; // 3 columns with padding

export default function Profile() {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState(null);
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { token, user: currentUser, logout } = useAuthStore();
  const router = useRouter();
  const userId = currentUser?.id;

  const fetchData = async () => {
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

      // Set follower and following counts
      const actualFollowersCount = userData.followers
        ? userData.followers.length
        : 0;
      const actualFollowingCount = userData.following
        ? userData.following.length
        : 0;

      setFollowersCount(actualFollowersCount);
      setFollowingCount(actualFollowingCount);

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
      console.error("Error fetching profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchData();
      }
    }, [userId])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await sleep(500);
    await fetchData();
    setRefreshing(false);
  };

  const handleDeleteBook = async (bookId) => {
    setDeleteBookId(bookId);
    try {
      const response = await fetch(`${API_URL}/books/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to delete book");

      setBooks(books.filter((book) => book._id !== bookId));
      Alert.alert("Success", "Recommendation deleted successfully");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to delete recommendation");
    } finally {
      setDeleteBookId(null);
    }
  };

  const confirmDelete = (bookId) => {
    Alert.alert(
      "Delete Recommendation",
      "Are you sure you want to delete this recommendation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteBook(bookId),
        },
      ]
    );
  };

  const showDeleteAccountConfirmation = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action CANNOT be undone and all your data will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => setIsDeleteAccountModalVisible(true),
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    // Check if user and token are available
    if (!user) {
      Alert.alert("Error", "User information not available");
      return;
    }

    const userId = user._id || user.id;
    if (!userId) {
      Alert.alert("Error", "User ID is missing");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Authentication token not available");
      return;
    }

    if (confirmationText !== "DELETE") {
      Alert.alert("Error", "Please type DELETE to confirm");
      return;
    }

    try {
      setIsDeleting(true);
      console.log(`Attempting to delete user with ID: ${userId}`);

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("Delete account response:", data);
      
      if (!response.ok) throw new Error(data.message || "Failed to delete account");

      // Đóng modal và đăng xuất
      setIsDeleteAccountModalVisible(false);
      Alert.alert("Success", "Your account has been deleted successfully", [
        {
          text: "OK",
          onPress: () => {
            logout();
            router.replace("/(auth)");
          },
        },
      ]);
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  // Settings Menu Component
  const SettingsMenu = () => {
    return (
      <Modal
        transparent={true}
        visible={showSettingsMenu}
        animationType="fade"
        onRequestClose={() => setShowSettingsMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSettingsMenu(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContainer}>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowSettingsMenu(false);
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
                  }}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={22}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.menuText}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowSettingsMenu(false);
                    showDeleteAccountConfirmation();
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={COLORS.danger}
                  />
                  <Text style={[styles.menuText, { color: COLORS.danger }]}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Thêm menu tùy chọn cho sách
  const BookOptionsMenu = ({visible, bookId, onClose}) => {
    return (
      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.menuContainer, {width: 200}]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    router.push({
                      pathname: "/(tabs)/editbook",
                      params: { bookId: bookId },
                      source: "profile"
                    });
                  }}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={22}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.menuText}>Edit Book</Text>
                </TouchableOpacity>
                
                <View style={styles.menuDivider} />
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    confirmDelete(bookId);
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={COLORS.danger}
                  />
                  <Text style={[styles.menuText, {color: COLORS.danger}]}>Delete Book</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const [selectedBookId, setSelectedBookId] = useState(null);
  const [showBookOptionsMenu, setShowBookOptionsMenu] = useState(false);

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
      onLongPress={() => {
        setSelectedBookId(item._id);
        setShowBookOptionsMenu(true);
      }}
      delayLongPress={500}
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

      {/* Thêm indicator cho delete status khi đang xóa */}
      {deleteBookId === item._id && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="small" color={COLORS.white} />
          <Text style={styles.deletingText}>Deleting...</Text>
        </View>
      )}
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

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>

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
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push("/(tabs)/editprofile")}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Books Grid Header */}
      {/* <View style={styles.gridHeader}>
        <Ionicons name="grid-outline" size={24} color={COLORS.textPrimary} />
        <Text style={styles.gridHeaderText}>Books</Text>
      </View> */}
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Thêm style cho overlay khi đang xóa
  const additionalStyles = {
    deletingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
    },
    deletingText: {
      color: COLORS.white,
      marginTop: 8,
      fontSize: 12,
    },
  };

  // Kết hợp style mới với style cũ
  Object.assign(styles, additionalStyles);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Profile</Text>
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => setShowSettingsMenu(true)}
        >
          <Ionicons
            name="settings-outline"
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
        style={styles.booksList}
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={styles.booksRow}
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
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/(tabs)/create")}
            >
              <Text style={styles.addButtonText}>Add Your First Book </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={isDeleteAccountModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeleteAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Account</Text>

              <Text style={styles.modalText}>
                This action will permanently delete your account and all associated data. This action CANNOT be undone.
              </Text>

              <Text style={styles.confirmInstructionText}>
                To confirm, please type DELETE in the field below:
              </Text>

              <TextInput
                style={styles.confirmationInput}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder="Type DELETE"
                placeholderTextColor={COLORS.textSecondary}
              />

              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setIsDeleteAccountModalVisible(false);
                    setConfirmationText("");
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalDeleteButton,
                    confirmationText !== "DELETE" &&
                      styles.modalDeleteButtonDisabled,
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={confirmationText !== "DELETE" || isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.modalDeleteButtonText}>
                      Delete Account
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Book Options Menu */}
      <BookOptionsMenu
        visible={showBookOptionsMenu}
        bookId={selectedBookId}
        onClose={() => {
          setShowBookOptionsMenu(false);
          setSelectedBookId(null);
        }}
      />

      {/* Add Settings Menu */}
      <SettingsMenu />
    </SafeAreaView>
  );
}
