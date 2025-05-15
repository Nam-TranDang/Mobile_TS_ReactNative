import { Link } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../store/authStore";

export default function Index() {
  const {user, token, checkAuth, logout} = useAuthStore();

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

      <Link href="/auth/signup">Sign Up</Link>
      <Link href="/auth">Login</Link>
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
