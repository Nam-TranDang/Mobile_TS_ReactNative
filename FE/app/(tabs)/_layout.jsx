import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { View, Text } from "react-native";
import { useLanguage } from "../../context/LanguageContext";

export default function TabLayout() {
  const inset = useSafeAreaInsets();
  const { token, user, unreadNotificationsCount = 0 } = useAuthStore();
  const isAuthenticated = !!token && !!user;
  const { t, currentLanguage, changeLanguage } = useLanguage();

  // Chỉ hiển thị badge khi có thông báo chưa đọc
  const showBadge = unreadNotificationsCount > 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        headerTitleStyle: {
          color: COLORS.primary,
          fontWeight: "600",
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: COLORS.cardBackground,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: 5,
          paddingBottom: inset.bottom,
          height: 60 + inset.bottom,
        },
      }}
    >
      {/* Home tab - always visible */}
      <Tabs.Screen
        name="index"
        options={{
          title: t("Navbar.home") ,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Search tab - only visible when authenticated */}
      <Tabs.Screen
        name="search"
        options={{
          title: t("Navbar.search"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
          href: isAuthenticated ? "/search" : null,
        }}
      />

      {/* Notifications tab -  only visible when authenticated */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: t("Navbar.noti"), 
          tabBarIcon: ({ color, size }) => (
             <View>
              <Ionicons name="notifications-outline" size={size} color={color} />
              {showBadge && (
                <View style={{
                  position: 'absolute',
                  right: -3,
                  top: -3,
                  backgroundColor: 'red',
                  borderRadius: 9,
                  width: 15,
                  height: 15,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          href: isAuthenticated ? "/notifications" : null,
        }}
      />

      {/* Profile tab - only visible when authenticated */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t("Navbar.profile"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          href: isAuthenticated ? "/profile" : null,
        }}
      />

      {/* Login tab - only visible when NOT authenticated */}
      <Tabs.Screen
        name="login"
        options={{
          title: t("login.title"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-in-outline" size={size} color={color} />
          ),
          href: !isAuthenticated ? "/login" : null,
        }}
      />

      {/* Signup tab - only visible when NOT authenticated */}
      <Tabs.Screen
        name="signup"
        options={{
          title: t("login.signup"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-add-outline" size={size} color={color} />
          ),
          href: !isAuthenticated ? "/(auth)/signup" : null,
        }}
      />

      {/* Hidden tabs - always hidden from tab bar */}
      <Tabs.Screen
        name="editprofile"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          href: null,
          title: "Báo cáo",
        }}
      />

      <Tabs.Screen
        name="editbook"
        options={{
          href: null,
          title: "Edit Book",
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          href: null,
          title: "Create",
        }}
      />
      {/* Settings Tab - Hide from tab bar but keep the page accessible */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // This prevents the tab from showing in the tab bar
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
