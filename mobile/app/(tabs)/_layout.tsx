import { useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/auth";
import { router } from "expo-router";
import { Text, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/src/theme";
import { PageLoader } from "@/src/components/UI";

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading && user === null) {
      router.replace("/(auth)/login");
    }
  }, [isLoading, user]);

  // Do not mount the navigator before SecureStore finishes restoring the
  // session. On a first install `user` is temporarily null and redirecting
  // during that window caused the production error screen.
  if (isLoading) return <PageLoader message="Preparing your workspace" />;
  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        header: () => (
          <Pressable
            style={[
              styles.header,
              { paddingTop: insets.top, height: 52 + insets.top },
            ]}
            onPress={() => {}}
          >
            <Pressable style={styles.headerLeft} onPress={() => {}}>
              <Ionicons name="school-outline" size={22} color={Colors.accent} />
              <Text style={styles.headerTitle}>Gurukul</Text>
            </Pressable>
            <Pressable
              style={styles.notificationBtn}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={Colors.ink}
              />
              <View style={styles.redDot} />
            </Pressable>
          </Pressable>
        ),
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.faint,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: "Students",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: "Timetable",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    height: 52,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.ink,
  },
  notificationBtn: {
    position: "relative",
    padding: 4,
  },
  redDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.red,
  },
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    height: 60,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
});
