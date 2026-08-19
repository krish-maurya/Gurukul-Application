import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const [reviewVisible, setReviewVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
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
    setReviewVisible(false);
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
      setSuccessVisible(true);
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
          onPress={submitted ? () => setSubmitted(false) : () => setReviewVisible(true)}
        >
          {saving
            ? "Saving..."
            : submitted
              ? "Edit Attendance"
              : "Review & Submit"}
        </Button>
      </View>
      <Modal visible={reviewVisible} transparent animationType="fade" onRequestClose={() => setReviewVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.reviewModal}>
            <View style={styles.modalHeader}>
              <View><Text style={styles.modalTitle}>Confirm Attendance</Text><Text style={styles.modalSub}>{selected?.label} (Sec {selected?.section}) · {date}</Text></View>
              <Pressable hitSlop={12} onPress={() => setReviewVisible(false)}><Ionicons name="close" size={23} color={Colors.muted} /></Pressable>
            </View>
            <View style={styles.countRow}>
              <View style={styles.countCard}><Text style={styles.countLabel}>PRESENT</Text><Text style={styles.countValue}>{rolls.length - absent}</Text></View>
              <View style={styles.countCard}><Text style={styles.countLabel}>ABSENT</Text><Text style={styles.countValue}>{absent}</Text></View>
            </View>
            {absent > 0 ? <><Text style={styles.absentHeading}>ABSENT STUDENTS ({absent})</Text><View style={styles.absentList}>{rolls.filter((student) => student.status === "ABSENT").map((student) => <View key={student.id} style={styles.absentRow}><View style={styles.rollBadge}><Text style={styles.rollBadgeText}>#{student.rollNumber}</Text></View><Text style={styles.studentName}>{student.name}</Text><Text style={styles.absentPill}>ABSENT</Text></View>)}</View></> : <Text style={styles.allPresent}>Everyone is marked present today.</Text>}
            <Text style={styles.saveNote}>Attendance for {rolls.length} students will be saved.</Text>
            <View style={styles.modalActions}><Button variant="secondary" size="md" onPress={() => setReviewVisible(false)}>Go Back</Button><Button size="md" disabled={saving} onPress={submit}>{saving ? "Saving…" : "Submit"}</Button></View>
          </View>
        </View>
      </Modal>
      <Modal visible={successVisible} transparent animationType="fade" onRequestClose={() => setSuccessVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.successModal}>
            <Pressable style={styles.successClose} hitSlop={12} onPress={() => setSuccessVisible(false)}><Ionicons name="close" size={22} color={Colors.muted} /></Pressable>
            <View style={styles.successIcon}><Ionicons name="checkmark" size={42} color={Colors.green} /></View>
            <Text style={styles.successTitle}>Attendance submitted</Text>
            <Text style={styles.successText}>{selected?.label} attendance for {date} has been saved. {rolls.length} students recorded.</Text>
            <Button fullWidth size="md" onPress={() => setSuccessVisible(false)} style={styles.doneButton}>Done</Button>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: { flex: 1, backgroundColor: "rgba(17, 19, 18, 0.42)", justifyContent: "center", padding: Spacing.md },
  reviewModal: { backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: "hidden", maxHeight: "92%" },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.line },
  modalTitle: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.ink },
  modalSub: { fontSize: FontSize.md, color: Colors.faint, marginTop: 5 },
  countRow: { flexDirection: "row", gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  countCard: { flex: 1, alignItems: "center", paddingVertical: Spacing.lg, borderWidth: 1, borderColor: Colors.lineStrong, borderRadius: Radius.lg, backgroundColor: Colors.hover },
  countLabel: { fontSize: FontSize.base, fontWeight: "700", color: Colors.muted, letterSpacing: 1.2 },
  countValue: { fontSize: 27, fontWeight: "800", color: Colors.ink, marginTop: 8 },
  absentHeading: { fontSize: FontSize.base, fontWeight: "700", letterSpacing: 1.1, color: Colors.muted, marginHorizontal: Spacing.xl, marginTop: Spacing.xl, marginBottom: Spacing.md },
  absentList: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.line, marginHorizontal: Spacing.xl },
  absentRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.line, paddingVertical: Spacing.sm },
  rollBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center" },
  rollBadgeText: { color: "#fff", fontSize: FontSize.md, fontWeight: "800" },
  studentName: { flex: 1, fontSize: FontSize.lg, color: Colors.ink, fontWeight: "600" },
  absentPill: { color: Colors.muted, backgroundColor: Colors.soft, overflow: "hidden", paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.sm, fontSize: FontSize.sm, fontWeight: "700" },
  allPresent: { color: Colors.greenText, backgroundColor: Colors.greenSoft, marginHorizontal: Spacing.xl, marginTop: Spacing.xl, padding: Spacing.md, borderRadius: Radius.md, textAlign: "center", fontSize: FontSize.md },
  saveNote: { color: Colors.faint, fontSize: FontSize.base, margin: Spacing.xl, marginBottom: Spacing.lg },
  modalActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: Colors.line, padding: Spacing.lg },
  successModal: { position: "relative", backgroundColor: Colors.surface, borderRadius: Radius.xl, marginHorizontal: Spacing.lg, padding: Spacing.xxl, alignItems: "center" },
  successClose: { position: "absolute", top: Spacing.md, right: Spacing.md },
  successIcon: { width: 94, height: 94, borderRadius: 47, borderWidth: 1.5, borderColor: "#9cdec7", backgroundColor: Colors.greenSoft, alignItems: "center", justifyContent: "center", marginTop: Spacing.md, marginBottom: Spacing.xl },
  successTitle: { fontSize: FontSize.xl, color: Colors.ink, fontWeight: "800" },
  successText: { fontSize: FontSize.md, color: Colors.muted, textAlign: "center", lineHeight: 21, marginTop: Spacing.md },
  doneButton: { marginTop: Spacing.xl, minHeight: 52 },
});
