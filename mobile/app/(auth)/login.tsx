import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/context/auth';
import { Button, Input } from '@/src/components/UI';
import { Colors, Radius, FontSize, Spacing } from '@/src/theme';
import type { UserRole } from '@/src/theme';

export default function LoginScreen() {
  const { login, user } = useAuth();
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email and password are required.');
      return;
    }
    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.ok) {
      Alert.alert('Login Failed', result.error || 'Invalid credentials.');
      return;
    }
    if (user?.role === 'TEACHER') {
      router.replace('/welcome');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <View style={styles.logoBox}>
          <Ionicons name="school-outline" size={36} color="#ffffff" />
        </View>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your Gurukul workspace</Text>

        <View style={styles.tabWrap}>
          <Pressable style={[styles.tab, role === 'ADMIN' && styles.tabActive]} onPress={() => setRole('ADMIN')}>
            <Ionicons name="shield-checkmark-outline" size={16} color={role === 'ADMIN' ? Colors.accent : Colors.muted} />
            <Text style={[styles.tabText, role === 'ADMIN' && styles.tabTextActive]}>Admin</Text>
          </Pressable>
          <Pressable style={[styles.tab, role === 'TEACHER' && styles.tabActive]} onPress={() => setRole('TEACHER')}>
            <Ionicons name="person-outline" size={16} color={role === 'TEACHER' ? Colors.accent : Colors.muted} />
            <Text style={[styles.tabText, role === 'TEACHER' && styles.tabTextActive]}>Teacher</Text>
          </Pressable>
        </View>

        <Input placeholder={role === 'ADMIN' ? 'Admin email' : 'Teacher email'} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

        <View style={styles.pwWrap}>
          <TextInput style={styles.pwInput} placeholder="Password" placeholderTextColor={Colors.faint} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <Pressable onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn} hitSlop={8}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.muted} />
          </Pressable>
        </View>

        <Button variant="primary" size="md" fullWidth disabled={loading} onPress={handleLogin} style={{ marginTop: Spacing.md }}>
          {loading ? 'Signing in...' : 'Continue'}
        </Button>

        <Text style={styles.footer}>
          {role === 'TEACHER'
            ? 'New here? Open the invitation link from your administrator.'
            : 'Access managed by your school. Contact IT for help.'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 120 },
  logoBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1e3a8a', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: '700', color: Colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 13, color: Colors.muted, marginBottom: 24 },
  tabWrap: { flexDirection: 'row', borderWidth: 1, borderColor: Colors.line, borderRadius: 8, marginBottom: 20, overflow: 'hidden' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: 'transparent' },
  tabActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 12, fontWeight: '500', color: Colors.muted },
  tabTextActive: { color: Colors.ink },
  pwWrap: { position: 'relative', marginBottom: 16 },
  pwInput: { borderWidth: 1, borderColor: Colors.lineStrong, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12, paddingRight: 44, fontSize: 14, color: Colors.ink, backgroundColor: Colors.surface, minHeight: 44 },
  eyeBtn: { position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center' },
  footer: { fontSize: 10, color: Colors.faint, textAlign: 'center', marginTop: 28 },
});
