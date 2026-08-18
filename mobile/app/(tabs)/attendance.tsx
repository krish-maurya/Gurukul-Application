import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Badge, PageLoader } from '@/src/components/UI';
import api from '@/src/api/client';
import { Colors, Spacing, Radius, FontSize } from '@/src/theme';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GradeOption {
  grade: string;
  section: string;
}

interface GradeResponse {
  grades: GradeOption[];
  defaultGrade: GradeOption | null;
  hasFirstLecture?: boolean;
  message?: string;
  day?: string;
  period?: number;
}

interface Student {
  id: string;
  rollNumber: string;
  name: string;
  grade: string;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT';

interface StudentAttendance extends Student {
  status: AttendanceStatus;
}

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function shiftDate(iso: string, days: number): string {
  const next = new Date(`${iso}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AttendanceScreen() {
  /* ---- State ---- */
  const [grades, setGrades] = useState<GradeOption[]>([]);
  const [activeGrade, setActiveGrade] = useState<GradeOption | null>(null);
  const [date, setDate] = useState(todayString());
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [noFirstLecture, setNoFirstLecture] = useState(false);

  /* ---- Fetch grades ---- */
  const fetchGrades = async () => {
    const { data, error } = await api.get<GradeResponse>(`/api/attendance/grades?date=${date}`);
    if (!data || error) {
      setGrades([]);
      setActiveGrade(null);
      setNoFirstLecture(false);
      return;
    }
    setGrades(Array.isArray(data.grades) ? data.grades : []);
    setActiveGrade(data.defaultGrade ?? data.grades?.[0] ?? null);
    setNoFirstLecture(data.hasFirstLecture === false || data.message === 'YOU HAVE NO FIRST LECTURE');
  };

  /* ---- Fetch students + existing attendance ---- */
  const fetchStudents = async (grade: GradeOption, currentDate: string) => {
    const { data: studentData } = await api.get<Student[]>(
      `/api/students?grade=${encodeURIComponent(grade.grade)}&section=${grade.section}`,
    );

    if (!studentData) {
      setStudents([]);
      return;
    }

    // Check for existing attendance
    const { data: existing } = await api.get<AttendanceRecord[]>(
      `/api/attendance?grade=${encodeURIComponent(grade.grade)}&section=${grade.section}&date=${currentDate}`,
    );

    const statusMap = new Map<string, AttendanceStatus>();
    if (existing && Array.isArray(existing)) {
      existing.forEach((r) => statusMap.set(r.studentId, r.status));
    }

    const withStatus: StudentAttendance[] = studentData.map((s) => ({
      ...s,
      status: statusMap.get(s.id) || 'PRESENT',
    }));

    // Sort by roll number
    withStatus.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));
    setStudents(withStatus);
  };

  /* ---- Initial load ---- */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      await fetchGrades();
      if (!cancelled) setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, [date]);

  /* ---- Load students when grade or date changes ---- */
  useEffect(() => {
    const currentGrade = activeGrade;
    if (!currentGrade) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      await fetchStudents(currentGrade!, date);
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [activeGrade, date]);

  /* ---- Derived counts ---- */
  const presentCount = useMemo(
    () => students.filter((s) => s.status === 'PRESENT').length,
    [students],
  );
  const absentCount = useMemo(
    () => students.filter((s) => s.status === 'ABSENT').length,
    [students],
  );

  /* ---- Handlers ---- */
  const toggleStatus = (id: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' }
          : s,
      ),
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeGrade) {
      await fetchStudents(activeGrade, date);
    }
    setRefreshing(false);
  };

  const onSubmit = async () => {
    if (!activeGrade) return;

    setSubmitting(true);
    const { error } = await api.post('/api/attendance', {
      grade: `${activeGrade.grade} ${activeGrade.section}`,
      section: activeGrade.section,
      date,
      entries: students.map((s) => ({
        studentId: s.id,
        status: s.status,
      })),
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', 'Attendance submitted successfully!');
    }
  };

  /* ---- Render ---- */
  if (loading && students.length === 0 && grades.length === 0) {
    return <PageLoader message="Loading attendance..." />;
  }

  if (!loading && noFirstLecture) {
    return (
      <View style={styles.noLectureContainer}>
        <Ionicons name="calendar-clear-outline" size={52} color={Colors.faint} />
        <Text style={styles.noLectureText}>YOU HAVE NO FIRST LECTURE</Text>
      </View>
    );
  }

  return (
    <View style={styles.canvas}>
      {/* ---- Filter card ---- */}
      <Card style={styles.filterCard}>
        {/* Grade selector chips */}
        <Text style={styles.filterLabel}>Select Grade</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {grades.map((g) => {
            const label = `${g.grade} - ${g.section}`;
            const isActive = activeGrade?.grade === g.grade && activeGrade?.section === g.section;
            return (
              <Pressable
                key={`${g.grade}-${g.section}`}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setActiveGrade(g)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Date display */}
        <View style={styles.dateRow}>
          <Pressable onPress={() => setDate((value) => shiftDate(value, -1))} hitSlop={10}>
            <Ionicons name="chevron-back" size={18} color={Colors.muted} />
          </Pressable>
          <Ionicons name="calendar-outline" size={16} color={Colors.muted} />
          <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
          <Pressable onPress={() => setDate((value) => shiftDate(value, 1))} hitSlop={10}>
            <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
          </Pressable>
        </View>
      </Card>

      {/* ---- Summary chips ---- */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: Colors.greenSoft }]}>
          <Text style={[styles.summaryCount, { color: Colors.greenText }]}>{presentCount}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.greenText }]}>Present</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: Colors.redSoft }]}>
          <Text style={[styles.summaryCount, { color: Colors.redText }]}>{absentCount}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.redText }]}>Absent</Text>
        </View>
      </View>

      {/* ---- Student list ---- */}
      {loading ? (
        <PageLoader message="Loading students..." />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={Colors.faint} />
              <Text style={styles.emptyTitle}>No students found</Text>
              <Text style={styles.emptySubtitle}>
                {activeGrade
                  ? 'No students in this grade'
                  : 'Select a grade to begin'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.studentCardWrapper,
                {
                  borderLeftColor:
                    item.status === 'PRESENT' ? Colors.green : Colors.red,
                },
              ]}
            >
              <Card>
              <View style={styles.studentRow}>
                <View style={styles.studentInfo}>
                  <Text style={styles.rollNumber}>#{item.rollNumber}</Text>
                  <Text style={styles.studentName}>{item.name}</Text>
                </View>
                <Pressable
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor:
                        item.status === 'PRESENT' ? Colors.green : Colors.red,
                    },
                  ]}
                  onPress={() => toggleStatus(item.id)}
                >
                  <Text style={styles.toggleText}>
                    {item.status === 'PRESENT' ? 'Present' : 'Absent'}
                  </Text>
                </Pressable>
              </View>
              </Card>
            </View>
          )}
        />
      )}

      {/* ---- Bottom action bar ---- */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomGrade}>
            {activeGrade ? `${activeGrade.grade} - ${activeGrade.section}` : 'No grade selected'}
          </Text>
          <Text style={styles.bottomDate}>{formatDisplayDate(date)}</Text>
        </View>
        <Button
          variant="primary"
          fullWidth
          disabled={students.length === 0 || submitting || !activeGrade}
          onPress={onSubmit}
        >
          {submitting ? 'Submitting...' : 'Submit Attendance'}
        </Button>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  noLectureContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.canvas,
  },
  noLectureText: {
    color: Colors.muted,
    fontSize: FontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },

  /* ---- Filter card ---- */
  filterCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  filterLabel: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.ink,
    includeFontPadding: false,
  },
  chipsScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  chip: {
    backgroundColor: Colors.soft,
    borderWidth: 1,
    borderColor: Colors.lineStrong,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.muted,
    includeFontPadding: false,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: FontSize.md,
    color: Colors.muted,
    includeFontPadding: false,
  },

  /* ---- Summary chips ---- */
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryChip: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
  },
  summaryCount: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    includeFontPadding: false,
  },
  summaryLabel: {
    fontSize: FontSize.base,
    fontWeight: '500',
    marginTop: 2,
    includeFontPadding: false,
  },

  /* ---- Student list ---- */
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120, // space for bottom bar
    gap: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxxl * 3,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.muted,
    marginTop: Spacing.md,
    includeFontPadding: false,
  },
  emptySubtitle: {
    fontSize: FontSize.base,
    color: Colors.faint,
    includeFontPadding: false,
  },

  /* ---- Student card ---- */
  studentCardWrapper: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.green,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentInfo: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 2,
  },
  rollNumber: {
    fontSize: FontSize.sm,
    color: Colors.faint,
    includeFontPadding: false,
  },
  studentName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.ink,
    includeFontPadding: false,
  },

  /* ---- Toggle button ---- */
  toggleBtn: {
    width: 80,
    height: 44,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
    includeFontPadding: false,
    letterSpacing: 0.2,
  },

  /* ---- Bottom action bar ---- */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
    // shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomGrade: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.ink,
    includeFontPadding: false,
  },
  bottomDate: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    includeFontPadding: false,
  },
});
