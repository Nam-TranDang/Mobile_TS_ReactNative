import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { API_URL, SOCKET_URL } from '../../constants/api';
import COLORS from '../../constants/colors';
import NotificationItem from '../../components/NotificationItem';
import { NotificationOptionsMenu, NotificationItemMenu, FilterOptionsModal } from '../../components/NotificationOptionsMenu';
import styles from '../../assets/styles/notifications.styles';
import { useLanguage } from '../../context/LanguageContext'; // Import useLanguage hook

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [itemMenuVisible, setItemMenuVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { 
    token, 
    user, 
    setUnreadNotificationsCount, 
    resetUnreadNotificationsCount,
    incrementUnreadNotificationsCount,
    decrementUnreadNotificationsCount 
  } = useAuthStore();
  const socketRef = useRef(null);
  const { t, currentLanguage, changeLanguage } = useLanguage(); // Sử dụng useLanguage hook

  // Reset badge khi vào màn hình thông báo
  useEffect(() => {
    if (token && user) {
      resetUnreadNotificationsCount();
    }
  }, [token, user, resetUnreadNotificationsCount]);

  useEffect(() => {
    if (!token || !user) return;
    
    // Initialize socket connection
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    
    // Join user's notification room
    socket.on('connect', () => {
      console.log('Connected to notification socket');
      socket.emit('joinUserRoom', user.id);
    });
    
    // Listen for new notifications
    socket.on('newNotification', (notification) => {
      console.log('Received new notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Sử dụng setTimeout để tránh update trong render cycle
      // setTimeout(() => {
      //   incrementUnreadNotificationsCount();
      // }, 0);
    });
    
    // Listen for notification status changes
    socket.on('notificationStatusChanged', ({ notificationId, isRead, unreadCount }) => {
      console.log(`Notification ${notificationId} marked as ${isRead ? 'read' : 'unread'}`);
      setNotifications(prev => 
        prev.map(item => 
          item._id === notificationId ? { ...item, isRead } : item
        )
      );
      setUnreadCount(unreadCount);
      // Sử dụng setTimeout để tránh update trong render cycle
      setTimeout(() => {
        setUnreadNotificationsCount(unreadCount);
      }, 0);
    });
    
    // Listen for notification read from popup
    socket.on('notificationReadFromPopup', ({ notificationId, unreadCount }) => {
      console.log(`Notification ${notificationId} marked as read from popup`);
      setNotifications(prev => 
        prev.map(item => 
          item._id === notificationId ? { ...item, isRead: true } : item
        )
      );
      
      if (typeof unreadCount === 'number') {
        setUnreadCount(unreadCount);
        setUnreadNotificationsCount(unreadCount); // Gọi trực tiếp
      } else {
        setUnreadCount(prev => Math.max(0, prev - 1));
        decrementUnreadNotificationsCount(); // Gọi trực tiếp
      }
    });
    
    // Listen for notifications marked as read
    socket.on('notificationsMarkedAsRead', ({ unreadCount: newUnreadCount }) => {
      console.log('All notifications marked as read');
      setNotifications(prev => 
        prev.map(item => ({ ...item, isRead: true }))
      );
      setUnreadCount(newUnreadCount);
      setTimeout(() => {
        setUnreadNotificationsCount(newUnreadCount);
      }, 0);
    });
    
    // Listen for notification deletion
    socket.on('notificationDeleted', ({ notificationId, unreadCount: newUnreadCount }) => {
      console.log(`Notification ${notificationId} deleted`);
      setNotifications(prev => 
        prev.filter(item => item._id !== notificationId)
      );
      setUnreadCount(newUnreadCount);
      setTimeout(() => {
        setUnreadNotificationsCount(newUnreadCount);
      }, 0);
    });
    
    // Listen for all notifications deletion
    socket.on('allNotificationsDeleted', () => {
      console.log('All notifications deleted');
      setNotifications([]);
      setUnreadCount(0);
      setTimeout(() => {
        setUnreadNotificationsCount(0);
      }, 0);
    });

    // Clean up socket connection when component unmounts
    return () => {
      if (socket) {
        console.log('Leaving user room and disconnecting socket');
        socket.emit('leaveUserRoom', user.id);
        socket.disconnect();
      }
    };
  }, [token, user, setUnreadNotificationsCount, incrementUnreadNotificationsCount, decrementUnreadNotificationsCount]);

  const fetchNotifications = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Add filter query parameter if specified
      let queryParams = '';
      if (filterType && filterType !== 'all') {
        queryParams = `?filter=${filterType}`;
      }

      const response = await fetch(`${API_URL}/notifications${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Check for non-JSON response (e.g. HTML error page)
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorText = await response.text();
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || "Failed to fetch notifications");
          } else {
            throw new Error(errorText || "Failed to fetch notifications (non-JSON response)");
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          throw new Error("Failed to fetch notifications: Invalid server response");
        }
      }

      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error("Expected JSON, got: " + text.slice(0, 100));
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      // Cập nhật badge count
      setUnreadNotificationsCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to load notifications: " + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleNotificationAction = async (actionType, notificationId) => {
    try {
      let endpoint;
      let method = 'POST';
      
      switch (actionType) {
        case 'mark_read':
          endpoint = `/notifications/${notificationId}/mark-one-as-read`;
          break;
        case 'mark_unread':
          endpoint = `/notifications/${notificationId}/mark-one-as-unread`;
          break;
        case 'delete':
          endpoint = `/notifications/${notificationId}`;
          method = 'DELETE';
          break;
        default:
          return;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update notification");
      }
      
      // Update UI based on action type
      if (actionType === 'mark_read') {
        setNotifications(notifications.map(item => {
          if (item._id === notificationId) {
            return { ...item, isRead: true };
          }
          return item;
        }));
        // Tính toán giá trị mới cho unreadCount và lưu vào biến
        const updatedUnreadCount = Math.max(0, unreadCount - 1);
        setUnreadCount(updatedUnreadCount);
        // Đồng bộ với badge count
        setUnreadNotificationsCount(updatedUnreadCount);
      } 
      else if (actionType === 'mark_unread') {
        setNotifications(notifications.map(item => {
          if (item._id === notificationId) {
            return { ...item, isRead: false };
          }
          return item;
        }));
        // Tính toán giá trị mới cho unreadCount và lưu vào biến
        const updatedUnreadCount = unreadCount + 1;
        setUnreadCount(updatedUnreadCount);
        // Đồng bộ với badge count
        setUnreadNotificationsCount(updatedUnreadCount);
      } 
      else if (actionType === 'delete') {
        const notificationToDelete = notifications.find(n => n._id === notificationId);
        setNotifications(notifications.filter(item => item._id !== notificationId));
        if (notificationToDelete && !notificationToDelete.isRead) {
          const updatedUnreadCount = Math.max(0, unreadCount - 1);
          setUnreadCount(updatedUnreadCount);
          // Đồng bộ với badge count
          setUnreadNotificationsCount(updatedUnreadCount);
        }
      }
    } catch (error) {
      console.error(`Error performing notification action ${actionType}:`, error);
      Alert.alert("Error", error.message);
    }
  };

  const handleMenuAction = async (actionType) => {
    try {
      let endpoint;
      let method = 'POST';
      
      switch (actionType) {
        case 'filter':
          setFilterModalVisible(true);
          return;
        case 'mark_all_read':
          endpoint = '/notifications/mark-as-read';
          break;
        case 'delete_all':
          endpoint = '/notifications';
          method = 'DELETE';
          
          // Confirm before deleting all
          Alert.alert(
            "Delete All Notifications",
            "Are you sure you want to delete all notifications? This cannot be undone.",
            [
              {
                text: "Cancel",
                style: "cancel"
              },
              { 
                text: "Delete All", 
                style: "destructive",
                onPress: async () => await performMenuAction('/notifications', 'DELETE')
              }
            ]
          );
          return;
        default:
          return;
      }
      
      await performMenuAction(endpoint, method);
    } catch (error) {
      console.error(`Error performing menu action ${actionType}:`, error);
      Alert.alert("Error", error.message);
    }
  };

  const performMenuAction = async (endpoint, method) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process request");
      }
      
      // Handle specific actions
      if (endpoint.includes('mark-as-read')) {
        setNotifications(notifications.map(item => ({ ...item, isRead: true })));
        setUnreadCount(0);
        // Reset badge count
      resetUnreadNotificationsCount();
        Alert.alert("Success", "All notifications marked as read");
      } else if (method === 'DELETE') {
        setNotifications([]);
        setUnreadCount(0);
        // Reset badge count
      resetUnreadNotificationsCount();

        Alert.alert("Success", "All notifications deleted");
      }
    } catch (error) {
      console.error(`Error performing action:`, error);
      Alert.alert("Error", error.message);
    }
  };

  const handleItemLongPress = (notification) => {
    setSelectedNotification(notification);
    setItemMenuVisible(true);
  };

  const handleFilterApply = (filterType) => {
    setFilterType(filterType);
    fetchNotifications();
  };
  
  useEffect(() => {
    fetchNotifications();
  }, [filterType, token]);

  const handleRefresh = () => {
    fetchNotifications(true);
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={60} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>{t("Notification.no")}</Text>
      <Text style={styles.emptySubtext}>{t("Notification.p1")}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("Notification.p2")}</Text>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <NotificationItem 
            notification={item}
            onLongPress={handleItemLongPress}
            onNotificationRead={(notificationId) => handleNotificationAction('mark_read', notificationId)}
          />
        )
        }
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
      
      {/* Options Menu for notification header */}
      <NotificationOptionsMenu 
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onAction={handleMenuAction}
      />
      
      {/* Options Menu for individual notification */}
      <NotificationItemMenu
        visible={itemMenuVisible}
        onClose={() => setItemMenuVisible(false)}
        notification={selectedNotification}
        onAction={(actionType) => {
          if (selectedNotification) {
            handleNotificationAction(actionType, selectedNotification._id);
          }
          setItemMenuVisible(false);
        }}
      />
      
      {/* Filter Modal */}
      <FilterOptionsModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onFilter={handleFilterApply}
      />
    </View>
  );
}