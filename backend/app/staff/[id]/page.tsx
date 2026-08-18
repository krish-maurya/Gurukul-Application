import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function TeacherDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const teacher = await prisma.staff.findUnique({ where: { id: params.id } });
  if (!teacher) notFound();

  const fields = [
    ["Email", teacher.email],
    ["Department", teacher.department],
    ["Maximum periods per day", teacher.maxPeriodsPerDay],
  ];
  return (
    <div className="max-w-3xl space-y-6">
      <div
        className="border-b pb-5 flex items-center gap-3"
        style={{ borderColor: "var(--line)" }}
      >
        <div
          className="w-10 h-10 rounded-lg text-white flex items-center justify-center"
          style={{ background: "var(--accent)" }}
        >
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1
            className="text-xl font-bold text-gurukul-ink"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {teacher.name}
          </h1>
          <p className="text-xs" style={{ color: "var(--faint)" }}>
            Teacher Information
          </p>
        </div>
      </div>
      <div
        className="bg-white rounded-xl border shadow-subtle divide-y"
        style={{ borderColor: "var(--line)" }}
      >
        {fields.map(([label, value]) => (
          <div
            key={String(label)}
            className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-5 py-4 text-xs"
          >
            <dt className="font-semibold" style={{ color: "var(--faint)" }}>
              {label}
            </dt>
            <dd className="sm:col-span-2 text-gurukul-ink">{String(value)}</dd>
          </div>
        ))}
      </div>
    </div>
  );
}
