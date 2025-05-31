import { StyleSheet, Dimensions } from "react-native";
import COLORS from "../../constants/colors";

const { width } = Dimensions.get("window");
const imageSize = (width - 48) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  moreButton: {
    padding: 8,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  profileContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  profileInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 24,
  },
  statsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userDetails: {
    marginBottom: 16,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  followButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: COLORS.border,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  followingButtonText: {
    color: COLORS.textPrimary,
  },
  messageButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  reportButton: {
    backgroundColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gridHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 16,
  },
  gridHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  gridItem: {
    width: imageSize,
    height: imageSize,
    position: "relative",
    marginLeft: 6,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  ratingOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
});

export default styles;
