import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import { useFonts } from "expo-font";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { View, Text } from "react-native";
import { LanguageProvider } from "../context/LanguageContext";
import NotificationPopup from "../components/NotificationPopup";
import { io } from "socket.io-client"; // Thêm import socket
import { SOCKET_URL } from "../constants/api"; // Thêm import URL socket


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [appIsReady, setAppIsReady] = useState(false);
  const socketRef = useRef(null); // Thêm socket ref

  const { checkAuth, user, token, isCheckingAuth, incrementUnreadNotificationsCount } = useAuthStore();

  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  // Chuẩn bị ứng dụng trước khi render
  useEffect(() => {
    async function prepare() {
      try {
        // Chờ fonts load và kiểm tra auth xong
        await checkAuth();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        if (fontsLoaded) SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [fontsLoaded]);

  // Thiết lập kết nối socket khi đăng nhập
  useEffect(() => {
    if (appIsReady && token && user && !socketRef.current) {
      // Only connect if authenticated
      const socket = io(SOCKET_URL);
      socketRef.current = socket;

      // Tham gia vào phòng của người dùng
      socket.on('connect', () => {
        console.log('Layout: Connected to socket');
        socket.emit('joinUserRoom', user.id);
      });

      // Lắng nghe sự kiện thông báo mới để cập nhật badge
      socket.on('newNotification', () => {
        incrementUnreadNotificationsCount();
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [appIsReady, token, user]);

  // Chỉ điều hướng khi app đã sẵn sàng
  // useEffect(() => {
  //   if (!appIsReady) return;

  //   const inAuthScreen = segments[0] === "(auth)";
  //   const isSignedIn = user && token; // Dùng setTimeout với độ trễ nhỏ để đảm bảo component đã mount
  //   const timer = setTimeout(() => {
  //     // if (!isSignedIn && !inAuthScreen) {
  //     //   router.replace("(auth)");
  //     // } else 
  //     if (isSignedIn && inAuthScreen) {
  //       router.replace("/(tabs)");
  //     }
  //   }, 100);

  //   return () => clearTimeout(timer);
  // }, [appIsReady, user, token, segments]);
  useEffect(() => {
    if (!appIsReady) return;

    const inAuthScreen = segments[0] === "(auth)";
    // Chỉ chuyển hướng từ auth screen về tabs khi đã đăng nhập
    // Không tự động chuyển hướng từ tabs hoặc các trang khác đến auth screen
    if (inAuthScreen && user && token) {
      router.replace("/(tabs)");
    }
  }, [appIsReady, user, token, segments]);

  // Không render gì cả cho đến khi ứng dụng đã sẵn sàng
  if (!appIsReady) {
    return (
      <View style={{ flex: 1 }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Không render component NotificationPopup nếu chưa đăng nhập
  const shouldShowNotificationPopup = !!user && !!token;

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <LanguageProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="userprofile" />
            <Stack.Screen name="bookdetail" />
          </Stack>
        </LanguageProvider>
        {shouldShowNotificationPopup && <NotificationPopup />}
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
