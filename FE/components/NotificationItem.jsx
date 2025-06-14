import React from 'react';
import { View, Text, TouchableOpacity, TouchableHighlight, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import COLORS from '../constants/colors';
import styles from '../assets/styles/notifications.styles';

const NotificationItem = ({ notification, onLongPress, onNotificationRead }) => {
  const router = useRouter();
  
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
      case 'follow':
        return {
          type: 'avatar',
          source: notification.sourceUser?.profilePicture 
            ? { uri: notification.sourceUser.profilePicture }
            : require('../assets/images/default-avatar.png')
        };
      case 'like':
        return {
          type: 'avatar',
          source: notification.sourceUser?.profilePicture 
            ? { uri: notification.sourceUser.profilePicture }
            : require('../assets/images/default-avatar.png')
        };
      case 'comment':
        return {
          type: 'avatar',
          source: notification.sourceUser?.profilePicture 
            ? { uri: notification.sourceUser.profilePicture }
            : require('../assets/images/default-avatar.png')
        };
      case 'new_post':
        return {
          type: 'avatar',
          source: notification.sourceUser?.profilePicture 
            ? { uri: notification.sourceUser.profilePicture }
            : require('../assets/images/default-avatar.png')
        };
      case 'report':
        return {
          type: 'icon',
          name: 'alert-circle',
          color: COLORS.red
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
    if (!notification.read && onNotificationRead) {
      onNotificationRead(notification._id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'like' || notification.type === 'comment') {
      router.push({
        pathname: "/bookdetail",
        params: { bookId: notification.bookId }
      });
    } else if (notification.type === 'follow' || notification.type === 'new_post') {
      router.push({
        pathname: "/userprofile",
        params: { userId: notification.sourceUserId }
      });
    } else if (notification.type === 'report') {
      // Navigate to reports screen or show report details
      console.log('Report notification pressed');
    }
  };

  const icon = getNotificationIcon();
  const timeAgo = formatTimeAgo(notification.createdAt);
  const handleFollowUser = (e) => {
    e.stopPropagation(); // Prevent triggering the onPress of parent TouchableHighlight
    
    // API call to follow user - for now just console log
    console.log(`Following user ${notification.sourceUserId}`);
    
    // In production, make API call to follow the user
    // After successful API call, you might want to update the notification or the user's followers list
  };

  return (    <TouchableHighlight
      onPress={handlePress}
      onLongPress={() => onLongPress(notification)}
      underlayColor={COLORS.border}
      style={styles.itemTouchable}
    >
      <View style={[
        styles.itemContainer,
        !notification.read && styles.itemUnreadContainer
      ]}>
        <View style={styles.itemIconContainer}>
          {icon.type === 'avatar' ? (
            <Image source={icon.source} style={styles.itemAvatar} />
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
              !notification.read ? styles.itemUnreadMessage : styles.itemReadMessage
            ]} 
            numberOfLines={2}
          >
            {notification.message}
          </Text>
        </View>
        
        <View style={styles.itemRightContainer}>
          <Text style={styles.itemTimeAgo}>{timeAgo}</Text>
          
          {notification.type === 'follow' && !notification.isFollowingBack && (
            <TouchableOpacity 
              style={styles.itemFollowButton}
              onPress={handleFollowUser}
            >
              <Text style={styles.itemFollowButtonText}>Follow</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableHighlight>
  );
};

// Styles are now imported from '../assets/styles/notifications.styles'

export default NotificationItem;
