import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
} from "react-native";
import style from "../../assets/styles/create.styles";
import COLORS from "../../constants/colors";

import * as FileSystem from "expo-file-system"; // npx expo install expo-file-system
import * as ImagePicker from "expo-image-picker"; // npx expo install expo-image-picker
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { useLanguage } from "../../context/LanguageContext";

export default function Create() {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(3);
  const [image, setImage] = useState(null); // to display the selected image
  const [imageBase64, setImageBase64] = useState(null);
  const [author, setAuthor] = useState("");
  const [publishedYear, setPublishedYear] = useState("");
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const { t, currentLanguage, changeLanguage } = useLanguage();

  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { token } = useAuthStore();

  const MAX_IMAGE_SIZE = 7 * 1024 * 1024; // 7MB

  // Fetch genres when component mounts
  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      setLoadingGenres(true);
      const response = await fetch(`${API_URL}/books/genres`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch genres");
      }

      const data = await response.json();
      setGenres(data);
    } catch (error) {
      console.error("Error fetching genres:", error);
      Alert.alert("Error", "Failed to load book genres");
    } finally {
      setLoadingGenres(false);
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission to access camera roll is required!");
          return;
        }
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
          Alert.alert(t("create.alertimg"));
          return;
        }
        setImage(result.assets[0].uri);

        // if base64 is provided
        if (result.assets[0].base64) {
          setImageBase64(result.assets[0].base64);
        } else {
          // otherwise, convert the image to base64
          const base64 = await FileSystem.readAsStringAsync(
            result.assets[0].uri,
            {
              encoding: FileSystem.EncodingType.Base64,
            }
          );
          setImageBase64(base64);
        }
      }
    } catch (error) {
      console.error("Error picking image: ", error);
      Alert.alert("Error picking image");
    }
  };

  const handleSubmit = async () => {
    if (!title || !caption || !imageBase64 || !rating|| !author || !selectedGenre) {
      Alert.alert(t("create.alimgae"));
      return;
    }
    // Validate published year if provided
    if (publishedYear && (isNaN(publishedYear) || publishedYear < 0 || publishedYear > new Date().getFullYear())) {
      Alert.alert(t("create.error"), t("create.aleryear"));
      return;
    }

    try {
      setLoading(true);
      const uriParts = image.split(".");
      const fileType = uriParts[uriParts.length - 1];
      const imageType = fileType
        ? `image/${fileType.toLowerCase()}`
        : "image/jpeg";

      const imageDataUrl = `data:${imageType};base64,${imageBase64}`;
      const response = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          caption,
          rating,
          image: imageDataUrl,
          author,
          published_year: publishedYear ? parseInt(publishedYear) : undefined,
          genre: selectedGenre._id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert(t("create.success"), t("create.done"), [
        {
          text:t("create.done"),
          onPress: () => {
            // Reset form
            setTitle("");
            setCaption("");
            setImage(null);
            setImageBase64(null);
            setRating(3);
            setAuthor("");
            setPublishedYear("");
            setSelectedGenre(null);
            // Navigate using setTimeout to ensure component is mounted
            setTimeout(() => {
              router.replace("/(tabs)");
            }, 100);
          },
        },
      ]);
    } catch (error) {
      console.error("Error submitting form: ", error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
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

    // Modal hiển thị danh sách thể loại
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
          <Text style={style.modalTitle}>Chọn thể loại sách</Text>
          
          {loadingGenres ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <ScrollView style={style.genreList}>
              {genres.map((genre) => (
                <TouchableOpacity
                  key={genre._id}
                  style={[
                    style.genreItem,
                    selectedGenre?._id === genre._id && style.selectedGenreItem
                  ]}
                  onPress={() => {
                    setSelectedGenre(genre);
                    setShowGenreModal(false);
                  }}
                >
                  <Text 
                    style={[
                      style.genreItemText,
                      selectedGenre?._id === genre._id && style.selectedGenreItemText
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
            <Text style={style.closeModalButtonText}>{t("create.close")}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
            <Text style={style.title}>{t("create.title")}</Text>
            <Text style={style.subtitle}>
              {t("create.title2")}
            </Text>
          </View>

          <View style={style.form}>
            {/* Book Title */}
            <View style={style.formGroup}>
              <Text style={style.label}>{t("create.title3")}</Text>
              <View style={style.inputContainer}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={style.inputIcon}
                />
                <TextInput
                  style={style.input}
                  placeholder= {t("create.title3placeholder")}
                  placeholderTextColor={COLORS.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>
            
              {/* Author */}
              <View style={style.formGroup}>
                <Text style={style.label}>{t("create.author")}</Text>
                <View style={style.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORS.textSecondary}
                    style={style.inputIcon}
                  />
                  <TextInput
                    style={style.input}
                    placeholder={t("create.authorplaceholder")}
                    placeholderTextColor={COLORS.placeholderText}
                    value={author}
                    onChangeText={setAuthor}
                  />
                </View>
              </View>

              {/* Published Year */}
              <View style={style.formGroup}>
                <Text style={style.label}>{t("create.year")}</Text>
                <View style={style.inputContainer}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={COLORS.textSecondary}
                    style={style.inputIcon}
                  />
                  <TextInput
                    style={style.input}
                    placeholder= {t("create.yearplaceholder")}
                    placeholderTextColor={COLORS.placeholderText}
                    value={publishedYear}
                    onChangeText={setPublishedYear}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </View>

              {/* Genre */}
              <View style={style.formGroup}>
                <Text style={style.label}>{t("create.genre")}</Text>
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
                    {selectedGenre ? selectedGenre.genre_name : t("create.genreplaceholder") }
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
                <Text style={style.label}>{t("create.rating")}</Text>
                {renderRatingPicker()}
              </View>

              {/* Image */}
              <View style={style.formGroup}></View>
                <Text style={style.label}>{t("create.bimg")}</Text>
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
                      <Text style={style.placeholderText}>{t("create.selectimg")}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Caption */}
              <View style={style.formGroup}>
                <Text style={style.label}>{t("create.cap")}</Text>
                <TextInput
                  style={style.textArea}
                  placeholder={t("create.capplaceholder")}
                  placeholderTextColor={COLORS.placeholderText}
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                />
              </View>
              {/* Submit Button */}
              <TouchableOpacity
                style={style.button}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color={COLORS.white}
                      style={style.buttonIcon}
                    />
                    <Text style={style.buttonText}>{t("create.sub")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          {renderGenreModal()}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
