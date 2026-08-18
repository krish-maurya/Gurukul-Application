import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { Button, Card, PageLoader } from "@/src/components/UI";
import api from "@/src/api/client";
import { Colors, FontSize, Radius, Spacing } from "@/src/theme";

type Status = "PRESENT" | "ABSENT";
type Student = { id: string; rollNumber: number; name: string; grade: string };
type Roll = Student & { status: Status };
type RawGrade = string | { grade?: string; section?: string };
type Choice = { id: string; grade: string; section: string; label: string };
type GradesResponse = { grades?: RawGrade[]; defaultGrade?: RawGrade | null };
type AttendanceResponse = {
  record?: { entries?: { rollNumber: number; status: Status }[] } | null;
};
const today = () => new Date().toISOString().slice(0, 10);

function toChoice(raw: RawGrade): Choice | null {
  if (typeof raw === "string")
    return { id: `${raw}|A`, grade: raw, section: "A", label: raw };
  const base = String(raw?.grade || "").trim();
  const section = String(raw?.section || "A").trim();
  if (!base) return null;
  // Backend variants return either "Grade 10A" or { grade: "Grade 10", section: "A" }.
  const grade = /[A-Za-z]$/.test(base) ? base : `${base}${section}`;
  return { id: `${grade}|${section}`, grade, section, label: grade };
}

export default function AttendanceScreen() {
  const [choices, setChoices] = useState<Choice[]>([]);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [date] = useState(today());
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const selectedId = selected?.id;
  const load = useCallback(async () => {
    setLoading(true);
    const gradeResult = await api.get<GradesResponse>("/api/attendance/grades");
    if (gradeResult.error) {
      Alert.alert("Could not load attendance", gradeResult.error);
      setLoading(false);
      return;
    }
    const available = (gradeResult.data?.grades ?? [])
      .map(toChoice)
      .filter((x): x is Choice => x !== null);
    const preferred = toChoice(
      gradeResult.data?.defaultGrade ?? available[0]?.grade ?? "",
    );
    const current =
      (selected && available.find((x) => x.id === selected.id)) ||
      available.find((x) => x.id === preferred?.id) ||
      available[0] ||
      null;
    setChoices(available);
    setSelected(current);
    if (!current) {
      setRolls([]);
      setLoading(false);
      return;
    }
    const [studentResult, attendanceResult] = await Promise.all([
      api.get<Student[]>("/api/students"),
      api.get<AttendanceResponse>(
        `/api/attendance?grade=${encodeURIComponent(current.grade)}&section=${encodeURIComponent(current.section)}&date=${date}`,
      ),
    ]);
    if (studentResult.error) {
      Alert.alert("Could not load class roster", studentResult.error);
      setRolls([]);
      setLoading(false);
      return;
    }
    const saved = new Map(
      (attendanceResult.data?.record?.entries ?? []).map((entry) => [
        Number(entry.rollNumber),
        entry.status,
      ]),
    );
    setRolls(
      (studentResult.data ?? [])
        .filter((student) => student.grade === current.grade)
        .sort((a, b) => Number(a.rollNumber) - Number(b.rollNumber))
        .map((student) => ({
          ...student,
          status: saved.get(Number(student.rollNumber)) ?? "PRESENT",
        })),
    );
    setSubmitted(Boolean(attendanceResult.data?.record));
    setLoading(false);
  }, [date, selectedId]);
  useEffect(() => {
    load();
  }, [load]);
  const absent = useMemo(
    () => rolls.filter((s) => s.status === "ABSENT").length,
    [rolls],
  );
  const toggle = (id: string) =>
    !submitted &&
    setRolls((items) =>
      items.map((item) =>
        item.id === id
          ? {
            ...item,
            status: item.status === "PRESENT" ? "ABSENT" : "PRESENT",
          }
          : item,
      ),
    );
  const submit = async () => {
    if (!selected || !rolls.length) return;
    setSaving(true);
    const result = await api.post("/api/attendance", {
      grade: selected.grade,
      section: selected.section,
      date,
      entries: rolls.map(({ id, status }) => ({ studentId: id, status })),
    });
    setSaving(false);
    if (result.error) Alert.alert("Attendance not saved", result.error);
    else {
      setSubmitted(true);
      Alert.alert(
        "Attendance submitted",
        `${rolls.length - absent} present · ${absent} absent.`,
      );
    }
  };
  if (loading && !selected)
    return <PageLoader message="Loading attendance..." />;
  return (
    <View style={styles.canvas}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Attendance</Text>
        <Text style={styles.subtitle}>Tap a roll card to mark absent.</Text>
      </View>
      <FlatList
        data={choices}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gradeList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelected(item)}
            style={[styles.grade, selected?.id === item.id && styles.active]}
          >
            <Text
              style={[
                styles.gradeText,
                selected?.id === item.id && styles.white,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />
      <View style={styles.summary}>
        <Text style={styles.small}>
          {selected?.label || "Choose a class"} · {date}
        </Text>
        <Text style={styles.small}>
          {rolls.length - absent} Present ·{" "}
          <Text style={{ color: Colors.red }}>{absent} Absent</Text>
        </Text>
      </View>
      <FlatList
        data={rolls}
        numColumns={3}
        keyExtractor={(item, index) => `${item.id}-${item.rollNumber}-${index}`}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={Colors.accent}
          />
        }
        ListEmptyComponent={
          <Card>
            <Text style={styles.empty}>
              No students enrolled in this class.
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Pressable
            disabled={submitted}
            onPress={() => toggle(item.id)}
            style={[
              styles.roll,
              item.status === "ABSENT" && styles.absent,
              submitted && styles.locked,
            ]}
          >
            <Text
              style={[
                styles.rollLabel,
                item.status === "ABSENT" && styles.white,
              ]}
            >
              ROLL
            </Text>
            <Text
              style={[styles.rollNo, item.status === "ABSENT" && styles.white]}
            >
              #{item.rollNumber}
            </Text>
            <Text
              style={[
                styles.rollLabel,
                item.status === "ABSENT" && styles.white,
              ]}
            >
              {item.status}
            </Text>
          </Pressable>
        )}
      />
      <View style={styles.bottom}>
        <Button
          fullWidth
          disabled={saving || !rolls.length}
          onPress={submitted ? () => setSubmitted(false) : submit}
        >
          {saving
            ? "Saving..."
            : submitted
              ? "Edit Attendance"
              : "Review & Submit"}
        </Button>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: Colors.canvas },
  header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: 22, fontWeight: "700", color: Colors.ink },
  subtitle: { fontSize: FontSize.base, color: Colors.muted, marginTop: 4 },
  gradeList: {
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xxl,
    gap: Spacing.sm,
    paddingBottom: 25,
  },
  grade: {
    minWidth: 120,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  active: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  gradeText: {
    fontSize: FontSize.base,
    lineHeight: 16,
    color: Colors.muted,
    fontWeight: "600",
    includeFontPadding: false,
  },
  summary: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  small: { fontSize: FontSize.sm, color: Colors.muted, fontWeight: "600" },
  grid: {
    padding: Spacing.lg,
    paddingBottom: 190,
    gap: Spacing.sm,
  },
  roll: {
    flex: 1,
    margin: 4,
    height: 94,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.lineStrong,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  absent: { backgroundColor: Colors.red, borderColor: Colors.red },
  locked: { opacity: 0.75 },
  rollLabel: { fontSize: 9, fontWeight: "700", color: Colors.faint },
  rollNo: { fontSize: 20, fontWeight: "800", color: Colors.ink },
  white: { color: "#fff" },
  empty: { textAlign: "center", color: Colors.muted },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
});
