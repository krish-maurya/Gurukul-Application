import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Card,
  Badge,
  PageLoader,
  EmptyState,
  Button,
} from "@/src/components/UI";
import api from "@/src/api/client";
import { Colors, Spacing, Radius, FontSize } from "@/src/theme";

const PERIODS = [
  { id: 1, time: "09:00 - 09:50 AM" },
  { id: 2, time: "10:00 - 10:50 AM" },
  { id: 3, time: "11:00 - 11:50 AM" },
  { id: 4, time: "12:00 - 12:50 PM" },
  { id: 5, time: "02:00 - 02:50 PM" },
  { id: 6, time: "03:00 - 03:50 PM" },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

interface Slot {
  id: string;
  day: string;
  period: number;
  grade: string;
  subjectName: string;
  teacherName: string;
  roomName: string;
  roomType?: string;
  isProxy?: boolean;
  proxyStatus?: string | null;
  requiresLab?: boolean;
}

function SlotCard({ slot }: { slot: Slot }) {
  const isProxy = slot.isProxy;
  return (
    <View style={[styles.slotCard, isProxy && styles.slotProxy]}>
      <View style={styles.slotHeader}>
        <Text style={styles.slotGrade}>{slot.grade}</Text>
        <View style={styles.slotBadges}>
          {isProxy && <Badge variant="warning">Proxy</Badge>}
          {slot.proxyStatus === "PENDING" && (
            <Badge variant="error">Absent</Badge>
          )}
          {slot.requiresLab && <Badge variant="default">Lab</Badge>}
        </View>
      </View>
      <Text style={styles.slotSubject}>{slot.subjectName}</Text>
      <View style={styles.slotMeta}>
        <Ionicons name="person-outline" size={14} color={Colors.muted} />
        <Text style={styles.slotMetaText}>{slot.teacherName}</Text>
      </View>
      <View style={styles.slotMeta}>
        <Ionicons name="location-outline" size={14} color={Colors.faint} />
        <Text style={[styles.slotMetaText, { color: Colors.faint }]}>
          {slot.roomName}
        </Text>
      </View>
    </View>
  );
}

export default function TimetableScreen() {
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Mon");

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get<{ slots?: Slot[] }>(
      `/api/timetable?date=${date}`,
    );
    setSlots(data?.slots ?? []);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const activeDay = useMemo(() => {
    try {
      const d = new Date(`${date}T00:00:00`);
      const short = d.toLocaleDateString("en-US", { weekday: "short" });
      return DAYS.includes(short) ? short : "Mon";
    } catch {
      return "Mon";
    }
  }, [date]);

  const filteredSlots = useMemo(() => {
    if (viewMode === "day") return slots.filter((s) => s.day === activeDay);
    return slots.filter((s) => s.day === selectedDay);
  }, [slots, viewMode, activeDay, selectedDay]);

  const grouped = useMemo(() => {
    return PERIODS.map((p) => ({
      period: p,
      slots: filteredSlots.filter((s) => s.period === p.id),
    })).filter((g) => g.slots.length > 0);
  }, [filteredSlots]);

  return (
    <View style={styles.container}>
      {/* Header with toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={18} color={Colors.faint} />
          <View>
            <Text style={styles.headerTitle}>
              {viewMode === "day" ? "Daily Schedule" : "Weekly Schedule"}
            </Text>
            <Text style={styles.headerSub}>
              {viewMode === "day" ? `${activeDay}, ${date}` : "Mon – Fri"}
            </Text>
          </View>
        </View>
        <View style={styles.toggleWrap}>
          {(["day", "week"] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setViewMode(mode)}
              style={[
                styles.toggleBtn,
                viewMode === mode && styles.toggleActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === mode && styles.toggleTextActive,
                ]}
              >
                {mode === "day" ? "Day" : "Week"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Week day tabs */}
      {viewMode === "week" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayTabs}
          contentContainerStyle={styles.dayTabsContent}
        >
          {DAYS.map((day) => (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[
                styles.dayTab,
                selectedDay === day && styles.dayTabActive,
              ]}
            >
              <Text
                style={[
                  styles.dayTabText,
                  selectedDay === day && styles.dayTabTextActive,
                ]}
              >
                {day}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      <FlatList
        data={grouped}
        keyExtractor={(item) => String(item.period.id)}
        refreshing={loading}
        onRefresh={fetchTimetable}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="calendar-outline"
              title="No classes scheduled"
              subtitle="No timetable slots found for this day."
            />
          ) : null
        }
        ListHeaderComponent={
          loading ? <PageLoader text="Loading schedule..." /> : null
        }
        renderItem={({ item }) => (
          <View style={styles.periodSection}>
            <View style={styles.periodHeader}>
              <Ionicons name="time-outline" size={14} color={Colors.accent} />
              <Text style={styles.periodTitle}>Period {item.period.id}</Text>
              <Text style={styles.periodTime}>{item.period.time}</Text>
            </View>
            {item.slots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} />
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.ink },
  headerSub: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 2 },
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: Colors.soft,
    borderRadius: Radius.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  toggleActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: { fontSize: FontSize.sm, fontWeight: "500", color: Colors.muted },
  toggleTextActive: { color: Colors.ink },
  dayTabs: { backgroundColor: Colors.surface, flexGrow: 0 },
  dayTabsContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    alignItems: "center",
  },
  // Explicit dimensions prevent day controls from inheriting the available
  // page height and becoming tall vertical pills.
  dayTab: {
    width: 60,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.full,
    backgroundColor: Colors.soft,
    flexGrow: 0,
  },
  dayTabActive: { backgroundColor: Colors.accent },
  dayTabText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.muted },
  dayTabTextActive: { color: "#ffffff" },
  listContent: { paddingBottom: 100 },
  periodSection: { marginBottom: Spacing.md },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  periodTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.ink },
  periodTime: {
    fontSize: FontSize.sm,
    color: Colors.faint,
    fontFamily: "monospace",
  },
  slotCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  slotProxy: {
    backgroundColor: Colors.amberSoft,
    borderColor: "rgba(183,121,31,0.3)",
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  slotGrade: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.faint,
    textTransform: "uppercase",
    letterSpacing: 0.05,
  },
  slotBadges: { flexDirection: "row", gap: 4 },
  slotSubject: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  slotMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  slotMetaText: { fontSize: FontSize.base, color: Colors.muted },
});
