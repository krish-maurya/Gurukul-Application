import React, { useState } from "react";
import { StyleSheet, View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/src/context/auth";
import { Button } from "@/src/components/UI";
import { Colors, Radius, FontSize, Spacing } from "@/src/theme";
import type { UserRole } from "@/src/theme";

const appIcon = require("../../assets/icon.png");

export default function LoginScreen() {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return Alert.alert("Sign in required", "Enter your email and password to continue.");
    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.ok) return Alert.alert("Could not sign in", result.error || "Check your credentials and try again.");
    router.replace(result.user?.role === "TEACHER" ? "/welcome" : "/(tabs)");
  };
  return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}><View style={styles.logoShell}><Image source={appIcon} style={styles.logo} resizeMode="contain" /></View><View><Text style={styles.brandName}>Gurukul</Text><Text style={styles.brandCaption}>School workspace</Text></View></View>
      <View style={styles.hero}><Text style={styles.heading}>Welcome back</Text><Text style={styles.subtitle}>Sign in to manage your school day with ease.</Text></View>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Sign in to continue</Text>
        <View style={styles.roleSwitch}>{(["ADMIN", "TEACHER"] as UserRole[]).map((item) => { const selected = role === item; return <Pressable key={item} onPress={() => setRole(item)} style={[styles.roleTab, selected && styles.roleTabActive]}><Ionicons name={item === "ADMIN" ? "shield-checkmark-outline" : "person-outline"} size={17} color={selected ? Colors.accent : Colors.muted} /><Text style={[styles.roleText, selected && styles.roleTextActive]}>{item === "ADMIN" ? "Admin" : "Teacher"}</Text></Pressable>; })}</View>
        <Text style={styles.label}>Email address</Text><View style={styles.field}><Ionicons name="mail-outline" size={19} color={Colors.muted} /><TextInput style={styles.fieldInput} placeholder={role === "ADMIN" ? "admin@school.com" : "teacher@school.com"} placeholderTextColor={Colors.faint} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} returnKeyType="next" /></View>
        <Text style={styles.label}>Password</Text><View style={styles.field}><Ionicons name="lock-closed-outline" size={18} color={Colors.muted} /><TextInput style={styles.fieldInput} placeholder="Enter your password" placeholderTextColor={Colors.faint} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} onSubmitEditing={handleLogin} returnKeyType="go" /><Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={10}><Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={Colors.muted} /></Pressable></View>
        <Button variant="primary" size="md" fullWidth disabled={loading} onPress={handleLogin} style={styles.submit}>{loading ? "Signing you in…" : "Continue"}</Button>
      </View>
      <Text style={styles.footer}>{role === "TEACHER" ? "Use the invitation sent by your administrator if this is your first sign in." : "Need access? Please contact your school administrator."}</Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas }, scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 56, paddingBottom: Spacing.xxl, justifyContent: "center" }, brandRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: 44 }, logoShell: { width: 54, height: 54, borderRadius: 17, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line, alignItems: "center", justifyContent: "center", overflow: "hidden" }, logo: { width: 42, height: 42 }, brandName: { fontSize: 19, fontWeight: "800", color: Colors.ink }, brandCaption: { fontSize: FontSize.base, color: Colors.muted, marginTop: 1 }, hero: { marginBottom: Spacing.xl }, heading: { fontSize: 30, lineHeight: 36, fontWeight: "800", color: Colors.ink, letterSpacing: -0.5 }, subtitle: { fontSize: FontSize.md, lineHeight: 20, color: Colors.muted, marginTop: Spacing.sm, maxWidth: 285 }, formCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.xl, padding: Spacing.xl, shadowColor: "#172a66", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2 }, formTitle: { color: Colors.ink, fontWeight: "700", fontSize: FontSize.lg, marginBottom: Spacing.lg }, roleSwitch: { height: 46, flexDirection: "row", backgroundColor: Colors.soft, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.xl }, roleTab: { flex: 1, borderRadius: 7, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, roleTabActive: { backgroundColor: Colors.surface, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }, roleText: { fontSize: FontSize.base, fontWeight: "600", color: Colors.muted }, roleTextActive: { color: Colors.ink }, label: { fontSize: FontSize.base, color: Colors.ink, fontWeight: "700", marginBottom: Spacing.sm }, field: { height: 50, borderWidth: 1, borderColor: Colors.lineStrong, backgroundColor: Colors.hover, borderRadius: Radius.md, paddingHorizontal: Spacing.md, flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.lg }, fieldInput: { flex: 1, fontSize: FontSize.md, color: Colors.ink, height: "100%" }, submit: { marginTop: Spacing.sm, minHeight: 52, borderRadius: Radius.md }, footer: { color: Colors.faint, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: Spacing.xl, paddingHorizontal: Spacing.md },
});
