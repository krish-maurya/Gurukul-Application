import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/src/context/auth";
import { Card, Badge, Button } from "@/src/components/UI";
import { Colors, Spacing, Radius, FontSize } from "@/src/theme";

const MENU_ITEMS = [
  {
    icon: "people-outline",
    label: "Staff Directory",
    route: "/staff" as const,
  },
  {
    icon: "chatbubble-outline",
    label: "Communications",
    route: "/communications" as const,
  },
  {
    icon: "document-text-outline",
    label: "Documents",
    route: "/documents" as const,
  },
  {
    icon: "notifications-outline",
    label: "Notifications",
    route: "/notifications" as const,
  },
];

export default function MoreScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.userCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color="#fff" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
        </View>
        <Badge variant="default">{user?.role || "ADMIN"}</Badge>
      </Card>

      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item, i) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as any)}
            style={[
              styles.menuItem,
              i === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={Colors.accent}
                />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.faint} />
          </Pressable>
        ))}
      </View>

      <Pressable onPress={handleLogout} style={styles.logoutRow}>
        <View style={styles.menuLeft}>
          <View style={[styles.menuIcon, { backgroundColor: Colors.redSoft }]}>
            <Ionicons name="log-out-outline" size={20} color={Colors.red} />
          </View>
          <Text style={[styles.menuLabel, { color: Colors.red }]}>Logout</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  content: { padding: Spacing.lg },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.ink },
  userEmail: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 2 },
  menuSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: FontSize.md, fontWeight: "500", color: Colors.ink },
  logoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    marginTop: Spacing.xl,
  },
});
