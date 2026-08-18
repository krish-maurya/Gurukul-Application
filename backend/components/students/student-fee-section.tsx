import { IndianRupee, Receipt, Calendar, AlertCircle } from "lucide-react";

export interface FeePaymentRow {
  id: string;
  amount: number;
  paidAt: string;
  method: string;
  receiptNo: string;
}

export interface FeeAccountView {
  academicYear: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  status: string;
  payments: FeePaymentRow[];
}

const STATUS_CLS: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  PARTIAL: "bg-sky-100 text-sky-800 border border-sky-200",
  PENDING: "bg-slate-100 text-slate-600 border border-slate-200",
  OVERDUE: "bg-red-100 text-red-700 border border-red-200",
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK: "Bank Transfer",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function StudentFeeSection({
  account,
}: {
  account: FeeAccountView | null;
}) {
  if (!account) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-gurukul-tech" />
          <h2 className="text-sm font-bold text-gurukul-dark">Fee Details</h2>
        </div>
        <div className="bg-white rounded-xl border border-gurukul-gray shadow-subtle px-5 py-8 text-center">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            No fee account set up for this student yet.
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            An administrator can set fees from the Student Registry.
          </p>
        </div>
      </section>
    );
  }

  const remaining = Math.max(0, account.amountDue - account.amountPaid);
  const paidPercent =
    account.amountDue > 0
      ? Math.min(
          100,
          Math.round((account.amountPaid / account.amountDue) * 100),
        )
      : 0;
  const statusCls = STATUS_CLS[account.status] || STATUS_CLS.PENDING;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-gurukul-tech" />
          <h2 className="text-sm font-bold text-gurukul-dark">Fee Details</h2>
        </div>
        <span
          className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${statusCls}`}
        >
          {account.status}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gurukul-gray shadow-subtle p-4 text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            Total Fee
          </p>
          <p className="text-lg font-bold text-gurukul-dark mt-1">
            {formatCurrency(account.amountDue)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {account.academicYear}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gurukul-gray shadow-subtle p-4 text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            Paid
          </p>
          <p className="text-lg font-bold text-emerald-600 mt-1">
            {formatCurrency(account.amountPaid)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {paidPercent}% collected
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gurukul-gray shadow-subtle p-4 text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            Remaining
          </p>
          <p
            className={`text-lg font-bold mt-1 ${remaining > 0 ? "text-gurukul-dark" : "text-emerald-600"}`}
          >
            {formatCurrency(remaining)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" />
            Due {formatDate(account.dueDate)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gurukul-gray shadow-subtle p-4">
        <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mb-2">
          <span>Payment progress</span>
          <span>{paidPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${account.status === "PAID" ? "bg-emerald-500" : account.status === "OVERDUE" ? "bg-red-500" : "bg-gurukul-tech"}`}
            style={{ width: `${paidPercent}%` }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase">
              Academic year
            </p>
            <p className="font-semibold text-gurukul-dark mt-0.5">
              {account.academicYear}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase">
              Due date
            </p>
            <p className="font-semibold text-gurukul-dark mt-0.5">
              {formatDate(account.dueDate)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase">
              Payments made
            </p>
            <p className="font-semibold text-gurukul-dark mt-0.5">
              {account.payments.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase">
              Status
            </p>
            <p className="font-semibold text-gurukul-dark mt-0.5">
              {account.status}
            </p>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-xl border border-gurukul-gray shadow-subtle overflow-hidden">
        <div className="px-5 py-3 border-b border-gurukul-gray flex items-center gap-2">
          <Receipt className="w-4 h-4 text-gurukul-tech" />
          <h3 className="text-xs font-bold text-gurukul-dark">
            Payment History
          </h3>
          {account.payments.length > 0 && (
            <span className="text-[10px] text-slate-400 ml-auto">
              {account.payments.length} transaction
              {account.payments.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {account.payments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No payments recorded yet.
          </p>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-slate-100">
              {account.payments.map((p) => (
                <div key={p.id} className="px-5 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gurukul-dark">
                      {formatCurrency(p.amount)}
                    </span>
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {METHOD_LABELS[p.method] || p.method}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatDate(p.paidAt)}</span>
                    <span className="font-mono text-[10px]">{p.receiptNo}</span>
                  </div>
                </div>
              ))}
              <div className="px-5 py-3 bg-slate-50">
                <span className="text-xs font-semibold text-slate-600">
                  Total paid:{" "}
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  {formatCurrency(account.amountPaid)}
                </span>
              </div>
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[480px]">
                <thead>
                  <tr className="border-b border-gurukul-gray text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Method</th>
                    <th className="px-5 py-3 font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {account.payments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-600">
                        {formatDate(p.paidAt)}
                      </td>
                      <td className="px-5 py-3 font-bold text-gurukul-dark">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {METHOD_LABELS[p.method] || p.method}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-[10px] text-slate-400">
                        {p.receiptNo}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-gurukul-gray">
                    <td className="px-5 py-3 font-semibold text-slate-600">
                      Total paid
                    </td>
                    <td
                      className="px-5 py-3 font-bold text-emerald-700"
                      colSpan={3}
                    >
                      {formatCurrency(account.amountPaid)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
