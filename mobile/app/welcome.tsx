import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/src/context/auth";
import { Colors, Spacing, Radius, FontSize } from "@/src/theme";

export default function WelcomeScreen() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ").pop() || "Teacher";
  const choices = [
    {
      icon: "checkbox-outline" as const,
      title: "Take Attendance",
      detail: "Mark today's class in a focused workspace.",
      href: "/(tabs)/attendance",
    },
    {
      icon: "calendar-outline" as const,
      title: "My Timetable",
      detail: "See your personal classes day-wise or week-wise.",
      href: "/(tabs)/timetable",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Ionicons name="school" size={22} color="#fff" />
      </View>
      <Text style={styles.title}>Good to see you, {firstName}</Text>
      <Text style={styles.subtitle}>What are you planning to do?</Text>
      <View style={styles.cards}>
        {choices.map((choice) => (
          <Pressable
            key={choice.title}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.replace(choice.href as never)}
          >
            <View style={styles.icon}>
              <Ionicons name={choice.icon} size={22} color={Colors.accent} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{choice.title}</Text>
              <Text style={styles.cardDetail}>{choice.detail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.faint} />
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => router.replace("/(tabs)")}>
        <Text style={styles.skip}>Skip — go to dashboard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  brand: {
    alignSelf: "center",
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    fontSize: 23,
    fontWeight: "700",
    color: Colors.ink,
  },
  subtitle: {
    textAlign: "center",
    fontSize: FontSize.md,
    color: Colors.muted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  cards: { gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  cardPressed: { opacity: 0.75 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.ink },
  cardDetail: {
    fontSize: FontSize.base,
    color: Colors.muted,
    marginTop: 3,
    lineHeight: 17,
  },
  skip: {
    textAlign: "center",
    color: Colors.faint,
    fontSize: FontSize.base,
    marginTop: Spacing.xl,
  },
});
