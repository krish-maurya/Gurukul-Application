import React from 'react';
import { Stack } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AuthProvider } from '@/src/context/auth';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/src/theme';

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><StatusBar style="dark" backgroundColor={Colors.surface}/><Stack screenOptions={{headerStyle:{backgroundColor:Colors.surface},headerTintColor:Colors.ink,headerTitleStyle:{fontWeight:'700'},contentStyle:{backgroundColor:Colors.canvas}}}><Stack.Screen name="(auth)" options={{headerShown:false}}/><Stack.Screen name="(tabs)" options={{headerShown:false}}/><Stack.Screen name="welcome" options={{headerShown:false}}/><Stack.Screen name="staff/index" options={{title:'Staff Directory'}}/><Stack.Screen name="student/[id]" options={{title:'Student Profile'}}/><Stack.Screen name="communications" options={{title:'Parent Connect'}}/><Stack.Screen name="documents" options={{title:'Documents'}}/><Stack.Screen name="notifications" options={{title:'Notifications'}}/></Stack></AuthProvider></SafeAreaProvider>;
}

// In a release APK, display an actionable recovery view instead of closing on
// an unexpected JavaScript rendering error.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <View style={styles.error}><Text style={styles.title}>Gurukul needs to restart</Text><Text style={styles.message}>{error.message || 'An unexpected app error occurred.'}</Text><Pressable onPress={retry} style={styles.button}><Text style={styles.buttonText}>Try again</Text></Pressable></View>;
}
const styles=StyleSheet.create({error:{flex:1,backgroundColor:Colors.canvas,justifyContent:'center',padding:Spacing.xl},title:{fontSize:22,fontWeight:'700',color:Colors.ink,textAlign:'center'},message:{fontSize:14,color:Colors.muted,textAlign:'center',marginTop:Spacing.md},button:{marginTop:Spacing.xl,backgroundColor:Colors.accent,padding:14,borderRadius:10},buttonText:{color:'#fff',fontSize:15,fontWeight:'700',textAlign:'center'}});
