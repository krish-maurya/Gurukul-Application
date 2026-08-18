import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Card, Badge, PageLoader, EmptyState } from "@/src/components/UI";
import api from "@/src/api/client";
import { Colors, Spacing, Radius, FontSize } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
interface Message {
  id: string;
  title: string;
  body: string;
  status: string;
  type: string;
  sentAt: string;
  studentName?: string;
}

export default function CommunicationsScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ messages?: Message[] }>("/api/communications")
      .then(({ data }) => {
        setMessages(Array.isArray(data?.messages) ? data.messages : []);
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <PageLoader text="Loading communications..." />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-outline"
              title="No messages"
              subtitle="Communications will appear here."
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Badge
                  variant={
                    item.status === "SENT"
                      ? "success"
                      : item.status === "DRAFT"
                        ? "warning"
                        : "default"
                  }
                >
                  {item.status}
                </Badge>
                <Badge>{item.type}</Badge>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.cardTime}>
                {item.sentAt
                  ? new Date(item.sentAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : ""}
              </Text>
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
  card: { marginBottom: Spacing.sm },
  cardHeader: { flexDirection: "row", gap: 4, marginBottom: Spacing.sm },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.ink,
    marginBottom: 2,
  },
  cardBody: {
    fontSize: FontSize.base,
    color: Colors.muted,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  cardTime: { fontSize: FontSize.sm, color: Colors.faint },
});
