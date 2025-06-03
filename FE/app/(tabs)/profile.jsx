import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from "react-native";
import { sleep } from ".";
import Loader from "../../components/Loader";
import LogoutButton from "../../components/LogoutButton";
import ProfileHeader from "../../components/ProfileHeader";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import styles from "./../../assets/styles/profile.styles";
import { API_URL } from "./../../constants/api";

export default function Profile() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState(null);
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const { token, user, logout } = useAuthStore();

  const router = useRouter();

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/books/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch user books");

      setBooks(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert(
        "Error",
        "Failed to load profile data. Pull down to refresh."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const renderBookItem = ({ item }) => (
    <View style={styles.bookItem}>
      <Image source={item.image} style={styles.bookImage} />

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <View style={styles.ratingContainer}>
          {renderRatingStars(item.rating)}
        </View>

        <Text style={styles.bookCaption} numberOfLines={2}>
          {item.caption}
        </Text>
        <Text style={styles.bookDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDelete(item._id)}
      >
        {deleteBookId === item._id ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i < rating ? "star" : "star-outline"}
          size={14}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await sleep(500);
    await fetchData();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) return <Loader />;

  return (
    <View style={styles.container}>
      <ProfileHeader />
      <View style={styles.accountActionsContainer}>
        <LogoutButton />

        <TouchableOpacity 
          style={styles.deleteAccountButton}
          onPress={showDeleteAccountConfirmation}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.white} />
          <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
        </TouchableOpacity>

      </View>
      {/* Your Recommendations*/}
      <View style={styles.booksHeader}>
        <Text style={styles.booksTitle}>Your Recommendations</Text>
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
            color={[COLORS.primary]}
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
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/create")}
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
                  confirmationText !== "DELETE" && styles.modalDeleteButtonDisabled
                ]}
                onPress={handleDeleteAccount}
                disabled={confirmationText !== "DELETE" || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalDeleteButtonText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
