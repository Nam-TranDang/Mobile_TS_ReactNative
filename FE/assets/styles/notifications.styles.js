import COLORS from "../../constants/colors";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  // Screen level styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    marginVertical: 4,
  },
  unreadItem: {
    backgroundColor: COLORS.primaryLight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },  
  notificationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  
  // NotificationItem component styles
  itemTouchable: {
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  itemUnreadContainer: {
    backgroundColor: COLORS.border,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  itemIconContainer: {
    marginRight: 12,
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
  },
  itemIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },  
  itemContentContainer: {
    flex: 1,
    marginRight: 16,
  },  
  itemMessage: {
    fontSize: 15,
  },
  itemUnreadMessage: {
    fontWeight: 500,
    color: COLORS.textPrimary,
  },
  itemReadMessage: {
    fontWeight: 'normal',
    color: COLORS.textPrimary,
  },
  itemRightContainer: {
    alignItems: 'flex-end',
  },
  itemTimeAgo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  itemFollowButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    marginTop: -20,
    marginRight: 28,
  },
  itemFollowButtonText: {
    color: COLORS.white,
    fontWeight: '500',
    fontSize: 14,
  }
});

export default styles;