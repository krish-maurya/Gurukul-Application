import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/src/context/auth';
import { AppErrorBoundary } from '@/src/components/AppErrorBoundary';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@/src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AuthProvider>
          <StatusBar style="dark" backgroundColor={Colors.surface} />
          <Stack screenOptions={{ headerStyle:{ backgroundColor:Colors.surface }, headerTintColor:Colors.ink, headerTitleStyle:{ fontWeight:'700' }, contentStyle:{ backgroundColor:Colors.canvas } }}>
            <Stack.Screen name="index" options={{ headerShown:false }}/>
            <Stack.Screen name="(auth)" options={{ headerShown:false }}/>
            <Stack.Screen name="(tabs)" options={{ headerShown:false }}/>
            <Stack.Screen name="welcome" options={{ headerShown:false }}/>
            <Stack.Screen name="staff/index" options={{ title:'Staff Directory' }}/>
            <Stack.Screen name="student/[id]" options={{ title:'Student Profile' }}/>
            <Stack.Screen name="communications" options={{ title:'Parent Connect' }}/>
            <Stack.Screen name="documents" options={{ title:'Documents' }}/>
            <Stack.Screen name="notifications" options={{ title:'Notifications' }}/>
          </Stack>
        </AuthProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
