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
    textAlign: "center", // Thêm thuộc tính này để căn giữa text
    flex: 1, // Sử dụng flex để text chiếm không gian ở giữa
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: COLORS.error,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  confirmInstructionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 10,
    fontWeight: "500",
  },
  confirmationInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: COLORS.inputBackground,
    color: COLORS.textPrimary,
  },
  modalDeleteButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  modalDeleteButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: COLORS.red,
    color: COLORS.white,
    marginLeft: 8,
  },
  modalDeleteButtonText: {
    color: COLORS.white,
    fontWeight: "500",
  },
  menuContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    marginTop: 100,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 180,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 10,
    color: COLORS.textPrimary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 10,
  },
  modalWrapper: {
    width: "100%",
    alignItems: "center",
    marginTop: 250, // This pushes the modal down from the top
  },
});

export default styles;
