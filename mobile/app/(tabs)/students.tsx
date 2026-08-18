import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, PageLoader, EmptyState } from '@/src/components/UI';
import api from '@/src/api/client';
import { Colors, Spacing, Radius, FontSize } from '@/src/theme';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Student {
  id: string;
  rollNumber: string;
  name: string;
  grade: string;
  parentName: string;
  status: 'PENDING' | 'ADMITTED' | 'REJECTED';
}

const STATUS_MAP: Record<Student['status'], { variant: 'warning' | 'success' | 'error'; label: string }> = {
  PENDING: { variant: 'warning', label: 'Pending' },
  ADMITTED: { variant: 'success', label: 'Admitted' },
  REJECTED: { variant: 'error', label: 'Rejected' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [grades, setGrades] = useState<string[]>([]);
  const [activeGrade, setActiveGrade] = useState<string | null>(null);

  /* ---- Fetch ---- */
  useEffect(() => {
    let cancelled = false;

    async function fetchStudents() {
      setLoading(true);
      const { data } = await api.get<Student[]>('/api/students');
      if (!cancelled && data) {
        setStudents(data);
        const uniqueGrades = Array.from(new Set(data.map((s) => s.grade))).sort();
        setGrades(uniqueGrades);
      }
      if (!cancelled) setLoading(false);
    }

    fetchStudents();
    return () => { cancelled = true; };
  }, []);

  /* ---- Derived list ---- */
  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.parentName.toLowerCase().includes(search.toLowerCase());
    const matchesGrade = activeGrade ? s.grade === activeGrade : true;
    return matchesSearch && matchesGrade;
  });

  /* ---- Handlers ---- */
  const onPressStudent = (id: string) => router.push(`/student/${id}`);

  /* ---- Render ---- */
  if (loading) return <PageLoader message="Loading students..." />;

  return (
    <View style={styles.canvas}>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.faint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            placeholderTextColor={Colors.faint}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Grade filter chips */}
      {grades.length > 0 && (
        <View style={styles.chipsRow}>
          <Pressable
            style={[styles.chip, activeGrade === null && styles.chipActive]}
            onPress={() => setActiveGrade(null)}
          >
            <Text style={[styles.chipText, activeGrade === null && styles.chipTextActive]}>All</Text>
          </Pressable>
          {grades.map((g) => (
            <Pressable
              key={g}
              style={[styles.chip, activeGrade === g && styles.chipActive]}
              onPress={() => setActiveGrade(activeGrade === g ? null : g)}
            >
              <Text style={[styles.chipText, activeGrade === g && styles.chipTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Student list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            iconName="people-outline"
            title="No students found"
            subtitle={search || activeGrade ? 'Try adjusting your search or filter' : 'No students have been added yet'}
          />
        }
        renderItem={({ item }) => {
          const st = STATUS_MAP[item.status];
          return (
            <Card style={styles.studentCard} onPress={() => onPressStudent(item.id)}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.rollNumber}>#{item.rollNumber}</Text>
                  <Text style={styles.studentName}>{item.name}</Text>
                </View>
                <Badge variant={st.variant}>{st.label}</Badge>
              </View>
              <View style={styles.cardBottom}>
                <Badge>{item.grade}</Badge>
                <Text style={styles.parentName} numberOfLines={1}>{item.parentName}</Text>
              </View>
            </Card>
          );
        }}
      />
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

  /* ---- Search ---- */
  searchRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.lineStrong,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.lg,
    color: Colors.ink,
    includeFontPadding: false,
    padding: 0,
  },

  /* ---- Filter chips ---- */
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.lineStrong,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
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

  /* ---- List ---- */
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },

  /* ---- Student card ---- */
  studentCard: {
    gap: Spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
    marginRight: Spacing.md,
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
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  parentName: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.muted,
    includeFontPadding: false,
  },
});
