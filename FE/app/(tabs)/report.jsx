import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import COLORS from '../../constants/colors';
import styles from "../../assets/styles/reportBook.styles";

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [reasonType, setReasonType] = useState('');
  const [description, setDescription] = useState('');
  const [itemDetails, setItemDetails] = useState(null);

  // Lấy thông tin từ params URL
  const reportedItemType = params.type || 'Book'; // Mặc định là Book
  const reportedItemId = params.id; // ID của sách hoặc bình luận hoặc người dùng cần báo cáo
  
  // Các lý do báo cáo dựa trên loại item
  const getReasonOptions = () => {
    if (reportedItemType === 'Book') {
      return [
        { value: 'Nội dung không phù hợp'},
        { value: 'Vi phạm bản quyền'},
        { value: 'Thông tin sai lệch'},
        { value: 'Spam hoặc quảng cáo' },
        { value: 'Lý do khác'},
      ];
    } else if (reportedItemType === 'Comment') {
      return [
        { value: 'Quấy rối hoặc bắt nạt'},
        { value: 'Ngôn từ thù hận' },
        { value: 'Spam hoặc quảng cáo'},
        { value: 'Lý do khác'},
      ];
    } else if (reportedItemType === 'User') {
      return [
        { value: 'Tài khoản giả mạo'},
        { value: 'Hành vi không phù hợp'},
        { value: 'Spam hoặc quảng cáo' },
        { value: 'Lý do khác'},
      ];
    }
    return [];
  };

// Modified useEffect for fetching item details
useEffect(() => {
  if (!reportedItemId) {
    Alert.alert(
      "Lỗi",
      "Không tìm thấy ID của mục cần báo cáo",
      [{ text: "Quay lại", onPress: () => router.back() }]
    );
    return;
  }

  const fetchItemDetails = async () => {
    try {
      setIsLoading(true);
      let endpoint = '';
      
      if (reportedItemType === 'Comment') {
        // For comments, use the data passed from the previous screen
        // instead of making an API call
        const commentText = params.commentText;
        const commentAuthor = params.commentAuthor;
        
        if (commentText && commentAuthor) {
          setItemDetails({
            text: commentText,
            user: { username: commentAuthor }
          });
        } else {
          // Fallback for comments without passed data
          setItemDetails({
            text: "Bình luận đã được chọn",
            user: { username: "Người dùng" }
          });
        }
      } else if (reportedItemType === 'Book') {
        endpoint = `${API_URL}/books/${reportedItemId}`;
      } else if (reportedItemType === 'User') {
        endpoint = `${API_URL}/users/${reportedItemId}`;
      }

      // Only make API call if we have an endpoint (for books and users)
      if (endpoint) {
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Không thể tải thông tin chi tiết');
        }

        const data = await response.json();
        setItemDetails(data);
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
      Alert.alert(
        "Lỗi",
        "Không thể tải thông tin chi tiết. Vui lòng thử lại sau.",
        [{ text: "Quay lại", onPress: () => router.back() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  fetchItemDetails();
  // Remove params from dependency array to avoid infinite loop
}, [reportedItemId, reportedItemType, token, router]);

  // Gửi báo cáo
  const handleSubmitReport = async () => {
    if (!reasonType) {
      Alert.alert("Thông báo", "Vui lòng chọn lý do báo cáo");
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reportedItemType,
          reportedItemId,
          reason: reasonType,
          description: description.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi báo cáo');
      }

      // Báo cáo thành công
      Alert.alert(
        "Thành công",
        "Báo cáo của bạn đã được gửi thành công. Chúng tôi sẽ xem xét sớm nhất có thể.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        "Lỗi",
        error.message || "Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Hiển thị chi tiết của item được báo cáo
  const renderItemDetails = () => {
    if (!itemDetails) return null;

    if (reportedItemType === 'Book') {
      return (
        <View style={styles.itemDetailsContainer}>
          <Text style={styles.detailLabel}>Sách:</Text>
          <Text style={styles.detailTitle}>{itemDetails.title}</Text>
          <Text style={styles.detailAuthor}>
            Tác giả: {itemDetails.user?.username || "Không xác định"}
          </Text>
        </View>
      );
    } else if (reportedItemType === 'Comment') {
      return (
        <View style={styles.itemDetailsContainer}>
          <Text style={styles.detailLabel}>Bình luận:</Text>
          <Text style={styles.detailComment}>{itemDetails.text}</Text>
          <Text style={styles.detailAuthor}>
            Người viết: {itemDetails.user?.username || "Không xác định"}
          </Text>
        </View>
      );
    } else if (reportedItemType === 'User') {
      return (
        <View style={styles.itemDetailsContainer}>
          <Text style={styles.detailLabel}>Người dùng:</Text>
          <Text style={styles.detailTitle}>{itemDetails.username}</Text>
          <Text style={styles.detailAuthor}>{itemDetails.email}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Báo cáo nội dung</Text>
          <View style={styles.placeholder} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {renderItemDetails()}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Vui lòng chọn lý do báo cáo:
              </Text>
              
              {getReasonOptions().map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.reasonOption,
                    reasonType === option.value && styles.reasonOptionSelected
                  ]}
                  onPress={() => setReasonType(option.value)}
                >
                  <View style={styles.radioButton}>
                    {reasonType === option.value && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.reasonText}>{option.value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Mô tả chi tiết (không bắt buộc):
              </Text>
              <TextInput
                style={styles.descriptionInput}
                multiline
                numberOfLines={5}
                placeholder="Nhập thông tin chi tiết về vấn đề bạn gặp phải..."
                placeholderTextColor={COLORS.textSecondary}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitReport}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
              )}
            </TouchableOpacity>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}