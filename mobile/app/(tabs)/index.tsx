import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/auth';
import { Card, Badge, PageLoader } from '@/src/components/UI';
import api from '@/src/api/client';
import { Colors, Spacing, Radius, FontSize } from '@/src/theme';

/* ------------------------------------------------------------------ */
/*  Static data (same as web dashboard)                                */
/* ------------------------------------------------------------------ */

const METRICS = [
  {
    icon: 'people-outline' as const,
    iconBg: Colors.accentSoft,
    iconColor: Colors.accent,
    label: 'TOTAL STUDENTS',
    value: '342',
    detail: '+12 this semester',
  },
  {
    icon: 'checkmark-done-outline' as const,
    iconBg: Colors.greenSoft,
    iconColor: Colors.green,
    label: 'STAFF',
    value: '91.5%',
    detail: 'Attendance rate',
  },
  {
    icon: 'checkbox-outline' as const,
    iconBg: Colors.amberSoft,
    iconColor: Colors.amber,
    label: "TODAY'S ATTENDANCE",
    value: '96.4%',
    detail: 'Across all classes',
  },
  {
    icon: 'time-outline' as const,
    iconBg: Colors.redSoft,
    iconColor: Colors.red,
    label: 'PENDING REVIEWS',
    value: '1',
    detail: 'Requires attention',
  },
];

const WEEKLY_DATA = [
  { day: 'Mon', value: 94 },
  { day: 'Tue', value: 97 },
  { day: 'Wed', value: 92 },
  { day: 'Thu', value: 96 },
  { day: 'Fri', value: 89 },
];

const ACTIVITIES = [
  {
    dotColor: Colors.green,
    title: 'Grade 10A Attendance Submitted',
    detail: '32 students marked present',
    time: '2 min ago',
  },
  {
    dotColor: Colors.amber,
    title: 'OCR Document Ingested',
    detail: 'timetable_draft.pdf processed',
    time: '15 min ago',
  },
  {
    dotColor: Colors.red,
    title: 'Timetable Conflict Detected',
    detail: 'Room 204 double-booked Wed 10 AM',
    time: '1 hr ago',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardScreen() {
  const { user: currentUser, isLoading: authLoading, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    // could also fetch dashboard data here
    setRefreshing(false);
  };

  if (authLoading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  const maxBar = Math.max(...WEEKLY_DATA.map((d) => d.value));

  return (
    <ScrollView
      style={styles.canvas}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ---- Welcome Banner ---- */}
      <Card style={styles.bannerCard}>
        <View style={styles.bannerInner}>
          <Badge>{currentUser?.role || 'Admin'}</Badge>
          <Text style={styles.bannerGreeting}>
            Welcome, {currentUser?.name || 'User'}
          </Text>
          <Text style={styles.bannerTitle}>Dashboard</Text>
          <Text style={styles.bannerSubtitle}>Overview of school operations</Text>
          <View style={styles.bannerActions}>
            <Pressable
              style={styles.btnPrimary}
              onPress={() => router.push('/attendance')}
            >
              <Ionicons name="checkbox-outline" size={16} color="#ffffff" />
              <Text style={styles.btnPrimaryText}>Attendance</Text>
            </Pressable>
            <Pressable
              style={styles.btnSecondary}
              onPress={() => router.push('/timetable')}
            >
              <Ionicons name="calendar-outline" size={16} color={Colors.ink} />
              <Text style={styles.btnSecondaryText}>Timetable</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      {/* ---- Key Metrics ---- */}
      <View style={styles.metricsGrid}>
        {METRICS.map((m) => (
          <Card key={m.label} style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: m.iconBg }]}>
              <Ionicons name={m.icon} size={20} color={m.iconColor} />
            </View>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricDetail}>{m.detail}</Text>
          </Card>
        ))}
      </View>

      {/* ---- Weekly Trends ---- */}
      <Card style={styles.trendsCard}>
        <Text style={styles.sectionTitle}>Weekly Trends</Text>
        <Text style={styles.sectionSubtitle}>Attendance %</Text>
        <View style={styles.chartContainer}>
          {WEEKLY_DATA.map((d) => {
            const heightPct = (d.value / maxBar) * 100;
            return (
              <View key={d.day} style={styles.chartBarWrapper}>
                <View style={styles.chartBarTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: `${heightPct}%` },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{d.day}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* ---- Recent Activity ---- */}
      <Card>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {ACTIVITIES.map((a, i) => (
            <View key={i} style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: a.dotColor }]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{a.title}</Text>
                <Text style={styles.activityDetail}>{a.detail}</Text>
              </View>
              <Text style={styles.activityTime}>{a.time}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
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
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },

  /* ---- Welcome Banner ---- */
  bannerCard: {
    backgroundColor: Colors.soft,
    borderWidth: 0,
  },
  bannerInner: {
    gap: Spacing.sm,
  },
  bannerGreeting: {
    fontSize: FontSize.md,
    color: Colors.muted,
    marginTop: Spacing.sm,
    includeFontPadding: false,
  },
  bannerTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.ink,
    includeFontPadding: false,
  },
  bannerSubtitle: {
    fontSize: FontSize.base,
    color: Colors.muted,
    includeFontPadding: false,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
  },
  btnPrimaryText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: '#ffffff',
    includeFontPadding: false,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.lineStrong,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
  },
  btnSecondaryText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.ink,
    includeFontPadding: false,
  },

  /* ---- Key Metrics ---- */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginHorizontal: -Spacing.sm, // offset inner padding so outer gap is even
  },
  metricCard: {
    width: '48%',
    marginLeft: '1%',
    marginRight: '1%',
    gap: Spacing.sm,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.ink,
    includeFontPadding: false,
  },
  metricDetail: {
    fontSize: 11,
    color: Colors.muted,
    includeFontPadding: false,
  },

  /* ---- Weekly Trends ---- */
  trendsCard: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.ink,
    includeFontPadding: false,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    includeFontPadding: false,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
    height: 140,
    paddingTop: Spacing.md,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chartBarTrack: {
    width: '100%',
    height: 100,
    backgroundColor: Colors.soft,
    borderRadius: Radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
  },
  chartLabel: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    includeFontPadding: false,
  },

  /* ---- Recent Activity ---- */
  activityList: {
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    marginTop: 5,
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.ink,
    includeFontPadding: false,
  },
  activityDetail: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    includeFontPadding: false,
  },
  activityTime: {
    fontSize: FontSize.sm,
    color: Colors.faint,
    marginTop: 2,
    includeFontPadding: false,
  },
});
