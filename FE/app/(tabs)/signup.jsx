import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function SignupScreen() {
  useEffect(() => {
    // Redirect to the actual signup screen in the auth group
    router.replace('/(auth)/signup');
  }, []);
  
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Redirecting to signup...</Text>
    </View>
  );
}