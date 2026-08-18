import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Card, Badge, PageLoader, EmptyState } from "@/src/components/UI";
import api from "@/src/api/client";
import { Colors, Spacing, FontSize } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";

interface Notification {
  id: string;
  title: string;
  detail?: string;
  body?: string;
  read?: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items?: Notification[] }>("/api/notifications")
      .then(({ data }) => {
        setNotifications(Array.isArray(data?.items) ? data.items : []);
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <PageLoader text="Loading notifications..." />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title="No notifications"
              subtitle="You're all caught up!"
            />
          }
          renderItem={({ item }) => (
            <Card style={[styles.card, !item.read && styles.unread]}>
              <View style={styles.dotWrap}>
                {!item.read && <View style={styles.dot} />}
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, !item.read && styles.titleBold]}>
                  {item.title}
                </Text>
                <Text style={styles.body} numberOfLines={2}>
                  {item.detail || item.body || ""}
                </Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  list: { padding: Spacing.lg, paddingBottom: 100 },
  card: {
    marginBottom: Spacing.sm,
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: Spacing.md,
  },
  unread: { backgroundColor: "#f0f4ff" },
  dotWrap: { width: 8, paddingTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  info: { flex: 1, minWidth: 0 },
  title: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.ink,
    marginBottom: 2,
  },
  titleBold: { fontWeight: "700" },
  body: {
    fontSize: FontSize.base,
    color: Colors.muted,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  time: { fontSize: FontSize.sm, color: Colors.faint },
});
