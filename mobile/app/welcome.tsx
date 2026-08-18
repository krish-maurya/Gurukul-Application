import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button } from '@/src/components/UI';
import { Colors, Spacing, Radius, FontSize } from '@/src/theme';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name="school-outline" size={40} color="#ffffff" />
      </View>
      <Text style={styles.title}>Welcome to Gurukul</Text>
      <Text style={styles.subtitle}>Your administrator has set up your account. You can now access the school management system.</Text>
      <Button variant="primary" size="md" fullWidth onPress={() => router.replace('/(tabs)')}>
        Go to Dashboard
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxxl },
  iconBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxl },
  title: { fontSize: 24, fontWeight: '700', color: Colors.ink, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xxxl, maxWidth: 300 },
});