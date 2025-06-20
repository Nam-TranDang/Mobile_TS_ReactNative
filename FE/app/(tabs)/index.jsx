import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  RefreshControl,
  // TextInput,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  // Keyboard,
} from "react-native";
import { useRouter } from "expo-router"; // Add this import
import styles from "../../assets/styles/home.styles";
import Loader from "../../components/Loader";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import { formatPublishDate } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import logo from "../../assets/images/logo.png"
import { useLanguage } from "../../context/LanguageContext";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const { token, user } = useAuthStore();
  const isAuthenticated = !!token && !!user;

  const router = useRouter(); // Add this line
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // State for filter/search
  // const [searchText, setSearchText] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [sortOption, setSortOption] = useState("newest");
  const [sortDirection, setSortDirection] = useState("desc");
  const [timeFilter, setTimeFilter] = useState("Any time");
  const [categoryFilter, setcategoryFilter] = useState("Any");

  // Dropdown state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSortOptionPicker, setShowSortOptionPicker] = useState(false);
  const [showSortDirectionPicker, setShowSortDirectionPicker] = useState(false);
  const { t, currentLanguage, changeLanguage } = useLanguage();

  const fetchBooks = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        resetFilters();
      } else if (pageNum === 1) {
        setLoading(true);
      }

      // For non-authenticated users, limit to first page only
      if (!isAuthenticated && pageNum > 1) {
        setHasMore(false);
        return;
      }
      const response = await fetch(`${API_URL}/books?page=${pageNum}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch books");
      }

      const uniqueBooks =
        refresh || pageNum === 1
          ? data.books
          : Array.from(
              new Set([...books, ...data.books].map((book) => book._id))
            ).map((id) =>
              [...books, ...data.books].find((book) => book._id === id)
            );

      setBooks(uniqueBooks);
      // For non-authenticated users, always set hasMore to false after first page
      setHasMore(isAuthenticated ? pageNum < data.totalPages : false);
      setPage(pageNum);
      //sau khi load sách thì filter, rồi khi hết 5 cuốn thì tiếp tục load và filter đến hết các sách
      applyFiltersAndSort(uniqueBooks);
    } catch (error) {
      console.log("Error fetching books:", error);
    } finally {
      if (refresh) {
        await sleep(800);
        setRefreshing(false);
      } else setLoading(false);
    }
  };

  const resetFilters = () => {
    setSortOption("newest");
    setSortDirection("desc");
    setTimeFilter("Any time");
    setcategoryFilter("Any");
    // setSearchText("");
  };

  const applyFiltersAndSort = (booksToFilter = books) => {
    // Start with all books
    let filtered = [...booksToFilter];

    // Apply search text filter (search by title, caption, or author)
    // if (searchText.trim() !== "") {
    //   filtered = filtered.filter(
    //     (book) =>
    //       book.title.toLowerCase().includes(searchText.toLowerCase()) ||
    //       book.caption.toLowerCase().includes(searchText.toLowerCase()) ||
    //       book.user.username.toLowerCase().includes(searchText.toLowerCase())
    //   );
    // }

    // Apply time filter
    if (timeFilter !== "Any time") {
      const now = new Date();
      let cutoffDate = new Date();
      switch (timeFilter) {
        case "Today":
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case "This week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "This month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "This year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      filtered = filtered.filter(
        (book) => new Date(book.createdAt) >= cutoffDate
      );
    }

    // Apply category filter (assuming we had a category field)
    if (categoryFilter !== "Any") {
      // (hàm chờ) This is a placeholder. You'd implement category filtering if your books had categories
      // filtered = filtered.filter(book => book.category === categoryFilter);
    }

    // Apply sort based on sortOption and sortDirection
    let sortedBooks = [...filtered];
    switch (sortOption) {
      case "title":
        sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "author":
        sortedBooks.sort((a, b) =>
          a.user.username.localeCompare(b.user.username)
        );
        break;
      case "rating":
        sortedBooks.sort((a, b) => a.rating - b.rating);
        break;
      case "newest":
      default:
        sortedBooks.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
    }

    // Apply sort direction
    if (sortDirection === "desc") {
      sortedBooks.reverse();
    }

    setFilteredBooks(sortedBooks);
  };

  // Re-apply filters whenever any filter criteria changes
  useEffect(() => {
    applyFiltersAndSort();
  }, [sortOption, sortDirection, timeFilter, categoryFilter]);

  useEffect(() => {
    fetchBooks();
  }, [isAuthenticated]);

  const handleLoadMore = async () => {
    // Only load more when we're not filtering by search text or author
    if (
      isAuthenticated &&
      hasMore &&
      !loading &&
      !refreshing &&
      // searchText.trim() === "" &&
      timeFilter === "Any time" &&
      categoryFilter === "Any"
    ) {
      await sleep(1000);
      await fetchBooks(page + 1);
    }
  };

  const handleBookClick = (bookId) => {
    if (isAuthenticated) {
      router.push({
        pathname: "/bookdetail",
        params: { bookId },
      });
    } else {
      // Show login prompt
      showLoginPrompt();
    }
  };

  const handleUserClick = (userId) => {
    if (isAuthenticated) {
      router.push({
        pathname: "/userprofile",
        params: { userId },
      });
    } else {
      showLoginPrompt();
    }
  };

  const showLoginPrompt = () => {
    // Navigate to login screen with the ability to go back
    router.push("/(auth)/");
  };

  // const handleSearch = (text) => {
  //   setSearchText(text);
  // };

  // const clearSearch = () => {
  //   setSearchText("");
  //   Keyboard.dismiss();
  // };

  const applyFilters = () => {
    applyFiltersAndSort();
    setShowFilterModal(false);
  };

  // Render book item
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => handleBookClick(item._id)}
    >
      {/* Header of the book card */}
      <View style={styles.bookHeader}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={(e) => {
            e.stopPropagation();
            handleUserClick(item.user._id);
          }}
        >
          <Image
            source={{ uri: item.user.profileImage }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{item.user.username}</Text>
        </TouchableOpacity>
      </View>
      {/* Book container */}
      <View style={styles.bookImageContainer}>
        <Image
          source={item.image}
          style={styles.bookImage}
          contentFit="cover"
        />
      </View>

      {/* Star rating */}
      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <View style={styles.ratingContainer}>
          {renderRatingStars(item.rating)}
        </View>
        <Text style={styles.caption}>{item.caption}</Text>
        <Text style={styles.date}>
          Shared on {formatPublishDate(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  // Search bar component
  // const renderSearchBar = () => (
  //   <View style={styles.searchContainer}>
  //     <TouchableOpacity
  //       style={styles.searchInputContainer}
  //       activeOpacity={0.7}
  //       onPress={() => router.push("/(tabs)/search")}
  //     >
  //       <Ionicons
  //         name="search"
  //         size={20}
  //         color={COLORS.textSecondary}
  //         style={styles.searchIcon}
  //       />
  //       <Text style={styles.searchPlaceholder}>Search books or authors...</Text>
  //     </TouchableOpacity>
  //     <TouchableOpacity
  //       style={styles.sortButton}
  //       onPress={() => setShowFilterModal(true)}
  //     >
  //       <Ionicons name="filter" size={20} color={COLORS.white} />
  //     </TouchableOpacity>
  //   </View>
  // );

  const renderRecommendationBar = () => (
    <View style={styles.searchContainer}>
      <TouchableOpacity
        style={styles.searchInputContainer}
        activeOpacity={0.7}
        onPress={() => {
          // Check if user is authenticated before navigating
          if (isAuthenticated) {
            router.push("/(tabs)/create");
          } else {
            // If not authenticated, redirect to login screen
            router.push("/(auth)/");
          }
        }}
      >
        <Ionicons
          name="add-circle-outline"
          size={20}
          color={COLORS.textSecondary}
          style={styles.searchIcon}
        />
        <Text style={styles.searchPlaceholder}>{t('Notification.whb')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowFilterModal(true)}
      >
        <Ionicons name="filter" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      transparent={true}
      visible={showFilterModal}
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          setShowFilterModal(false);
          setShowTimePicker(false);
          setShowCategoryPicker(false);
          setShowSortOptionPicker(false);
          setShowSortDirectionPicker(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterPanelContent}>
            {/* Filter header */}
            <Text style={styles.filterPanelTitle}>Filters</Text>

            {/* Last updated section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>{t('filter.anyt')}:</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowTimePicker(!showTimePicker);
                  setShowCategoryPicker(false);
                  setShowSortOptionPicker(false);
                  setShowSortDirectionPicker(false);
                }}
              >
                <Text style={styles.dropdownText}>{timeFilter}</Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              {showTimePicker && (
                <View style={styles.dropdownMenu}>
                  {[
                    t('filter.anyt'),
                    t('filter.tday'),
                    t('filter.thweek'),
                    t('filter.thmonth'),
                    t('filter.thyear'),
                  ].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setTimeFilter(option);
                        setShowTimePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          timeFilter === option &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                      {timeFilter === option && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Book category section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>{t('filter.category')}:</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowCategoryPicker(!showCategoryPicker);
                  setShowTimePicker(false);
                  setShowSortOptionPicker(false);
                  setShowSortDirectionPicker(false);
                }}
              >
                <Text style={styles.dropdownText}>{categoryFilter}</Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              {showCategoryPicker && (
                <View style={styles.dropdownMenu}>
                  {["Any", "Fiction", "Non-fiction", "Science", "History"].map(
                    (option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setcategoryFilter(option);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            categoryFilter === option &&
                              styles.dropdownItemTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                        {categoryFilter === option && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={COLORS.primary}
                          />
                        )}
                      </TouchableOpacity>
                    )
                  )}
                </View>
              )}
            </View>

            {/* Sort by section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}> {t('filter.sortBy')}:</Text>
              <View style={styles.sortByRow}>
                <TouchableOpacity
                  style={[styles.dropdown, styles.sortDropdown]}
                  onPress={() => {
                    setShowSortOptionPicker(!showSortOptionPicker);
                    setShowTimePicker(false);
                    setShowCategoryPicker(false);
                    setShowSortDirectionPicker(false);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {sortOption === "newest"
                      ? "Time"
                      : sortOption === "title"
                      ? "Title"
                      : sortOption === "author"
                      ? "Author"
                      : sortOption === "rating"
                      ? "Rating"
                      : "Time"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dropdown, styles.sortDropdown]}
                  onPress={() => {
                    setShowSortDirectionPicker(!showSortDirectionPicker);
                    setShowTimePicker(false);
                    setShowCategoryPicker(false);
                    setShowSortOptionPicker(false);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {sortDirection === "desc" ? "Descending" : "Ascending"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {showSortOptionPicker && (
                <View
                  style={[
                    styles.dropdownMenu,
                    styles.sortDropdownMenu,
                    // Hiển thị danh sách lên trên
                    { bottom: "100%", top: "auto", marginBottom: 5 },
                  ]}
                >
                  {[
                    { value: "newest", label: t('filter.time') },
                    { value: "title", label: t('filter.title') },
                    { value: "author", label: t('filter.author') },
                    { value: "rating", label: t('filter.rating') },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSortOption(option.value);
                        setShowSortOptionPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          sortOption === option.value &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {sortOption === option.value && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {showSortDirectionPicker && (
                <View
                  style={[
                    styles.dropdownMenu,
                    styles.sortDirectionDropdownMenu,
                    // Thêm logic hiển thị lên trên thay vì xuống dưới
                    { bottom: "100%", top: "auto", marginBottom: 5 },
                  ]}
                >
                  {[
                    { value: "asc", label: t('filter.as') },
                    { value: "desc", label: t('filter.de') },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSortDirection(option.value);
                        setShowSortDirectionPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          sortDirection === option.value &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {sortDirection === option.value && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Filter button */}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={applyFilters}
            >
              <Text style={styles.filterButtonText}>{t('filter.fil')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Login prompt component for non-authenticated users
  const LoginPrompt = () => (
    <View style={styles.loginPromptContainer}>
      <Ionicons name="lock-closed" size={40} color={COLORS.primary} />
      <Text style={styles.loginPromptTitle}>Login Required</Text>
      <Text style={styles.loginPromptText}>
        You need to login to see more books and access all features
      </Text>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => router.push("/(auth)/")}
      >
        <Text style={styles.loginButtonText}>Login / Register</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) return <Loader size="large" />;

  return (
    <View style={styles.container}>
      {/* {renderSearchBar()} */}
      
      {renderFilterModal()}
      <FlatList
        data={filteredBooks}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBooks(1, true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('Notification.wlc1')}</Text>
          <Image 
            source={logo} 
            style={{ width: 120, height: 110 ,position: "absolute" ,right: 0,}}
            resizeMode="contain"
          />
            <Text style={styles.headerTitle2 }>{t('Notification.wlc2')}</Text>
            {renderRecommendationBar()}
          </View>
        }
        ListFooterComponent={
          <>
            {!isAuthenticated && books.length > 0 && <LoginPrompt />}
            {isAuthenticated &&
              hasMore &&
              books.length > 0 &&
              timeFilter === "Any time" &&
              categoryFilter === "Any" && (
                <ActivityIndicator
                  style={styles.footerLoader}
                  size="small"
                  color={COLORS.primary}
                />
              )}
          </>
        }        
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={60}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>
              {timeFilter !== "Any time" ||
              categoryFilter !== "Any"
                ? "No results found"
                : "No recommendations yet"}
            </Text>
            {timeFilter !== "Any time" ||
            categoryFilter !== "Any" ? (
              <Text style={styles.emptySubtext}>Try different filters</Text>
            ) : (
              <Text style={styles.emptySubtext}>
                Be the first to share a book!
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}
