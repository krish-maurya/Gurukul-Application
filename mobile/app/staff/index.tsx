import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card, Badge, PageLoader, EmptyState } from "@/src/components/UI";
import api from "@/src/api/client";
import { Colors, Spacing, Radius, FontSize } from "@/src/theme";

type Staff = {
  id: string;
  name: string;
  email: string;
  department: string;
  isActive: boolean;
};
export default function StaffScreen() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useEffect(() => {
    api.get<{ staff?: Staff[] }>("/api/staff").then(({ data }) => {
      setStaff(Array.isArray(data?.staff) ? data.staff : []);
      setLoading(false);
    });
  }, []);
  const filtered = useMemo(
    () =>
      staff.filter((s) =>
        `${s.name || ""} ${s.department || ""} ${s.email || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [staff, search],
  );
  if (loading) return <PageLoader text="Loading staff..." />;
  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={Colors.faint} />
        <TextInput
          style={styles.input}
          placeholder="Search staff..."
          placeholderTextColor={Colors.faint}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="people-outline" title="No staff found" />
        }
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => router.push(`/staff/${item.id}` as any)}
          >
            <View style={styles.row}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: item.isActive
                      ? Colors.accentSoft
                      : Colors.redSoft,
                  },
                ]}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={item.isActive ? Colors.accent : Colors.red}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>
                  {String(item.name || "Unnamed teacher")}
                </Text>
                <Text style={styles.department}>
                  {String(item.department || "No department")}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {String(item.email || "No email")}
                </Text>
              </View>
              <Badge variant={item.isActive ? "success" : "error"}>
                {item.isActive ? "Active" : "Inactive"}
              </Badge>
            </View>
          </Card>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    margin: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.ink, height: 46 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: FontSize.md, fontWeight: "700", color: Colors.ink },
  department: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 2 },
  email: { fontSize: FontSize.sm, color: Colors.faint, marginTop: 2 },
});
