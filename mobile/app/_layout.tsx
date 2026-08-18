import { Slot } from 'expo-router';
import { AuthProvider } from '@/src/context/auth';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Slot />
        <StatusBar />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
