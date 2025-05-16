import { Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function Home() {
  const { logout } = useAuthStore();

  return (
    <View>
      <Text>Home tabs</Text>

      <TouchableOpacity onPress={logout}>
        <Text>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}