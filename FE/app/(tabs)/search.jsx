import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  // FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  Keyboard,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";
import styles from "../../assets/styles/search.styles";
// import defaultAvatar from "../../assets/images/user-128.svg";

export default function SearchScreen() {
  const { token } = useAuthStore();
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({
    users: [],
    books: [],
  });
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [userBooks, setUserBooks] = useState({});
  const [loadingUserBooks, setLoadingUserBooks] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Focus vào input khi vào màn hình
  useEffect(() => {
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 300);

    fetchSuggestedUsers();
  }, []);

  // Lấy danh sách người dùng gợi ý
  const fetchSuggestedUsers = async () => {
    try {
      setLoadingSuggestions(true);
      const response = await fetch(`${API_URL}/users/suggestions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedUsers(data || []);
      }
    } catch (error) {
      console.error("Error fetching suggested users:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Xử lý tìm kiếm
  const handleSearch = (text) => {
    setSearchText(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim()) {
      setIsLoading(true);

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(text);
      }, 500);
    } else {
      setSearchResults({ users: [], books: [] });
      setIsLoading(false);
    }
  };

  // Thực hiện tìm kiếm
  const performSearch = async (query) => {
    try {
      // Tìm kiếm người dùng
      const usersResponse = await fetch(
        `${API_URL}/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Tìm kiếm sách
      const booksResponse = await fetch(
        `${API_URL}/books/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const users = await usersResponse.json();
      const books = await booksResponse.json();

      setSearchResults({
        users: users || [],
        books: books || [],
      });

      // Nếu có kết quả người dùng, fetch chi tiết và sách của họ
      if (users && users.length > 0) {
        fetchUserBooks(users);
        fetchUserDetails(users); // Thêm gọi hàm fetch user details
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy sách của từng người dùng
  const fetchUserBooks = async (users) => {
    if (!users || users.length === 0) return;

    setLoadingUserBooks(true);
    const userBooksMap = {};

    try {
      // Tạo mảng các promises để fetch sách của tất cả người dùng cùng lúc
      const promises = users.map(async (user) => {
        const response = await fetch(
          `${API_URL}/books?user=${user._id}&limit=10`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          userBooksMap[user._id] = data.books || [];
        }
        return null;
      });

      // Đợi tất cả các requests hoàn thành
      await Promise.all(promises);
      setUserBooks(userBooksMap);
    } catch (error) {
      console.error("Error fetching user books:", error);
    } finally {
      setLoadingUserBooks(false);
    }
  };

  // Thêm hàm fetchUserDetails sau fetchUserBooks
  const fetchUserDetails = async (users) => {
    if (!users || users.length === 0) return;

    setLoadingUserDetails(true);
    const userDetailsMap = {};
    const { id: currentUserId } = useAuthStore.getState();

    try {
      // Lấy thông tin chi tiết của mỗi người dùng
      const promises = users.map(async (user) => {
        const response = await fetch(`${API_URL}/users/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const userData = await response.json();
          userDetailsMap[user._id] = {
            ...userData,
            followersCount: userData.followersCount || 0,
            followingCount: userData.followingCount || 0,
            postsCount: userData.postsCount || 0,
            isFollowing: userData.followers?.includes(currentUserId) || false,
          };
        }
        return null;
      });

      await Promise.all(promises);
      setUserDetails(userDetailsMap);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Điều hướng đến trang người dùng
  const handleSelectUser = (user) => {
    router.push({
      pathname: "/userprofile",
      params: { userId: user._id },
    });
  };

  // Điều hướng đến trang sách
  const handleSelectBook = (book) => {
    router.push({
      pathname: "/bookdetail",
      params: { bookId: book._id },
    });
  };

  // Hiển thị danh sách người dùng gợi ý (avatar)
  const renderUserAvatars = () => {
    if (loadingSuggestions) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={styles.loading.color} />
        </View>
      );
    }

    if (suggestedUsers.length === 0) {
      return null;
    }

    return (
      <View style={styles.avatarsSection}>
        <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarsContainer}
        >
          {suggestedUsers.map((user) => (
            <TouchableOpacity
              key={user._id}
              style={styles.avatarItem}
              onPress={() => handleSelectUser(user)}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: user.profileImage.replace('/svg?', '/png?') }}
                  style={styles.avatarImage}
                />
              </View>
              <Text style={styles.avatarUsername} numberOfLines={1}>
                {user.username}
              </Text>
              <Text style={styles.bookCount}>{user.bookCount || 0} sách</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Hiển thị kết quả người dùng
  const renderUserResult = ({ item }) => (
    <View style={styles.expandedResultContainer}>
      {/* User Header */}
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleSelectUser(item)}
      >
        <Image
          source={{ uri: item.profileImage.replace('/svg?', '/png?') }}
          style={styles.resultUserAvatar}
        />
        <View style={styles.resultUserInfo}>
          <Text style={styles.resultUsername}>{item.username}</Text>

          {/* Sửa phần này: Luôn sử dụng bookCount từ kết quả tìm kiếm */}
          <View style={styles.userStats}>
            <Text style={styles.userStat}>{item.bookCount || 0} sách</Text>
            {userDetails[item._id] && (
              <>
                <Text style={styles.userStatDot}>•</Text>
                <Text style={styles.userStat}>
                  {userDetails[item._id].followersCount} người theo dõi
                </Text>
                <Text style={styles.userStatDot}>•</Text>
                <Text style={styles.userStat}>
                  {userDetails[item._id].followingCount} đang theo dõi
                </Text>
              </>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={styles.iconColor} />
      </TouchableOpacity>

      {/* User's Books */}
      {loadingUserBooks && !userBooks[item._id] ? (
        <View style={styles.userBooksLoading}>
          <ActivityIndicator size="small" color={styles.loading.color} />
          <Text style={styles.userBooksLoadingText}>Đang tải sách...</Text>
        </View>
      ) : userBooks[item._id] && userBooks[item._id].length > 0 ? (
        <View style={styles.userBooksContainer}>
          <Text style={styles.userBooksTitle}>Sách đã đăng</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.userBooksScrollContent}
          >
            {userBooks[item._id].map((book) => (
              <TouchableOpacity
                key={book._id}
                style={styles.userBookItem}
                onPress={() => handleSelectBook(book)}
              >
                <Image
                  source={{
                    uri: book.image || "https://via.placeholder.com/100",
                  }}
                  style={styles.userBookCover}
                />
                <Text numberOfLines={2} style={styles.userBookTitle}>
                  {book.title}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.viewAllBooks}
              onPress={() => handleSelectUser(item)}
            >
              <View style={styles.viewAllBooksCircle}>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={styles.iconColor}
                />
              </View>
              <Text style={styles.viewAllBooksText}>Xem tất cả</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );

  // Hiển thị kết quả sách
  const renderBookResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectBook(item)}
    >
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/50" }}
        style={styles.resultBookCover}
      />
      <View style={styles.resultBookInfo}>
        <Text style={styles.resultBookTitle}>{item.title}</Text>
        <Text style={styles.resultBookAuthor}>
          Tác giả: {item.author ? item.author : "Không có thông tin"}
        </Text>
        <View style={styles.resultBookRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= item.rating ? "star" : "star-outline"}
              size={12}
              color={star <= item.rating ? "#f4b400" : styles.ratingColor}
              style={{ marginRight: 2 }}
            />
          ))}
        </View>
        {item.user && (
          <Text style={styles.postedByText}>
            Đăng bởi: {item.user.username || "---"}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={styles.iconColor} />
    </TouchableOpacity>
  );

  // Hiển thị kết quả tìm kiếm
  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={styles.loading.color} />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      );
    }

    if (searchText.trim() === "") {
      // Hiển thị gợi ý người dùng khi chưa tìm kiếm
      return renderUserAvatars();
    }

    const { users, books } = searchResults;
    const hasResults = users.length > 0 || books.length > 0;

    if (!hasResults) {
      return (
        <View style={styles.emptyResultContainer}>
          <Ionicons name="search-outline" size={50} color={styles.iconColor} />
          <Text style={styles.emptyResultText}>
            Không tìm thấy kết quả cho {searchText}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.resultsContainer}>
        {/* Phần kết quả người dùng */}
        {users.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Người dùng</Text>
            {users.map((user) => (
              <View key={`user-${user._id}`}>
                {renderUserResult({ item: user })}
              </View>
            ))}
          </View>
        )}

        {/* Phần kết quả sách */}
        {books.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Sách</Text>
            {books.map((book) => (
              <View key={`book-${book._id}`}>
                {renderBookResult({ item: book })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header with Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Keyboard.dismiss(); // Ẩn bàn phím trước khi quay lại
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={styles.textColor} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={styles.searchIconColor}
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Tìm kiếm người dùng, sách..."
            placeholderTextColor={styles.placeholderColor}
            value={searchText}
            onChangeText={handleSearch}
            autoFocus={true}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchText("")}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={styles.searchIconColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>{renderSearchResults()}</View>
    </SafeAreaView>
  );
}
