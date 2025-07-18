import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import COLORS from "../../constants/colors";

export default function LoginTab() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to auth screen
    router.replace("/(auth)");
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {/* <Text style={{ marginTop: 20 }}>Redirecting to login...</Text> */}
    </View>
  );
}