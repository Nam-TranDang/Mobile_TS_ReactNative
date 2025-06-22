import { io } from "socket.io-client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import styles from "../assets/styles/bookdetail.styles";
import COLORS from "../constants/colors";
import { API_URL, SOCKET_URL } from "../constants/api";
import { formatMemberSince, formatRelativeTime } from "../lib/utils";
import { useAuthStore } from "../store/authStore";
import { useLanguage } from "../context/LanguageContext";

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
  const [newCommentId, setNewCommentId] = useState(null);
  const [showBookOptionsMenu, setShowBookOptionsMenu] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const socketRef = useRef(null);
  const { t, currentLanguage, changeLanguage } = useLanguage();

  const handleReportComment = (comment) => {
    Alert.alert(t("settings.rpcmt"), t("settings.rcmttitle"), [
      {
        text: t("settings.cancel"),
        style: "cancel",
      },
      {
        text: t("settings.rp"),
        style: "destructive",
        onPress: () => {
          router.push({
            pathname: "/(tabs)/report",
            params: {
              id: comment._id,
              type: "Comment",
              commentText: comment.text,
              commentAuthor: comment.user.username,
              source: "bookdetail",
              bookId: book._id,
            },
          });
        },
      },
    ]);
  };

  // Thiết lập kết nối Socket.IO
  useEffect(() => {
    if (!bookId || !token) return;

    // Khởi tạo kết nối socket
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    // Tham gia vào phòng của sách cụ thể
    socket.emit("joinBookRoom", bookId);

    // Lắng nghe khi có bình luận mới
    socket.on("newComment", (newComment) => {
      // Không thêm comment nếu nó đến từ người dùng hiện tại (đã được thêm thủ công)
      if (newComment.user._id !== user.id) {
        setNewCommentId(newComment._id);
        setComments((prev) => [newComment, ...prev]);
      }
    });

    // Lắng nghe khi có bình luận bị xóa
    socket.on("commentDeleted", ({ commentId }) => {
      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );
    });

    // Lắng nghe khi có bình luận được cập nhật
    socket.on("commentUpdated", (updatedComment) => {
      setComments((prev) =>
        prev.map((comment) =>
          comment._id === updatedComment._id ? updatedComment : comment
        )
      );
    });

    socket.on("bookInteractionUpdate", (updatedBookData) => {
      // Kiểm tra xem có phải là sách hiện tại không
      if (updatedBookData._id === bookId) {
        // Cập nhật state của sách với thông tin tương tác mới
        setBook((prevBook) => {
          if (!prevBook) return prevBook;

          return {
            ...prevBook,
            like_count: updatedBookData.like_count,
            dislike_count: updatedBookData.dislike_count,
            likedBy: updatedBookData.likedBy,
            dislikedBy: updatedBookData.dislikedBy,
          };
        });
      }
    });

    // Cleanup when component unmounts
    return () => {
      if (socket) {
        socket.emit("leaveBookRoom", bookId);
        socket.disconnect();
      }
    };
  }, [bookId, token, user?.id]);

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

      // Reset typing status
      if (socketRef.current) {
        socketRef.current.emit("userTyping", { bookId, isTyping: false });
      }
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
    <Pressable
      style={styles.commentItem}
      onLongPress={() => handleReportComment(item)}
      delayLongPress={750} // 0.5s
    >
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
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </Pressable>
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

      // const updatedBook = await response.json();
      // // Preserve the user information from the original book object
      // setBook({
      //   ...updatedBook,
      //   user: book.user, // Keep the existing user information
      // });
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

      // const updatedBook = await response.json();
      // // Preserve the user information
      // setBook({
      //   ...updatedBook,
      //   user: book.user,
      // });
    } catch (error) {
      console.error("Error updating dislike status:", error);
    } finally {
      setIsDisliking(false);
    }
  };

  // Thêm các hàm xử lý
  const handleEditBook = () => {
    setShowBookOptionsMenu(false);
    router.push({
      pathname: "/editbook",
      params: { bookId: book?._id },
    });
  };

  const handleDeleteConfirm = () => {
    setShowBookOptionsMenu(false);
    Alert.alert(t("book.delete"), t("book.aldelete"), [
      {
        text: t("book.cancel"),
        style: "cancel",
      },
      {
        text: t("book.delete"),
        onPress: handleDeleteBook,
        style: "destructive",
      },
    ]);
  };

  const handleDeleteBook = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/books/${book._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert(t("book.sus"), t("book.susdel"), [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Could not delete the book");
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      Alert.alert("Error", "An error occurred while deleting the book");
    } finally {
      setIsLoading(false);
    }
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
        <Text style={styles.headerTitle}>{t("book.detail")}</Text>
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
                {/* <Text style={styles.joinDate}>
                  Joined {formatMemberSince(book.user.createdAt)}
                </Text> */}
              </View>
              {user && book && book.user && book.user._id === user.id && (
                <TouchableOpacity
                  style={styles.ellipsisButton}
                  onPress={() => setShowBookOptionsMenu(true)}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={24}
                    color={COLORS.textPrimary}
                  />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Book Image */}
            <View style={styles.bookImageContainer}>
              <TouchableOpacity
                onPress={() => setShowImageZoom(true)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: book.image }} style={styles.bookImage} />
              </TouchableOpacity>
            </View>

            {/* Book Info */}
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookAuthor}>
              {t("book.author")} : {book.author || "Không có thông tin"}
            </Text>
            <View style={styles.ratingContainer}>
              {renderRatingStars(book.rating)}
            </View>
            <Text style={styles.caption}>{book.caption}</Text>
            <Text style={styles.publishDate}>
              {formatRelativeTime(book.createdAt)}
            </Text>

            {/* Like/Dislike Buttons */}
            {/* Book Actions Container */}
            <View style={styles.bookActionsContainer}>
              {/* Like/Dislike Buttons */}
              <View style={styles.actionsRow}>
                {/* Like Button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleLike}
                  disabled={isLiking || isDisliking}
                >
                  {isLiking ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons
                      name={
                        book.likedBy && book.likedBy.includes(user?.id)
                          ? "heart"
                          : "heart-outline"
                      }
                      size={24}
                      color={
                        book.likedBy && book.likedBy.includes(user?.id)
                          ? COLORS.primary
                          : COLORS.textSecondary
                      }
                    />
                  )}
                  <Text style={styles.actionText}>{book.like_count || 0}</Text>
                </TouchableOpacity>

                {/* Dislike Button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleDislike}
                  disabled={isLiking || isDisliking}
                >
                  {isDisliking ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons
                      name={
                        book.dislikedBy && book.dislikedBy.includes(user?.id)
                          ? "thumbs-down"
                          : "thumbs-down-outline"
                      }
                      size={22}
                      color={
                        book.dislikedBy && book.dislikedBy.includes(user?.id)
                          ? COLORS.primary
                          : COLORS.textSecondary
                      }
                    />
                  )}
                  <Text style={styles.actionText}>
                    {book.dislike_count || 0}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionsRow}>
                {/* Report Button */}
                {/* Người dùng không phải tác giả mới hiện report bài*/}
                {user && book && book.user && book.user._id !== user.id && (
                  <TouchableOpacity
                    style={styles.reportButton}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/report",
                        params: {
                          id: bookId,
                          type: "Book",
                          source: "bookdetail",
                          bookId: book._id,
                        },
                      })
                    }
                  >
                    <Ionicons
                      name="flag-outline"
                      size={18}
                      color={COLORS.red}
                    />
                    <Text style={styles.reportText}>{t("settings.rp")}</Text>
                  </TouchableOpacity>
                )}
              </View>
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
              placeholder={t("book.cmtsth")}
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
                    <Text style={styles.loadMoreText}>{t("book.morecmt")}</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.emptyComments}>{t("book.nocmt")}</Text>
          )}
        </View>

        {/* Book Options Menu */}
        <Modal
          visible={showBookOptionsMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBookOptionsMenu(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => setShowBookOptionsMenu(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.menuContainer}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleEditBook}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={22}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.menuText}>{t("book.edit")}</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDeleteConfirm}
                >
                  <Ionicons name="trash-outline" size={22} color={COLORS.red} />
                  <Text style={[styles.menuText, { color: COLORS.red }]}>
                    {t("book.delete")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Image Zoom Modal */}
        <Modal
          visible={showImageZoom}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImageZoom(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowImageZoom(false)}>
            <View style={styles.imageZoomOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.imageZoomContainer}>
                  <TouchableOpacity
                    style={styles.imageZoomCloseButton}
                    onPress={() => setShowImageZoom(false)}
                  >
                    <Ionicons name="close" size={30} color={COLORS.white} />
                  </TouchableOpacity>
                  <Image
                    source={{ uri: book?.image }}
                    style={styles.zoomedImage}
                    contentFit="contain"
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
