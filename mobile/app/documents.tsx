import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Card, Badge, PageLoader, EmptyState } from "@/src/components/UI";
import api from "@/src/api/client";
import { Colors, Spacing, Radius, FontSize } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
interface Doc {
  id: string;
  fileName: string;
  documentType: string;
  status: string;
  confidenceScore: number;
  createdAt: string;
}

export default function DocumentsScreen() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Doc[]>("/api/documents").then(({ data }) => {
      setDocs(data ?? []);
      setLoading(false);
    });
  }, []);

  const statusVariant = (s: string) =>
    s === "APPROVED"
      ? ("success" as const)
      : s === "NEEDS_REVIEW"
        ? ("warning" as const)
        : s === "REJECTED"
          ? ("error" as const)
          : ("default" as const);

  return (
    <View style={styles.container}>
      {loading ? (
        <PageLoader text="Loading documents..." />
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No documents"
              subtitle="Uploaded documents will appear here."
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={Colors.accent}
                  />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.fileName}</Text>
                  <Text style={styles.type}>{item.documentType}</Text>
                  <Text style={styles.score}>
                    OCR:{" "}
                    {Math.round(
                      item.confidenceScore > 1
                        ? item.confidenceScore
                        : item.confidenceScore * 100,
                    )}
                    %
                  </Text>
                </View>
                <Badge variant={statusVariant(item.status)}>
                  {item.status}
                </Badge>
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
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: FontSize.md, fontWeight: "600", color: Colors.ink },
  type: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 2 },
  score: {
    fontSize: FontSize.sm,
    color: Colors.faint,
    marginTop: 1,
    fontFamily: "monospace",
  },
});
