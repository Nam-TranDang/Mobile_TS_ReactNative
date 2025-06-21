import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  // Keyboard,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";
import styles from "../../assets/styles/search.styles";
import { useLanguage } from "../../context/LanguageContext";

export default function SearchScreen() {
  const { token } = useAuthStore();
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({
    users: [],
    books: [],
  });
  const [userBooks, setUserBooks] = useState({});
  const [loadingUserBooks, setLoadingUserBooks] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const { t, currentLanguage, changeLanguage } = useLanguage();
  

  // Focus vào input khi vào màn hình
  useEffect(() => {
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 300);
  }, []);

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

  // Lấy user details
  const fetchUserDetails = async (users) => {
    if (!users || users.length === 0) return;

    const userDetailsMap = {};

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
            followersCount: userData.followers ? userData.followers.length : 0,
            followingCount: userData.following ? userData.following.length : 0,
          };
        }
        return null;
      });

      await Promise.all(promises);
      setUserDetails(userDetailsMap);
    } catch (error) {
      console.error("Error fetching user details:", error);
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

  // Hiển thị kết quả người dùng
  const renderUserResult = ({ item }) => {
    // Xóa các biến không sử dụng để tránh warning

    return (
      <View style={styles.expandedResultContainer}>
        {/* Giữ nguyên phần User Header hiện tại */}
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => handleSelectUser(item)}
        >
          <Image
            source={{ uri: item.profileImage.replace("/svg?", "/png?") }}
            style={styles.resultUserAvatar}
          />
          <View style={styles.resultUserInfo}>
            <Text style={styles.resultUsername}>{item.username}</Text>

            <View style={styles.userStats}>
              <Text style={styles.userStat}>{item.bookCount || 0} {t("profile.book")} </Text>
              {userDetails[item._id] && (
                <>
                  <Text style={styles.userStatDot}>•</Text>
                  <Text style={styles.userStat}>
                    {userDetails[item._id].followersCount} {t("profile.followers")}
                  </Text>
                  <Text style={styles.userStatDot}>•</Text>
                  <Text style={styles.userStat}>
                    {userDetails[item._id].followingCount} {t("profile.following")}
                  </Text>
                </>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={styles.iconColor} />
        </TouchableOpacity>

        {/* Giữ nguyên phần User's Books hiện tại */}
        {loadingUserBooks && !userBooks[item._id] ? (
          <View style={styles.userBooksLoading}>
            <ActivityIndicator size="small" color={styles.loading.color} />
            <Text style={styles.userBooksLoadingText}>{t("profile.bookload")}</Text>
          </View>
        ) : userBooks[item._id] && userBooks[item._id].length > 0 ? (
          <View style={styles.userBooksContainer}>
            <Text style={styles.userBooksTitle}>{t("profile.booked")}</Text>
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
                <Text style={styles.viewAllBooksText}>{t("profile.seeall")}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ) : null}
      </View>
    );
  };

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
          {t("book.author")}: {item.author ? item.author : t("profile.noin4")}
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
            {t("profile.postedBy")}: {item.user.username || "---"}
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
          <Text style={styles.loadingText}>{t("profile.searching")}</Text>
        </View>
      );
    }

    if (searchText.trim() === "") {
      // Hiển thị màn hình trống khi chưa tìm kiếm
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="search-outline" size={80} color={styles.iconColor} />
          <Text style={styles.emptyStateText}>
            {t("profile.searchPlaceholder")}
          </Text>
        </View>
      );
    }

    const { users, books } = searchResults;
    const hasResults = users.length > 0 || books.length > 0;

    if (!hasResults) {
      return (
        <View style={styles.emptyResultContainer}>
          <Ionicons name="search-outline" size={50} color={styles.iconColor} />
          <Text style={styles.emptyResultText}>
            {t("profile.searchno")} {searchText}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.resultsContainer}>
        {/* Phần kết quả người dùng */}
        {users.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>{t("profile.user")}</Text>
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
            <Text style={styles.sectionTitle}>{t("profile.book")}</Text>
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
        {/* <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Keyboard.dismiss();
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={styles.textColor} />
        </TouchableOpacity> */}

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
            placeholder= {t("profile.searchPlaceholder")}
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
