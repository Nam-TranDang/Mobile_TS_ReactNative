import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },

  // Header styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },

  // Search input styles
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightBackground,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    height: 40,
  },
  clearButton: {
    padding: 4,
  },

  // Loading styles
  loadingContainer: {
    marginTop: 200, // Tạo khoảng cách từ trên xuống, đẩy nội dung loading xuống thấp hơn
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },

  // User avatars section
  avatarsSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  avatarsContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  avatarItem: {
    alignItems: "center",
    marginRight: 16,
    width: 80,
  },
  avatarContainer: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 40,
    padding: 2,
    marginBottom: 6,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarUsername: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 2,
  },
  bookCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Section titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
    paddingHorizontal: 16,
  },

  // Empty results
  emptyResultContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyResultText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 16,
  },

  // Search results
  resultsContainer: {
    flex: 1,
  },
  resultSection: {
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // User result
  resultUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  resultUserInfo: {
    flex: 1,
  },
  resultUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  resultUserDetail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Book result
  resultBookCover: {
    width: 40,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
  },
  resultBookInfo: {
    flex: 1,
  },
  resultBookTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  resultBookAuthor: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  resultBookRating: {
    flexDirection: "row",
    alignItems: "center",
  },

  // User's Books
  expandedResultContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    overflow: "hidden",
  },
  userBooksContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },
  userBooksTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  userBooksScrollContent: {
    paddingRight: 16,
  },
  userBookItem: {
    width: 90,
    marginRight: 12,
    alignItems: "center",
  },
  userBookCover: {
    width: 80,
    height: 120,
    borderRadius: 6,
    marginBottom: 4,
  },
  userBookTitle: {
    fontSize: 12,
    textAlign: "center",
    color: COLORS.textPrimary,
    width: 90,
  },
  viewAllBooks: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllBooksCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  viewAllBooksText: {
    fontSize: 12,
    color: COLORS.primary,
  },

  // User books loading
  userBooksLoading: {
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  userBooksLoadingText: {
    marginLeft: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  // Thêm styles mới cho hiển thị thông tin chi tiết người dùng
  userStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  userStat: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  userStatDot: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginHorizontal: 4,
  },

  // Colors for dynamic styling
  textColor: COLORS.textPrimary,
  searchIconColor: COLORS.textSecondary,
  placeholderColor: COLORS.textSecondary,
  iconColor: COLORS.textSecondary,
  ratingColor: COLORS.textSecondary,
  loading: {
    color: COLORS.primary,
  },
});

export default styles;
