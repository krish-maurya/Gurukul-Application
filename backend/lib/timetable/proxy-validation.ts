import { z } from "zod";

const isValidCalendarDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const absenceSchema = z.object({
  teacherId: z.string().trim().min(1, "teacherId is required"),

  date: z
    .string()
    .trim()
    .refine(isValidCalendarDate, "A valid YYYY-MM-DD date is required"),

  reason: z
    .string()
    .trim()
    .max(500, "reason must be 500 characters or fewer")
    .optional(),
});

export type TeacherAbsenceInput = z.infer<typeof absenceSchema>;

export class InvalidAbsenceRequestError extends Error {
  readonly statusCode = 400;

  constructor(
    public readonly issues: Array<{
      path: string;
      message: string;
    }>,
  ) {
    super("Invalid absence request");
    this.name = "InvalidAbsenceRequestError";
  }
}

export function validateTeacherAbsenceInput(
  input: unknown,
): TeacherAbsenceInput {
  const parsed = absenceSchema.safeParse(input);

  if (!parsed.success) {
    throw new InvalidAbsenceRequestError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  return parsed.data;
}
