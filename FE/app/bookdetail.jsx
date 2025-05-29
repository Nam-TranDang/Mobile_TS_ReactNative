import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "../assets/styles/bookdetail.styles";
import COLORS from "../constants/colors";
import { API_URL } from "../constants/api";
import { formatMemberSince, formatPublishDate } from "../lib/utils";
import { useAuthStore } from "../store/authStore";

export default function BookDetail() {
  const { bookId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuthStore();

  const [book, setBook] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);

  const fetchBookDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch book details");
      }

      const bookData = await response.json();
      setBook(bookData);
    } catch (error) {
      console.error("Error fetching book details:", error);
      Alert.alert("Error", "Failed to load book details");
    }
  };

  const fetchComments = async (page = 1, append = false) => {
    try {
      if (page === 1 && !append) {
        setIsLoading(true);
      } else {
        setLoadingMoreComments(true);
      }

      const response = await fetch(
        `${API_URL}/books/${bookId}/comments?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = await response.json();

      if (append) {
        setComments((prev) => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }

      setHasMoreComments(page < data.totalPages);
      setCommentsPage(page);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
      setLoadingMoreComments(false);
    }
  };

  useEffect(() => {
    if (bookId) {
      fetchBookDetails();
      fetchComments();
    }
  }, [bookId]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`${API_URL}/books/${bookId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit comment");
      }

      const newComment = await response.json();
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
    } catch (error) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error", "Failed to submit comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLoadMoreComments = () => {
    if (hasMoreComments && !loadingMoreComments) {
      fetchComments(commentsPage + 1, true);
    }
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={18}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      <Image
        source={{ uri: item.user.profileImage }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{item.user.username}</Text>
          <Text style={styles.commentDate}>
            {formatPublishDate(item.createdAt)}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  if (isLoading && !book) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Details</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Book Details */}
        {book && (
          <View style={styles.bookCard}>
            {/* User Info */}
            <View style={styles.bookHeader}>
              <Image
                source={{ uri: book.user.profileImage }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.username}>{book.user.username}</Text>
                <Text style={styles.joinDate}>
                  Joined {formatMemberSince(book.user.createdAt)}
                </Text>
              </View>
            </View>

            {/* Book Image */}
            <View style={styles.bookImageContainer}>
              <Image source={{ uri: book.image }} style={styles.bookImage} />
            </View>

            {/* Book Info */}
            <Text style={styles.bookTitle}>{book.title}</Text>
            <View style={styles.ratingContainer}>
              {renderRatingStars(book.rating)}
            </View>
            <Text style={styles.caption}>{book.caption}</Text>
            <Text style={styles.publishDate}>
              Published on {formatPublishDate(book.createdAt)}
            </Text>
          </View>
        )}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor={COLORS.placeholderText}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSubmitComment}
              disabled={isSubmittingComment || !commentText.trim()}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="send" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {comments.length > 0 ? (
            <>
              <FlatList
                data={comments}
                renderItem={renderCommentItem}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
              />

              {/* Load More Comments Button */}
              {hasMoreComments && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMoreComments}
                  disabled={loadingMoreComments}
                >
                  {loadingMoreComments ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load More Comments</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.emptyComments}>
              No comments yet. Be the first to comment!
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
