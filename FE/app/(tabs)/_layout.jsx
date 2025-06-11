import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";

export default function TabLayout() {
  const inset = useSafeAreaInsets();
  const { token, user } = useAuthStore();
  const isAuthenticated = !!token && !!user;

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
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* Search tab - only visible when authenticated */}
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
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
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
          href: isAuthenticated ? "/notifications" : null,
        }}
      />

      {/* Profile tab - only visible when authenticated */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
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
          title: "Login",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-in-outline" size={size} color={color} />
          ),
          href: !isAuthenticated ? "/login" : null,
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
    </Tabs>
  );
}
