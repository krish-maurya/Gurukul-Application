import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Modal,
  ViewStyle,
  TextStyle,
  TextInputProps,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize } from "@/src/theme";

/* ------------------------------------------------------------------ */
/*  Button                                                            */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

const buttonSizeStyles: Record<
  ButtonSize,
  { button: ViewStyle; text: TextStyle }
> = {
  sm: {
    button: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
    text: { fontSize: FontSize.base, fontWeight: "500" as const },
  },
  md: {
    button: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
    text: { fontSize: FontSize.lg, fontWeight: "500" as const },
  },
};

const buttonVariantStyles: Record<
  ButtonVariant,
  { button: ViewStyle; text: TextStyle }
> = {
  primary: {
    button: {
      backgroundColor: Colors.accent,
    },
    text: {
      color: "#ffffff",
    },
  },
  secondary: {
    button: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.lineStrong,
    },
    text: {
      color: Colors.ink,
    },
  },
  ghost: {
    button: {
      backgroundColor: "transparent",
    },
    text: {
      color: Colors.muted,
    },
  },
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  onPress,
  disabled = false,
  style,
  fullWidth = false,
}: ButtonProps) {
  const sizeStyle = buttonSizeStyles[size];
  const variantStyle = buttonVariantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.buttonBase,
        sizeStyle.button,
        variantStyle.button,
        fullWidth && styles.buttonFullWidth,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.buttonText, sizeStyle.text, variantStyle.text]}>
        {children}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Card                                                              */
/* ------------------------------------------------------------------ */

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const inner = <View style={[styles.card, style]}>{children}</View>;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

/* ------------------------------------------------------------------ */
/*  Badge                                                             */
/* ------------------------------------------------------------------ */

type BadgeVariant = "default" | "success" | "warning" | "error";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: ViewStyle;
}

const badgeVariantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: Colors.accentSoft, text: Colors.accentText },
  success: { bg: Colors.greenSoft, text: Colors.greenText },
  warning: { bg: Colors.amberSoft, text: Colors.amberText },
  error: { bg: Colors.redSoft, text: Colors.redText },
};

export function Badge({ variant = "default", children, style }: BadgeProps) {
  const v = badgeVariantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.badgeText, { color: v.text }]}>{children}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Input                                                             */
/* ------------------------------------------------------------------ */

interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, style, ...rest }: InputProps) {
  return (
    <View style={styles.inputWrapper}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={Colors.faint}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  PageLoader                                                        */
/* ------------------------------------------------------------------ */

interface PageLoaderProps {
  message?: string;
  text?: string;
}

export function PageLoader({ message, text }: PageLoaderProps) {
  const label = message ?? text ?? "Loading...";
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.pageLoader}>
      <View style={styles.loaderMark}>
        <Ionicons name="school-outline" size={23} color={Colors.accent} />
        <Animated.View style={[styles.loaderDot, { opacity: pulse }]} />
      </View>
      <Text style={styles.pageLoaderText}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  IconBadge                                                         */
/* ------------------------------------------------------------------ */

interface IconBadgeProps {
  iconName: keyof typeof Ionicons.glyphMap;
  count?: number;
  onPress?: () => void;
}

export function IconBadge({ iconName, count, onPress }: IconBadgeProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconBadgeButton,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Ionicons name={iconName} size={22} color={Colors.muted} />
      {count != null && count > 0 ? (
        <View style={styles.iconBadgeDot}>
          <Text style={styles.iconBadgeCount}>
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  EmptyState                                                        */
/* ------------------------------------------------------------------ */

interface EmptyStateProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({
  iconName = "folder-open-outline",
  icon,
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon ?? iconName} size={48} color={Colors.faint} />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {subtitle ? (
        <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Stylesheet                                                        */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* Button */
  buttonBase: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  buttonText: {
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  buttonFullWidth: {
    width: "100%",
    alignSelf: "stretch",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonTextDisabled: {
    color: Colors.faint,
  },

  /* Card */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
    // Subtle shadow – kept minimal to match the web elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  /* Badge */
  badge: {
    alignSelf: "flex-start",
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },

  /* Input */
  inputWrapper: {
    gap: Spacing.xs,
    width: "100%",
  },
  inputLabel: {
    fontSize: FontSize.base,
    fontWeight: "500" as const,
    color: Colors.ink,
    includeFontPadding: false,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lineStrong,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.ink,
    backgroundColor: Colors.surface,
    includeFontPadding: false,
    minHeight: 44, // minimum touch target
  },

  /* PageLoader */
  pageLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.xxxl,
  },
  pageLoaderText: {
    fontSize: FontSize.base,
    color: Colors.muted,
    includeFontPadding: false,
  },
  loaderMark: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderDot: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
    right: 8,
    top: 8,
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: Colors.canvas,
  },

  /* IconBadge */
  iconBadgeButton: {
    position: "relative" as const,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
  },
  iconBadgeDot: {
    position: "absolute" as const,
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  iconBadgeCount: {
    fontSize: FontSize.xs,
    fontWeight: "700" as const,
    color: "#ffffff",
    includeFontPadding: false,
    textAlign: "center" as const,
  },

  /* EmptyState */
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl * 2,
    gap: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: FontSize.xl,
    fontWeight: "600" as const,
    color: Colors.muted,
    marginTop: Spacing.md,
    includeFontPadding: false,
  },
  emptyStateSubtitle: {
    fontSize: FontSize.base,
    color: Colors.faint,
    includeFontPadding: false,
  },
});
