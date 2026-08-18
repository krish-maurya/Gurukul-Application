import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Badge, PageLoader } from "@/src/components/UI";
import api from "@/src/api/client";
import { Colors, Spacing, Radius, FontSize } from "@/src/theme";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Student {
  id: string;
  name: string;
  grade: string;
  rollNumber: string;
  parentName: string;
  contact: string;
  dob: string;
  address: string;
  status: "PENDING" | "ADMITTED" | "REJECTED";
}

interface FeeSummary {
  totalFees: number;
  paid: number;
  pending: number;
  overdue: number;
}

interface FeeAccountResponse {
  account?: {
    amountDue?: number | null;
    amountPaid?: number | null;
    dueDate?: string | null;
    status?: string | null;
    payments?: Array<{
      id: string;
      amount?: number | null;
      paidAt?: string | null;
      method?: string | null;
    }>;
  } | null;
}

interface Payment {
  id: string;
  date: string;
  description: string;
  amount: number;
  mode: "Cash" | "UPI" | "Online" | "Check";
  status: "COMPLETED" | "PENDING" | "FAILED";
}

const STATUS_MAP: Record<
  Student["status"],
  { variant: "warning" | "success" | "error"; label: string }
> = {
  PENDING: { variant: "warning", label: "Pending" },
  ADMITTED: { variant: "success", label: "Admitted" },
  REJECTED: { variant: "error", label: "Rejected" },
};

const PAYMENT_STATUS_MAP: Record<
  Payment["status"],
  { variant: "success" | "warning" | "error"; label: string }
> = {
  COMPLETED: { variant: "success", label: "Completed" },
  PENDING: { variant: "warning", label: "Pending" },
  FAILED: { variant: "error", label: "Failed" },
};

const MODE_ICON: Record<Payment["mode"], string> = {
  Cash: "cash-outline",
  UPI: "phone-portrait-outline",
  Online: "globe-outline",
  Check: "document-text-outline",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(value: unknown): string {
  const amount = typeof value === "number" ? value : Number(value);
  return `₹${Number.isFinite(amount) ? amount.toLocaleString("en-IN") : "0"}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StudentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---- Fetch ---- */
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      const [studentRes, feesRes] = await Promise.all([
        api.get<Student>(`/api/students/${id}`),
        api.get<FeeAccountResponse>(`/api/students/${id}/fees`),
      ]);

      if (!cancelled) {
        if (studentRes.data) setStudent(studentRes.data);
        const account = feesRes.data?.account;
        if (account) {
          const totalFees = Number(account.amountDue ?? 0);
          const paid = Number(account.amountPaid ?? 0);
          setFees({
            totalFees: Number.isFinite(totalFees) ? totalFees : 0,
            paid: Number.isFinite(paid) ? paid : 0,
            pending: Math.max(0, totalFees - paid),
            overdue:
              account.status === "OVERDUE" ? Math.max(0, totalFees - paid) : 0,
          });
          setPayments(
            (account.payments ?? []).map((payment) => ({
              id: payment.id,
              date: payment.paidAt ?? "",
              description: "Fee payment",
              amount: Number(payment.amount ?? 0),
              mode:
                payment.method === "UPI"
                  ? "UPI"
                  : payment.method === "BANK"
                    ? "Online"
                    : "Cash",
              status: "COMPLETED",
            })),
          );
        }
      }
      if (!cancelled) setLoading(false);
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ---- Loading ---- */
  if (loading) return <PageLoader message="Loading student details..." />;
  if (!student) {
    return (
      <View style={styles.canvas}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={Colors.ink} />
          </Pressable>
        </View>
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>Student not found.</Text>
        </Card>
      </View>
    );
  }

  const st = STATUS_MAP[student.status];

  /* ---- Info rows ---- */
  const infoRows: { icon: string; label: string; value: string }[] = [
    { icon: "school-outline", label: "Grade", value: student.grade },
    { icon: "hash-outline", label: "Roll Number", value: student.rollNumber },
    { icon: "person-outline", label: "Parent", value: student.parentName },
    { icon: "call-outline", label: "Contact", value: student.contact || "—" },
    {
      icon: "calendar-outline",
      label: "Date of Birth",
      value: formatDate(student.dob),
    },
    {
      icon: "location-outline",
      label: "Address",
      value: student.address || "—",
    },
  ];

  /* ---- Fee summary cards ---- */
  const feeCards = [
    {
      label: "Total Fees",
      value: fees ? formatCurrency(fees.totalFees) : "—",
      color: Colors.accent,
      bg: Colors.accentSoft,
      icon: "wallet-outline",
    },
    {
      label: "Paid",
      value: fees ? formatCurrency(fees.paid) : "—",
      color: Colors.green,
      bg: Colors.greenSoft,
      icon: "checkmark-circle-outline",
    },
    {
      label: "Pending",
      value: fees ? formatCurrency(fees.pending) : "—",
      color: Colors.amber,
      bg: Colors.amberSoft,
      icon: "time-outline",
    },
    {
      label: "Overdue",
      value: fees ? formatCurrency(fees.overdue) : "—",
      color: Colors.red,
      bg: Colors.redSoft,
      icon: "alert-circle-outline",
    },
  ];

  /* ---- FlatList data ---- */
  const listData: Array<
    | { type: "info" }
    | { type: "feeSummary" }
    | { type: "paymentHeader" }
    | { type: "payment"; item: Payment }
  > = [
    { type: "info" },
    { type: "feeSummary" },
    { type: "paymentHeader" },
    ...payments.map((p) => ({ type: "payment" as const, item: p })),
  ];

  /* ---- Render helpers ---- */
  const renderInfo = () => (
    <Card style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <View style={styles.infoNameRow}>
          <Text style={styles.infoName}>{student!.name}</Text>
          <Badge variant={st.variant}>{st.label}</Badge>
        </View>
      </View>
      <View style={styles.infoDivider} />
      <View style={styles.infoRows}>
        {infoRows.map((row) => (
          <View key={row.label} style={styles.infoRow}>
            <View style={styles.infoRowIconBox}>
              <Ionicons name={row.icon as any} size={16} color={Colors.muted} />
            </View>
            <View style={styles.infoRowContent}>
              <Text style={styles.infoRowLabel}>{row.label}</Text>
              <Text style={styles.infoRowValue} numberOfLines={2}>
                {row.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );

  const renderFeeSummary = () => (
    <View style={styles.feeGrid}>
      {feeCards.map((fc) => (
        <Card
          key={fc.label}
          style={[styles.feeCard, { backgroundColor: fc.bg }]}
        >
          <View
            style={[styles.feeIconBox, { backgroundColor: fc.color + "18" }]}
          >
            <Ionicons name={fc.icon as any} size={18} color={fc.color} />
          </View>
          <Text style={styles.feeLabel}>{fc.label}</Text>
          <Text style={[styles.feeValue, { color: fc.color }]}>{fc.value}</Text>
        </Card>
      ))}
    </View>
  );

  const renderPaymentHeader = () => (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>Payment History</Text>
      <Text style={styles.sectionCount}>
        {payments.length} record{payments.length !== 1 ? "s" : ""}
      </Text>
    </View>
  );

  const renderPayment = (payment: Payment) => {
    const ps = PAYMENT_STATUS_MAP[payment.status];
    return (
      <Card key={payment.id} style={styles.paymentCard}>
        <View style={styles.paymentTop}>
          <View style={styles.paymentModeRow}>
            <Ionicons
              name={MODE_ICON[payment.mode] as any}
              size={16}
              color={Colors.muted}
            />
            <Text style={styles.paymentMode}>{payment.mode}</Text>
          </View>
          <Badge variant={ps.variant}>{ps.label}</Badge>
        </View>
        <Text style={styles.paymentDesc} numberOfLines={2}>
          {payment.description}
        </Text>
        <View style={styles.paymentBottom}>
          <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
          <Text style={styles.paymentAmount}>
            {formatCurrency(payment.amount)}
          </Text>
        </View>
      </Card>
    );
  };

  /* ---- Render ---- */
  return (
    <View style={styles.canvas}>
      {/* Header bar */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Student Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={listData}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          switch (item.type) {
            case "info":
              return renderInfo();
            case "feeSummary":
              return renderFeeSummary();
            case "paymentHeader":
              return renderPaymentHeader();
            case "payment":
              return renderPayment(item.item);
            default:
              return null;
          }
        }}
        ListEmptyComponent={
          <Card>
            <Text style={styles.noPaymentsText}>
              No payment records available.
            </Text>
          </Card>
        }
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

  /* ---- Header ---- */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.ink,
    includeFontPadding: false,
  },

  /* ---- List ---- */
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },

  /* ---- Error state ---- */
  errorCard: {
    marginHorizontal: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.lg,
    color: Colors.muted,
    textAlign: "center",
    includeFontPadding: false,
  },

  /* ---- Info card ---- */
  infoCard: {
    gap: 0,
  },
  infoHeader: {
    paddingBottom: Spacing.md,
  },
  infoNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoName: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.ink,
    flex: 1,
    marginRight: Spacing.md,
    includeFontPadding: false,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.line,
    marginBottom: Spacing.md,
  },
  infoRows: {
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  infoRowIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.soft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoRowContent: {
    flex: 1,
    gap: 1,
  },
  infoRowLabel: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.faint,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  infoRowValue: {
    fontSize: FontSize.lg,
    color: Colors.ink,
    includeFontPadding: false,
  },

  /* ---- Fee summary grid ---- */
  feeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginHorizontal: -Spacing.sm,
  },
  feeCard: {
    width: "48%",
    marginLeft: "1%",
    marginRight: "1%",
    borderWidth: 0,
    gap: Spacing.sm,
  },
  feeIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  feeLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  feeValue: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    includeFontPadding: false,
  },

  /* ---- Section header ---- */
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.ink,
    includeFontPadding: false,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    color: Colors.faint,
    includeFontPadding: false,
  },

  /* ---- Payment card ---- */
  paymentCard: {
    gap: Spacing.sm,
  },
  paymentTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentModeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  paymentMode: {
    fontSize: FontSize.base,
    fontWeight: "500",
    color: Colors.ink,
    includeFontPadding: false,
  },
  paymentDesc: {
    fontSize: FontSize.base,
    color: Colors.muted,
    includeFontPadding: false,
  },
  paymentBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentDate: {
    fontSize: FontSize.sm,
    color: Colors.faint,
    includeFontPadding: false,
  },
  paymentAmount: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.ink,
    includeFontPadding: false,
  },

  /* ---- Empty ---- */
  noPaymentsText: {
    fontSize: FontSize.base,
    color: Colors.muted,
    textAlign: "center",
    includeFontPadding: false,
  },
});
