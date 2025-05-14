import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";

export default function Index() {
  const [user, token, checkAuth, logout] = useAuthStore();

  console.log(user, token);

  useEffect(() => {
    checkAuth();
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello {user?.username}</Text>
      <Text style={styles.title}>Token: {token}</Text>

      <TouchableOpacity onPress={logout}>
        <Text>Log out</Text>
      </TouchableOpacity>

      <Link href="./auth/signup.jsx">Sign Up</Link>
      <Link href="./auth/login.jsx">Login</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
