import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TouchableHighlight, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import COLORS from '../constants/colors';
import styles from '../assets/styles/notifications.styles';
import { API_URL } from '../constants/api';
import { useAuthStore } from '../store/authStore';

const NotificationItem = ({ notification, onLongPress, onNotificationRead }) => {
  const router = useRouter();
  const { token, user: currentUser } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedFollowStatus, setCheckedFollowStatus] = useState(false);
  
  // Kiểm tra xem người dùng đã follow người gửi thông báo chưa
  useEffect(() => {
    if (notification?.type === 'new_follower' && notification?.sender?._id && currentUser?.id) {
      checkFollowStatus();
    }
  }, [notification]);

  const checkFollowStatus = async () => {
    try {
      // Lấy thông tin người dùng hiện tại để kiểm tra danh sách following
      const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        // Kiểm tra xem người gửi thông báo có trong danh sách following của người dùng không
        const isAlreadyFollowing = userData.following && 
          userData.following.some(followedUser => {
            if (typeof followedUser === 'string') {
              return followedUser === notification.sender._id;
            } else if (typeof followedUser === 'object' && followedUser._id) {
              return followedUser._id === notification.sender._id;
            }
            return false;
          });

        setIsFollowing(isAlreadyFollowing);
        setCheckedFollowStatus(true);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setCheckedFollowStatus(true);
    }
  };
  
  // Format time to display (e.g., 5m, 2h, 3d, or actual date)
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else if (diffInSeconds < 604800) { // 7 days
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    } else {
      // Format as date: MM/DD/YY
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(-2)}`;
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'new_follower':
        return {
          type: 'avatar',
          source: notification.sender?.profileImage.replace("/svg?", "/png?")
        };
      case 'new_like_on_book':
        return {
          type: 'avatar',
          source: notification.sender?.profileImage.replace("/svg?", "/png?")
        };
      case 'new_comment':
        return {
          type: 'avatar',
          source: notification.sender?.profileImage.replace("/svg?", "/png?")
        };
      default:
        return {
          type: 'icon',
          name: 'information-circle',
          color: COLORS.primary
        };
    }
  };

  const handlePress = () => {
    // Mark the notification as read if it's not already read
    if (!notification.isRead && onNotificationRead) {
      onNotificationRead(notification._id);
    }
    
    // Navigate based on notification type and link
    if (notification.link) {
      // Parse the link to determine navigation
      // Example: /books/1234?commentId=5678
      try {
        const url = new URL(notification.link, 'http://dummy.com');
        const pathname = url.pathname;
        const params = {};
        
        // Extract parameters from URL
        url.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        
        // Extract path segments
        const segments = pathname.split('/').filter(segment => segment);
        
        if (segments[0] === 'books' && segments[1]) {
          router.push({
            pathname: "/bookdetail",
            params: { 
              bookId: segments[1],
              ...params
            }
          });
        } else if (segments[0] === 'profile' && segments[1]) {
          router.push({
            pathname: "/userprofile",
            params: { userId: segments[1] }
          });
        }
      } catch (error) {
        console.error('Error parsing notification link:', error);
      }
    } else {
      // Fallback navigation based on type
      if (notification.type === 'new_like_on_book' || notification.type === 'new_comment') {
        if (notification.relatedItemId && notification.relatedItemType === 'Book') {
          router.push({
            pathname: "/bookdetail",
            params: { bookId: notification.relatedItemId._id || notification.relatedItemId }
          });
        }
      } else if (notification.type === 'new_follower') {
        if (notification.sender) {
          router.push({
            pathname: "/userprofile",
            params: { userId: notification.sender._id }
          });
        }
      }
    }
  };

  const icon = getNotificationIcon();
  const timeAgo = formatTimeAgo(notification.createdAt);

  const handleFollowUser = async (e) => {
    e.stopPropagation(); // Prevent triggering the onPress of parent TouchableHighlight
    
    if (!notification.sender?._id || isLoading) return;
    
    try {
      setIsLoading(true);
      
      const endpoint = `${API_URL}/users/${notification.sender._id}/follow`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to follow user');
      }
      
      const data = await response.json();
      console.log('Follow response:', data);
      
      // Update UI state to show followed state
      setIsFollowing(true);
      
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert('Error', error.message || 'Failed to follow user');
    } finally {
      setIsLoading(false);
    }
  };

  // Kiểm tra xem có hiển thị nút Follow hay không
  const shouldShowFollowButton = notification.type === 'new_follower' && 
                                !isFollowing && 
                                checkedFollowStatus &&
                                notification.sender?._id !== currentUser?.id;

  return (
    <TouchableHighlight
      onPress={handlePress}
      onLongPress={() => onLongPress(notification)}
      underlayColor={COLORS.border}
      style={styles.itemTouchable}
    >
      <View style={[
        styles.itemContainer,
        !notification.isRead && styles.itemUnreadContainer
      ]}>
        <View style={styles.itemIconContainer}>
          {icon.type === 'avatar' ? (
            <Image 
              source={icon.source} 
              style={styles.itemAvatar}
              defaultSource={require('../assets/images/default-avatar.png')}
            />
          ) : (
            <View style={[styles.itemIconBackground, { backgroundColor: icon.color + '20' }]}>
              <Ionicons name={icon.name} size={24} color={icon.color} />
            </View>
          )}
        </View>
        <View style={styles.itemContentContainer}>
          <Text 
            style={[
              styles.itemMessage,
              !notification.isRead ? styles.itemUnreadMessage : styles.itemReadMessage
            ]} 
            numberOfLines={2}
          >
            {notification.message}
          </Text>
        </View>
        
        <View style={styles.itemRightContainer}>
          <Text style={styles.itemTimeAgo}>{timeAgo}</Text>
          
          {shouldShowFollowButton && (
            <TouchableOpacity 
              style={styles.itemFollowButton}
              onPress={handleFollowUser}
              disabled={isLoading}
            >
              <Text style={styles.itemFollowButtonText}>
                {isLoading ? 'Loading...' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableHighlight>
  );
};

export default NotificationItem;