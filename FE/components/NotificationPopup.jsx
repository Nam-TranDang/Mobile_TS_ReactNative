import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { SOCKET_URL, API_URL } from '../constants/api'; // Thêm API_URL vào đây
import COLORS from '../constants/colors';


const { width } = Dimensions.get('window');

const NotificationPopup = () => {
  const [notification, setNotification] = useState(null);
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);
  const socketRef = useRef(null);
  const notificationUpdateRef = useRef(null); // Thêm ref mới để theo dõi cập nhật
  const router = useRouter();
  const { token, user, incrementUnreadNotificationsCount } = useAuthStore();
 
  
  useEffect(() => {
    // Chỉ khởi tạo socket khi component mount và user đã đăng nhập
    let isMounted = true;
    
    if (!token || !user) return;
    
    // Khởi tạo kết nối socket
    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'] // Thử dùng chỉ websocket để tránh polling issues
    });
    socketRef.current = socket;
    
    // Tham gia vào phòng của người dùng
    socket.on('connect', () => {
      console.log('NotificationPopup: Connected to socket');
      socket.emit('joinUserRoom', user.id);
    });
    
    // Lắng nghe sự kiện thông báo mới
    socket.on('newNotification', (newNotification) => {
      console.log('NotificationPopup: Received new notification', newNotification);
      
      // Chỉ cập nhật nếu component vẫn mounted
      if (isMounted) {
        // Sử dụng setTimeout để tránh update trong render cycle
        // setTimeout(() => {
        //   incrementUnreadNotificationsCount();
        // }, 0);
        
        // Hiển thị popup
        showNotification(newNotification);
      }
    });
    
    // Dọn dẹp khi component unmount
    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [token, user]);
  
  const showNotification = (newNotification) => {
    // Nếu đang hiển thị một thông báo, hủy timeout cũ
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Cập nhật thông báo mới
    setNotification(newNotification);
    
    // Animations hiển thị
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Tự động ẩn sau 5 giây
    timeoutRef.current = setTimeout(() => {
      hideNotification();
    }, 5000);
  };
  
  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNotification(null);
    });
  };
  
  const handlePress = async () => {
    if (!notification) return;
    
    // Ẩn thông báo
    hideNotification();
    
    try {
      // Đánh dấu thông báo là đã đọc trước khi điều hướng
      if (!notification.isRead && notification._id) {
        try {
          // Gọi API để đánh dấu thông báo là đã đọc
          const response = await fetch(`${API_URL}/notifications/${notification._id}/mark-one-as-read`, {
            method: 'POST', // Đổi từ 'PUT' thành 'POST' để khớp với backend
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            // Giảm số lượng thông báo chưa đọc
            // const { decrementUnreadNotificationsCount, setUnreadNotificationsCount } = useAuthStore.getState();
            
            // // Nếu có hàm decrementUnreadNotificationsCount trong store, sử dụng nó
            // if (typeof decrementUnreadNotificationsCount === 'function') {
            //   decrementUnreadNotificationsCount();
            // } else {
            //   // Nếu không, sử dụng cách thay thế
            //   const currentCount = useAuthStore.getState().unreadNotificationsCount;
            //   setUnreadNotificationsCount(Math.max(0, currentCount - 1));
            // }
            
            // Emit sự kiện qua socket để đồng bộ với trang notifications
            if (socketRef.current) {
              socketRef.current.emit('notificationRead', {
                notificationId: notification._id,
                userId: user.id
              });
            }
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }
      
      // Xử lý điều hướng dựa trên loại thông báo
      if (notification.link) {
        // Nếu có link được định nghĩa trong thông báo
        const linkParts = notification.link.split('?')[0].split('/'); // Tách query params trước
        const queryParams = notification.link.includes('?') ? notification.link.split('?')[1] : '';
        
        if (linkParts[1] === 'books' && linkParts[2]) {
          const params = { bookId: linkParts[2] };
          
          // Nếu có commentId trong query params, thêm vào params
          if (queryParams.includes('commentId=')) {
            const commentId = queryParams.split('commentId=')[1].split('&')[0];
            params.commentId = commentId;
          }
          
          router.push({
            pathname: "/bookdetail",
            params: params
          });
        } else if (linkParts[1] === 'users' && linkParts[2]) {
          router.push({
            pathname: "/userprofile",
            params: { userId: linkParts[2] }
          });
        } else {
          // Fallback to notifications page
          router.push("/(tabs)/notifications");
        }
      } else {
        // Xử lý theo loại thông báo
        if (notification.type === 'new_like_on_book' || notification.type === 'new_comment') {
          // Thêm validation cho relatedItemId
          if (notification.relatedItemId) {
            const bookId = notification.relatedItemId._id || notification.relatedItemId;
            if (bookId) {
              router.push({
                pathname: "/bookdetail",
                params: { bookId: bookId }
              });
            } else {
              console.log('BookId is undefined, redirecting to notifications');
              router.push("/(tabs)/notifications");
            }
          } else {
            console.log('RelatedItemId is undefined, redirecting to notifications');
            router.push("/(tabs)/notifications");
          }
        } else if (notification.type === 'new_follower') {
          if (notification.sender && notification.sender._id) {
            router.push({
              pathname: "/userprofile",
              params: { userId: notification.sender._id }
            });
          } else {
            router.push("/(tabs)/notifications");
          }
        } else {
          // Mặc định mở màn hình thông báo
          router.push("/(tabs)/notifications");
        }
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
      // Mặc định mở màn hình thông báo
      router.push("/(tabs)/notifications");
    }
  };
  
  // Hàm lấy icon cho thông báo
  const getNotificationIcon = () => {
    if (!notification) return { type: 'icon', name: 'notifications', color: COLORS.primary };
    
    switch (notification.type) {
      case 'new_follower':
        return notification.sender && notification.sender.profileImage 
          ? { type: 'image', source: notification.sender.profileImage }
          : { type: 'icon', name: 'person-add', color: COLORS.primary };
      case 'new_like_on_book':
        return notification.sender && notification.sender.profileImage
          ? { type: 'image', source: notification.sender.profileImage }
          : { type: 'icon', name: 'heart', color: COLORS.primary };
      case 'new_comment':
        return notification.sender && notification.sender.profileImage
          ? { type: 'image', source: notification.sender.profileImage }
          : { type: 'icon', name: 'chatbubble', color: COLORS.primary };
      default:
        return { type: 'icon', name: 'notifications', color: COLORS.primary };
    }
  };
  
  // Thêm kiểm tra null trong render
  if (!notification) return null;
  
  const icon = getNotificationIcon();
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.content}
        activeOpacity={0.8}
        onPress={handlePress}
      >
        <View style={styles.iconContainer}>
          {icon?.type === 'image' ? (
            <Image 
              source={{ uri: icon.source.replace("/svg?", "/png?") }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.iconBackground}>
              <Ionicons name={icon?.name || 'notifications'} size={22} color={icon?.color || COLORS.white} />
            </View>
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.sender?.username || 'Thông báo mới'}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message || 'Bạn có thông báo mới'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={hideNotification}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40, // Điều chỉnh vị trí dựa trên status bar
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  closeButton: {
    padding: 4,
  },
});

export default NotificationPopup;