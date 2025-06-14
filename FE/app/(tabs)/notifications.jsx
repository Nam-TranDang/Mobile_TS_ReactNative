import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import COLORS from '../../constants/colors';
// import { formatPublishDate } from '../../lib/utils';
import mockNotifications from '../../lib/mockNotifications';
import NotificationItem from '../../components/NotificationItem';
import { NotificationOptionsMenu, NotificationItemMenu, FilterOptionsModal } from '../../components/NotificationOptionsMenu';
import styles from '../../assets/styles/notifications.styles';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [itemMenuVisible, setItemMenuVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const router = useRouter();
  const { token } = useAuthStore();  const fetchNotifications = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // FOR TESTING: Use mock data
      // In production, replace this with the actual API call
      setTimeout(() => {
        // Filter mock data based on filterType
        let filteredData = [...mockNotifications];
        
        if (filterType === 'today') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          filteredData = mockNotifications.filter(item => new Date(item.createdAt) >= today);
        } else if (filterType === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          filteredData = mockNotifications.filter(
            item => new Date(item.createdAt) >= yesterday && new Date(item.createdAt) < today
          );
        } else if (filterType === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          filteredData = mockNotifications.filter(item => new Date(item.createdAt) >= weekAgo);
        } else if (filterType === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filteredData = mockNotifications.filter(item => new Date(item.createdAt) >= monthAgo);
        }
        
        setNotifications(filteredData);
        setLoading(false);
        setRefreshing(false);
      }, 500); // Simulate network delay
      
      // PRODUCTION CODE (Commented out for testing)
      /*
      // Build query params for filtering
      let queryParams = '';
      if (filterType !== 'all') {
        queryParams = `?filter=${filterType}`;
      }
      
      const response = await fetch(`${API_URL}/notifications${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch notifications");
      }
      
      const data = await response.json();
      setNotifications(data);
      */
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };  const handleNotificationAction = async (actionType, notificationId) => {
    try {
      let endpoint;
      let method = 'PUT';
      
      switch (actionType) {
        case 'mark_read':
          endpoint = `/notifications/${notificationId}/read`;
          break;
        case 'mark_unread':
          endpoint = `/notifications/${notificationId}/unread`;
          break;
        case 'delete':
          endpoint = `/notifications/${notificationId}`;
          method = 'DELETE';
          break;
        default:
          return;
      }
      
      // FOR TESTING: Mock API response
      // In production, uncomment the fetch code below
        // We'll update the selected notification state as part of the map operation below
      
      // Update the notifications list based on the action
      if (actionType === 'delete') {
        setNotifications(notifications.filter(item => item._id !== notificationId));
        setSelectedNotification(null); // Clear selected notification
      } else {
        const updatedNotifications = notifications.map(item => {
          if (item._id === notificationId) {
            const updatedItem = { ...item, read: actionType === 'mark_read' ? true : false };
            // Also update the selectedNotification if this is the one that was modified
            if (selectedNotification && selectedNotification._id === notificationId) {
              setSelectedNotification(updatedItem);
            }
            return updatedItem;
          }
          return item;
        });
        setNotifications(updatedNotifications);
      }
      
      /*
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
      */
      
      // Update the notifications list based on the action
      if (actionType === 'delete') {
        setNotifications(notifications.filter(item => item._id !== notificationId));
      } else {
        setNotifications(notifications.map(item => {
          if (item._id === notificationId) {
            return { ...item, read: actionType === 'mark_read' ? true : false };
          }
          return item;
        }));
      }
    } catch (error) {
      console.error(`Error performing notification action ${actionType}:`, error);
    }
  };
  const handleMenuAction = async (actionType) => {
    try {
      let endpoint;
      let method = 'PUT';
      
      switch (actionType) {
        case 'filter':
          setFilterModalVisible(true);
          return;
        case 'mark_all_read':
          endpoint = '/notifications/mark-all-read';
          break;
        case 'mark_all_unread':
          endpoint = '/notifications/mark-all-unread';
          break;
        case 'delete_all':
          endpoint = '/notifications';
          method = 'DELETE';
          break;
        default:
          return;
      }
      
      // FOR TESTING: Mock API response
      // In production, uncomment the fetch code below
      
      // Update notifications based on action
      if (actionType === 'delete_all') {
        setNotifications([]);
      } else {
        const isRead = actionType === 'mark_all_read';
        setNotifications(notifications.map(item => ({ ...item, read: isRead })));
      }
      
      /*
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update notifications");
      }
      */
      
      // Update notifications based on action
      if (actionType === 'delete_all') {
        setNotifications([]);
      } else {
        const isRead = actionType === 'mark_all_read';
        setNotifications(notifications.map(item => ({ ...item, read: isRead })));
      }
    } catch (error) {
      console.error(`Error performing menu action ${actionType}:`, error);
    }
  };

  const handleItemLongPress = (notification) => {
    setSelectedNotification(notification);
    setItemMenuVisible(true);
  };

  const handleFilterApply = (filterType) => {
    setFilterType(filterType);
    fetchNotifications();  };
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchNotifications();
  }, [filterType, token]); // Re-fetch when filter or token changes

  const handleRefresh = async () => {
    fetchNotifications(true);
  };
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={60} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>When you receive notifications, they&apos;ll appear here</Text>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={notifications}
        renderItem={({ item }) => (          <NotificationItem 
            notification={item}
            onLongPress={handleItemLongPress}
            onNotificationRead={(notificationId) => handleNotificationAction('mark_read', notificationId)}
          />
        )}
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