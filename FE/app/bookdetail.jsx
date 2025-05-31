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
  const { token, user } = useAuthStore();

  const [book, setBook] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);

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
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/userprofile",
            params: { userId: item.user._id },
          })
        }
      >
        <Image
          source={{ uri: item.user.profileImage }}
          style={styles.commentAvatar}
        />
      </TouchableOpacity>

      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/userprofile",
                params: { userId: item.user._id },
              })
            }
          >
            <Text style={styles.commentUsername}>{item.user.username}</Text>
          </TouchableOpacity>
          <Text style={styles.commentDate}>
            {formatPublishDate(item.createdAt)}
          </Text>
          <TouchableOpacity
            style={styles.commentReportButton}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/report",
                params: {
                  id: item._id,
                  type: "Comment",
                  commentText: item.text,
                  commentAuthor: item.user.username,
                },
              })
            }
          >
            <Ionicons name="flag-outline" size={16} color={COLORS.red} />
          </TouchableOpacity>
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
  const handleLike = async () => {
    if (isLiking || isDisliking) return;

    setIsLiking(true);
    try {
      const endpoint = book.likedBy.includes(user.id)
        ? `${API_URL}/books/${bookId}/unlike`
        : `${API_URL}/books/${bookId}/like`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to update like status");

      const updatedBook = await response.json();
      // Preserve the user information from the original book object
      setBook({
        ...updatedBook,
        user: book.user, // Keep the existing user information
      });
    } catch (error) {
      console.error("Error updating like status:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async () => {
    if (isLiking || isDisliking) return;

    setIsDisliking(true);
    try {
      const endpoint = book.dislikedBy.includes(user.id)
        ? `${API_URL}/books/${bookId}/remove-dislike`
        : `${API_URL}/books/${bookId}/dislike`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to update dislike status");

      const updatedBook = await response.json();
      // Preserve the user information
      setBook({
        ...updatedBook,
        user: book.user,
      });
    } catch (error) {
      console.error("Error updating dislike status:", error);
    } finally {
      setIsDisliking(false);
    }
  };
  // Add this function to check if the current user has liked or disliked the book
  const isLikedByUser = () => {
    return book?.likedBy?.includes(user?.id);
  };

  const isDislikedByUser = () => {
    return book?.dislikedBy?.includes(user?.id);
  };

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
            {/* User Info - THÊM TOUCHABLEOPACITY */}
            <TouchableOpacity
              style={styles.bookHeader}
              onPress={() =>
                router.push({
                  pathname: "/userprofile",
                  params: { userId: book.user._id },
                })
              }
            >
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
              {/* Thêm icon để biểu thị có thể click */}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>

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

            {/* Like/Dislike Buttons */}
            {/* Book Actions Container */}
            <View style={styles.bookActionsContainer}>
              {/* Like/Dislike Buttons */}
              <View style={styles.likeDislikeContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleLike}
                  disabled={isLiking}
                >
                  <Ionicons
                    name={isLikedByUser() ? "thumbs-up" : "thumbs-up-outline"}
                    size={22}
                    color={
                      isLikedByUser() ? COLORS.primary : COLORS.textSecondary
                    }
                  />
                  <Text style={styles.actionCount}>{book.like_count || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleDislike}
                  disabled={isDisliking}
                >
                  <Ionicons
                    name={
                      isDislikedByUser() ? "thumbs-down" : "thumbs-down-outline"
                    }
                    size={22}
                    color={
                      isDislikedByUser() ? COLORS.red : COLORS.textSecondary
                    }
                  />
                  <Text style={styles.actionCount}>
                    {book.dislike_count || 0}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Report Button */}
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/report",
                    params: { id: bookId, type: "Book" },
                  })
                }
              >
                <Ionicons name="flag-outline" size={18} color={COLORS.red} />
                <Text style={styles.reportText}>Report</Text>
              </TouchableOpacity>
            </View>
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
