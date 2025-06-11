import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";
import style from "../../assets/styles/create.styles"; // Tái sử dụng style từ trang create

const MAX_IMAGE_SIZE = 6 * 1024 * 1024; // 6MB

export default function EditBook() {
  const { bookId } = useLocalSearchParams();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Book data
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [rating, setRating] = useState(3);
  const [author, setAuthor] = useState("");
  const [publishedYear, setPublishedYear] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Genre handling
  const [genres, setGenres] = useState([]);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [loadingGenres, setLoadingGenres] = useState(false);

  // Fetch book details and genres when component mounts
  useEffect(() => {
    if (!bookId || !token) return;

    const fetchBookDetails = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch(`${API_URL}/books/${bookId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch book details");
        }

        const bookData = await response.json();

        // Populate form with existing data
        setTitle(bookData.title || "");
        setCaption(bookData.caption || "");
        setImage(bookData.image || null);
        setRating(bookData.rating || 3);
        setAuthor(bookData.author || "");
        setPublishedYear(
          bookData.published_year ? String(bookData.published_year) : ""
        );

        // Fetch genres to correctly set the selected genre
        await fetchGenres(bookData.genre);
      } catch (error) {
        console.error("Error fetching book details:", error);
        Alert.alert(
          "Error",
          "Failed to load book details. Please try again later."
        );
        router.back();
      } finally {
        setInitialLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId, token]);

  // Fetch all available genres
  const fetchGenres = async (selectedGenreId = null) => {
    try {
      setLoadingGenres(true);
      const response = await fetch(`${API_URL}/books/genres`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch genres");
      }

      const genreData = await response.json();
      setGenres(genreData);

      // Set selected genre if provided
      if (selectedGenreId) {
        const foundGenre = genreData.find(
          (genre) => genre._id === selectedGenreId
        );
        if (foundGenre) {
          setSelectedGenre(foundGenre);
        }
      }
    } catch (error) {
      console.error("Error fetching genres:", error);
      Alert.alert("Error", "Failed to load genres. Please try again.");
    } finally {
      setLoadingGenres(false);
    }
  };

  // Image picker function
  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please grant permission to access your photos."
        );
        return;
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
            "Image is too large!",
            "Please select an image smaller than 6MB."
          );
          return;
        }

        setImage(result.assets[0].uri);

        // Get base64 data
        if (result.assets[0].base64) {
          setImageBase64(result.assets[0].base64);
        } else {
          const base64 = await FileSystem.readAsStringAsync(
            result.assets[0].uri,
            { encoding: FileSystem.EncodingType.Base64 }
          );
          setImageBase64(base64);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error picking image");
    }
  };

  // Submit form function
  const handleSubmit = async () => {
    if (!title || !caption || !author || !selectedGenre) {
      Alert.alert("Please fill in all required fields");
      return;
    }

    // Validate published year if provided
    if (
      publishedYear &&
      (isNaN(publishedYear) ||
        publishedYear < 0 ||
        publishedYear > new Date().getFullYear())
    ) {
      Alert.alert("Error", "Invalid published year");
      return;
    }

    try {
      setLoading(true);

      // Create request body with base info
      let requestBody = {
        title,
        caption,
        rating,
        author,
        published_year: publishedYear ? parseInt(publishedYear) : undefined,
        genre: selectedGenre._id,
      };

      // Chỉ gửi ảnh nếu người dùng thực sự đã thay đổi ảnh
      if (imageBase64) {
        const uriParts = image.split(".");
        const fileType = uriParts[uriParts.length - 1];
        const imageType = fileType
          ? `image/${fileType.toLowerCase()}`
          : "image/jpeg";
        const imageDataUrl = `data:${imageType};base64,${imageBase64}`;
        requestBody.image = imageDataUrl;
      }

      const response = await fetch(`${API_URL}/books/${bookId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      // Thêm đoạn code này để xóa cache của Image component
      try {
        // Đối với expo-image
        Image.clearMemoryCache();
      } catch (cacheError) {
        console.log("Cache clearing error:", cacheError);
      }

      Alert.alert("Success", "Book recommendation updated successfully", [
        {
          text: "OK",
          onPress: () => {
            // Thêm một tham số ngẫu nhiên vào route để đảm bảo component Profile được tạo lại
            router.replace({
              pathname: "/(tabs)",
              params: { refresh: Date.now() },
            });
          },
        },
      ]);
    } catch (error) {
      console.error("Error updating book:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Rating stars component
  const renderRatingPicker = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={style.starButton}
        >
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={32}
            color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          />
        </TouchableOpacity>
      );
    }
    return <View style={style.ratingContainer}>{stars}</View>;
  };

  // Genre selection modal
  const renderGenreModal = () => (
    <Modal
      visible={showGenreModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowGenreModal(false)}
    >
      <TouchableOpacity
        style={style.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowGenreModal(false)}
      >
        <View style={style.modalContent}>
          <Text style={style.modalTitle}>Choose Book Genre</Text>

          {loadingGenres ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <ScrollView style={style.genreList}>
              {genres.map((genre) => (
                <TouchableOpacity
                  key={genre._id}
                  style={[
                    style.genreItem,
                    selectedGenre?._id === genre._id && style.selectedGenreItem,
                  ]}
                  onPress={() => {
                    setSelectedGenre(genre);
                    setShowGenreModal(false);
                  }}
                >
                  <Text
                    style={[
                      style.genreItemText,
                      selectedGenre?._id === genre._id &&
                        style.selectedGenreItemText,
                    ]}
                  >
                    {genre.genre_name}
                  </Text>
                  {selectedGenre?._id === genre._id && (
                    <Ionicons name="checkmark" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={style.closeModalButton}
            onPress={() => setShowGenreModal(false)}
          >
            <Text style={style.closeModalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (initialLoading) {
    return (
      <View style={style.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={style.loadingText}>Loading book details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={style.container}
        style={style.scrollViewStyle}
      >
        <View style={style.card}>
          {/* Header */}
          <View style={style.header}>
            <Text style={style.title}>Edit Book</Text>
            <Text style={style.subtitle}>Update your book recommendation</Text>
          </View>

          <View style={style.form}>
            {/* Book Title */}
            <View style={style.formGroup}>
              <Text style={style.label}>Book Title</Text>
              <View style={style.inputContainer}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={style.inputIcon}
                />
                <TextInput
                  style={style.input}
                  placeholder="Enter book title"
                  placeholderTextColor={COLORS.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* Author */}
            <View style={style.formGroup}>
              <Text style={style.label}>Author</Text>
              <View style={style.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={style.inputIcon}
                />
                <TextInput
                  style={style.input}
                  placeholder="Enter author's name"
                  placeholderTextColor={COLORS.placeholderText}
                  value={author}
                  onChangeText={setAuthor}
                />
              </View>
            </View>

            {/* Published Year */}
            <View style={style.formGroup}>
              <Text style={style.label}>Published Year (Optional)</Text>
              <View style={style.inputContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={style.inputIcon}
                />
                <TextInput
                  style={style.input}
                  placeholder="Enter published year"
                  placeholderTextColor={COLORS.placeholderText}
                  value={publishedYear}
                  onChangeText={setPublishedYear}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Genre Selection */}
            <View style={style.formGroup}>
              <Text style={style.label}>Genre</Text>
              <TouchableOpacity
                style={style.genreSelector}
                onPress={() => setShowGenreModal(true)}
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={style.genreSelectorIcon}
                />
                  <Text style={selectedGenre ? style.selectedGenreName : style.genrePlaceholder}>
                    {selectedGenre ? selectedGenre.genre_name : "Select a genre"}
                  </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Rating */}
            <View style={style.formGroup}>
              <Text style={style.label}>Rating</Text>
              {renderRatingPicker()}
            </View>

            {/* Image Picker */}
            <View style={style.formGroup}>
              <Text style={style.label}>Book Image</Text>
              <TouchableOpacity style={style.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={style.previewImage} />
                ) : (
                  <View style={style.placeholderContainer}>
                    <Ionicons
                      name="image-outline"
                      size={40}
                      color={COLORS.textSecondary}
                    />
                    <Text style={style.placeholderText}>Select Image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Caption */}
            <View style={style.formGroup}>
              <Text style={style.label}>Caption</Text>
              <TextInput
                style={style.textArea}
                placeholder="Write a caption..."
                placeholderTextColor={COLORS.placeholderText}
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>

            {/* Submit and Cancel Buttons in a Row */}
            <View style={style.twoBtnInline}>
              {/* Cancel Button */}
              <TouchableOpacity
                style={[
                  style.button,
                  { backgroundColor: COLORS.background, flex: 1 },
                ]}
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={style.buttonText1}>Cancel</Text>
              </TouchableOpacity>

              {/* Update Button */}
              <TouchableOpacity
                style={[style.button, { flex: 1 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={style.buttonText}>Update Book</Text>
                )}
              </TouchableOpacity>

            </View>
          </View>
        </View>
      </ScrollView>

      {/* Genre Selection Modal */}
      {renderGenreModal()}
    </KeyboardAvoidingView>
  );
}
