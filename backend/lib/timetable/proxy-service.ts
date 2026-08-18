import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  AffectedLecture,
  ProxyRecommendation,
  ProxyAssignmentStatus,
} from "./proxy-types";
import { validateTeacherAbsenceInput } from "./proxy-validation";

const DEFAULT_WEIGHTS = {
  freeSlot: 40,
  sameDepartment: 20,
  workload: 20,
  noPreviousProxy: 10,
  preferredTeacher: 10,
} as const;

const CONSTRAINT_KEYS = {
  freeSlot: ["PROXY_BASE_SCORE", "proxy.scoring.free_slot"],
  sameDepartment: ["SAME_DEPARTMENT_WEIGHT", "proxy.scoring.same_department"],
  workload: ["WORKLOAD_WEIGHT", "proxy.scoring.lowest_workload"],
  noPreviousProxy: ["NO_PROXY_WEIGHT", "proxy.scoring.no_previous_proxy"],
  preferredTeacher: [
    "PREFERRED_TEACHER_WEIGHT",
    "proxy.scoring.preferred_teacher",
  ],
} as const;

type ProxyWeights = Record<keyof typeof DEFAULT_WEIGHTS, number>;

type ConstraintSettings = {
  weights: ProxyWeights;
  maxDailyLoad?: number;
  maxWeeklyLoad?: number;
};

type CandidateMetrics = {
  dailyLectures: number;
  weeklyLectures: number;
  proxyCount: number;
  dailyWorkloadPercentage: number;
  weeklyWorkloadPercentage: number;
};

type EligibleCandidate = {
  id: string;
  name: string;
  department: string;

  maxPeriodsPerDay: number;
  maxPeriodsPerWeek: number;
  maxProxiesPerDay: number;

  isActive: boolean;
  isPreferred: boolean;
  sameDepartment: boolean;

  isOnLeave: boolean;
  isBusy: boolean;
  hasProxyClash: boolean;

  metrics: CandidateMetrics;
};

export class ProxyDomainError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ProxyDomainError";
  }
}

export class TeacherNotFoundError extends ProxyDomainError {
  constructor() {
    super("Teacher not found", 404);
    this.name = "TeacherNotFoundError";
  }
}

export class ProxyAssignmentNotFoundError extends ProxyDomainError {
  constructor() {
    super("Proxy assignment not found", 404);
    this.name = "ProxyAssignmentNotFoundError";
  }
}

export class ProxyAssignmentUnavailableError extends ProxyDomainError {
  constructor() {
    super("This coverage request is no longer available", 409);
    this.name = "ProxyAssignmentUnavailableError";
  }
}

export class ProxyCandidateIneligibleError extends ProxyDomainError {
  constructor() {
    super(
      "Selected teacher is no longer eligible for this proxy assignment",
      409,
    );
    this.name = "ProxyCandidateIneligibleError";
  }
}

/**
 * Convert YYYY-MM-DD into the weekday used by the timetable.
 *
 * Uses UTC deliberately so the result does not depend on
 * the server's local timezone.
 */
export function getTimetableDayForDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new ProxyDomainError("A valid YYYY-MM-DD date is required", 400);
  }

  const [year, month, day] = match.slice(1).map(Number);

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    throw new ProxyDomainError("A valid YYYY-MM-DD date is required", 400);
  }

  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][utcDate.getUTCDay()];
}

export class ProxyService {
  /**
   * Report a teacher absence.
   *
   * Business rules:
   * 1. Teacher must exist and be active.
   * 2. Teacher must have at least one scheduled class on the given date.
   * 3. Leave is created/updated.
   * 4. Every timetable lecture affected by the absence
   *    gets a PENDING proxy assignment.
   * 5. Existing ASSIGNED proxy assignments are NOT
   *    silently removed.
   */
  async reportAbsence(teacherId: string, date: string, reason?: string) {
    const input = validateTeacherAbsenceInput({
      teacherId,
      date,
      reason,
    });

    const day = getTimetableDayForDate(input.date);

    const teacher = await prisma.staff.findUnique({
      where: {
        id: input.teacherId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!teacher) {
      throw new TeacherNotFoundError();
    }

    if (!teacher.isActive) {
      throw new ProxyDomainError(
        "Inactive teacher cannot be reported for timetable absence",
        400,
      );
    }

    // Verify teacher has at least one class scheduled
    const scheduledClasses = await prisma.timetableSlot.count({
      where: {
        teacherId: input.teacherId,
        day,
      },
    });

    if (scheduledClasses === 0) {
      throw new ProxyDomainError(
        `Teacher has no scheduled classes on ${day}`,
        400,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.teacherLeave.upsert({
        where: {
          teacherId_date: {
            teacherId: input.teacherId,
            date: input.date,
          },
        },
        create: {
          teacherId: input.teacherId,
          date: input.date,
          reason: input.reason,
          status: "APPROVED",
        },
        update: {
          reason: input.reason,
          status: "APPROVED",
        },
      });

      const slots = await tx.timetableSlot.findMany({
        where: {
          teacherId: input.teacherId,
          day,
        },
        select: {
          id: true,
        },
      });

      await Promise.all(
        slots.map(async (slot) => {
          const existing = await tx.proxyAssignment.findUnique({
            where: {
              timetableSlotId_date: {
                timetableSlotId: slot.id,
                date: input.date,
              },
            },
            select: {
              id: true,
              status: true,
            },
          });

          if (existing?.status === "ASSIGNED") {
            return;
          }

          await tx.proxyAssignment.upsert({
            where: {
              timetableSlotId_date: {
                timetableSlotId: slot.id,
                date: input.date,
              },
            },
            create: {
              timetableSlotId: slot.id,
              absentTeacherId: input.teacherId,
              date: input.date,
              status: "PENDING",
              recommendations: "[]",
            },
            update: {
              absentTeacherId: input.teacherId,
              status: "PENDING",
              proxyTeacherId: null,
              recommendations: "[]",
              selectedByUserId: null,
            },
          });
        }),
      );
    });

    return this.getAffectedLectures(input.teacherId, input.date, true);
  }

  /**
   * Return all lectures affected by a teacher absence.
   */
  async getAffectedLectures(
    teacherId: string,
    date: string,
    refresh = false,
  ): Promise<AffectedLecture[]> {
    const assignments = await prisma.proxyAssignment.findMany({
      where: {
        absentTeacherId: teacherId,
        date,
      },
      include: {
        timetableSlot: {
          include: {
            subject: true,
            teacher: true,
            room: true,
          },
        },
      },
      orderBy: {
        timetableSlot: {
          period: "asc",
        },
      },
    });

    const settings =
      refresh ||
      assignments.some((assignment) => assignment.recommendations === "[]")
        ? await this.fetchConstraintSettings()
        : undefined;

    return Promise.all(
      assignments.map(async (assignment) => {
        const recommendations =
          refresh || assignment.recommendations === "[]"
            ? await this.generateRecommendations(assignment.id, settings)
            : this.parseRecommendations(assignment.recommendations);

        const slot = assignment.timetableSlot;

        return {
          proxyAssignmentId: assignment.id,
          timetableSlotId: slot.id,
          date,
          status: assignment.status as ProxyAssignmentStatus,

          grade: slot.grade,
          day: slot.day,
          period: slot.period,

          subject: {
            id: slot.subject.id,
            name: slot.subject.name,
            code: slot.subject.code,
            requiresLab: slot.subject.requiresLab,
          },

          absentTeacher: {
            id: slot.teacher.id,
            name: slot.teacher.name,
            department: slot.teacher.department,
          },

          room: {
            id: slot.room.id,
            roomNumber: slot.room.roomNumber,
            capacity: slot.room.capacity,
            type: slot.room.type,
            isAvailable: slot.room.isAvailable,
          },

          recommendations,
        };
      }),
    );
  }

  /**
   * Generate deterministic top-3 proxy recommendations.
   *
   * HARD eligibility rules are applied first.
   * Scoring is applied only after a teacher is eligible.
   */
  async generateRecommendations(
    proxyAssignmentId: string,
    preloadedSettings?: ConstraintSettings,
  ): Promise<ProxyRecommendation[]> {
    const assignment = await prisma.proxyAssignment.findUnique({
      where: {
        id: proxyAssignmentId,
      },
      include: {
        timetableSlot: {
          include: {
            teacher: true,
            subject: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new ProxyAssignmentNotFoundError();
    }

    if (assignment.status !== "PENDING") {
      return this.parseRecommendations(assignment.recommendations);
    }

    const slot = assignment.timetableSlot;

    const qualifications = await prisma.staffSubject.findMany({
      where: {
        subjectId: slot.subjectId,
      },
      include: {
        staff: true,
      },
    });

    if (qualifications.length === 0) {
      return this.persistRecommendations(proxyAssignmentId, []);
    }

    const candidateIds = qualifications.map(
      (qualification) => qualification.staffId,
    );

    const [
      constraints,
      leaves,
      dailyWorkloads,
      weeklyWorkloads,
      periodOccupancy,
      assignedProxies,
    ] = await Promise.all([
      preloadedSettings ? Promise.resolve(null) : this.fetchConstraintRows(),

      prisma.teacherLeave.findMany({
        where: {
          date: assignment.date,
          status: "APPROVED",
          teacherId: {
            in: candidateIds,
          },
        },
        select: {
          teacherId: true,
        },
      }),

      prisma.timetableSlot.groupBy({
        by: ["teacherId"],
        where: {
          day: slot.day,
          teacherId: {
            in: candidateIds,
          },
        },
        _count: {
          _all: true,
        },
      }),

      prisma.timetableSlot.groupBy({
        by: ["teacherId"],
        where: {
          teacherId: {
            in: candidateIds,
          },
        },
        _count: {
          _all: true,
        },
      }),

      prisma.timetableSlot.findMany({
        where: {
          day: slot.day,
          period: slot.period,
          teacherId: {
            in: candidateIds,
          },
        },
        select: {
          teacherId: true,
        },
      }),

      prisma.proxyAssignment.findMany({
        where: {
          id: { not: proxyAssignmentId },
          date: assignment.date,
          status: "ASSIGNED",
          proxyTeacherId: {
            in: candidateIds,
          },
        },
        select: {
          proxyTeacherId: true,
          timetableSlot: {
            select: {
              day: true,
              period: true,
            },
          },
        },
      }),
    ]);

    const settings =
      preloadedSettings ?? this.loadConstraints(constraints ?? []);

    const leaveIds = new Set(leaves.map((leave) => leave.teacherId));

    const busyTeacherIds = new Set(
      periodOccupancy.map((occupancy) => occupancy.teacherId),
    );

    const dailyCountByTeacher = new Map(
      dailyWorkloads.map((workload) => [
        workload.teacherId,
        workload._count._all,
      ]),
    );

    const weeklyCountByTeacher = new Map(
      weeklyWorkloads.map((workload) => [
        workload.teacherId,
        workload._count._all,
      ]),
    );

    const proxyMetrics = this.buildProxyMetrics(
      assignedProxies,
      slot.day,
      slot.period,
    );

    const recommendations = qualifications
      .map(({ staff, isPreferred }) =>
        this.toCandidate({
          staff,
          isPreferred,

          absentTeacherId: assignment.absentTeacherId,

          absentDepartment: slot.teacher.department,

          isOnLeave: leaveIds.has(staff.id),

          isBusy: busyTeacherIds.has(staff.id),

          hasProxyClash: proxyMetrics.busyTeacherIds.has(staff.id),

          dailyLectures: dailyCountByTeacher.get(staff.id) ?? 0,

          weeklyLectures: weeklyCountByTeacher.get(staff.id) ?? 0,

          proxyCount: proxyMetrics.countByTeacher.get(staff.id) ?? 0,

          maxDailyLoad: settings.maxDailyLoad,

          maxWeeklyLoad: settings.maxWeeklyLoad,
        }),
      )
      .filter((candidate) => candidate.id !== assignment.absentTeacherId)
      .filter((candidate) => this.isEligible(candidate))
      .map((candidate) =>
        this.toRecommendation(
          candidate,
          settings.weights,
          slot.subject.name,
          slot.period,
        ),
      )
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.currentLectures - b.currentLectures ||
          a.currentProxies - b.currentProxies ||
          a.teacherName.localeCompare(b.teacherName),
      )
      .slice(0, 3);

    return this.persistRecommendations(proxyAssignmentId, recommendations);
  }

  /**
   * Select a proxy teacher.
   *
   * Eligibility is checked AGAIN inside the transaction.
   */
  async selectProxy(
    proxyAssignmentId: string,
    teacherId: string,
    selectedByUserId?: string,
  ) {
    if (!teacherId?.trim()) {
      throw new ProxyCandidateIneligibleError();
    }

    return prisma.$transaction(async (tx) => {
      const assignment = await tx.proxyAssignment.findUnique({
        where: {
          id: proxyAssignmentId,
        },
        include: {
          timetableSlot: {
            include: {
              teacher: true,
              subject: true,
            },
          },
        },
      });

      if (!assignment) {
        throw new ProxyAssignmentNotFoundError();
      }

      if (assignment.status === "CANCELLED") {
        throw new ProxyAssignmentUnavailableError();
      }

      // If already assigned to this exact teacher, return early
      if (
        assignment.status === "ASSIGNED" &&
        assignment.proxyTeacherId === teacherId
      ) {
        return assignment;
      }

      const slot = assignment.timetableSlot;

      /**
       * 1. Verify selected teacher is qualified.
       */
      const qualification = await tx.staffSubject.findUnique({
        where: {
          staffId_subjectId: {
            staffId: teacherId,
            subjectId: slot.subjectId,
          },
        },
        include: {
          staff: true,
        },
      });

      if (!qualification) {
        throw new ProxyCandidateIneligibleError();
      }

      const teacher = qualification.staff;

      /**
       * 2. Teacher must be active.
       */
      if (!teacher.isActive) {
        throw new ProxyCandidateIneligibleError();
      }

      /**
       * 3. Selected teacher cannot be absent teacher.
       */
      if (teacher.id === assignment.absentTeacherId) {
        throw new ProxyCandidateIneligibleError();
      }

      /**
       * 4. Teacher cannot be on approved leave.
       */
      const leave = await tx.teacherLeave.findUnique({
        where: {
          teacherId_date: {
            teacherId,
            date: assignment.date,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (leave?.status === "APPROVED") {
        throw new ProxyCandidateIneligibleError();
      }

      /**
       * 5. Teacher cannot already have a normal
       * timetable lecture at the affected period.
       */
      const timetableClash = await tx.timetableSlot.findFirst({
        where: {
          teacherId,
          day: slot.day,
          period: slot.period,
        },
        select: {
          id: true,
        },
      });

      if (timetableClash) {
        throw new ProxyCandidateIneligibleError();
      }

      /**
       * 6. Teacher cannot already be a proxy at
       * the exact day + period (excluding current assignment).
       */
      const proxyClash = await tx.proxyAssignment.findFirst({
        where: {
          id: { not: proxyAssignmentId },
          date: assignment.date,
          status: "ASSIGNED",
          proxyTeacherId: teacherId,
          timetableSlot: {
            day: slot.day,
            period: slot.period,
          },
        },
        select: {
          id: true,
        },
      });

      if (proxyClash) {
        throw new ProxyCandidateIneligibleError();
      }

      /**
       * 7. Count current daily lectures.
       */
      const dailyLectures = await tx.timetableSlot.count({
        where: {
          teacherId,
          day: slot.day,
        },
      });

      /**
       * 8. Count current weekly lectures.
       */
      const weeklyLectures = await tx.timetableSlot.count({
        where: {
          teacherId,
        },
      });

      /**
       * 9. Count today's assigned proxies (excluding current assignment).
       */
      const dailyProxies = await tx.proxyAssignment.count({
        where: {
          id: { not: proxyAssignmentId },
          date: assignment.date,
          status: "ASSIGNED",
          proxyTeacherId: teacherId,
        },
      });

      /**
       * 10. Read active global workload constraints.
       */
      const constraintRows = await tx.schedulingConstraint.findMany({
        where: {
          key: {
            in: ["MAX_DAILY_LOAD", "MAX_WEEKLY_LOAD"],
          },
          isActive: true,
        },
        select: {
          key: true,
          value: true,
        },
      });

      const constraintValues = new Map(
        constraintRows.map((constraint) => [
          constraint.key,
          Number(constraint.value),
        ]),
      );

      const globalDailyLimit = this.getOptionalPositiveValue(
        constraintValues,
        "MAX_DAILY_LOAD",
      );

      const globalWeeklyLimit = this.getOptionalPositiveValue(
        constraintValues,
        "MAX_WEEKLY_LOAD",
      );

      const effectiveDailyLimit = Math.min(
        teacher.maxPeriodsPerDay,
        globalDailyLimit ?? teacher.maxPeriodsPerDay,
      );

      const effectiveWeeklyLimit = Math.min(
        teacher.maxPeriodsPerWeek,
        globalWeeklyLimit ?? teacher.maxPeriodsPerWeek,
      );

      /**
       * 11. Validate workload.
       */
      if (dailyLectures + 1 > effectiveDailyLimit) {
        throw new ProxyCandidateIneligibleError();
      }

      if (weeklyLectures + 1 > effectiveWeeklyLimit) {
        throw new ProxyCandidateIneligibleError();
      }

      if (dailyProxies + 1 > teacher.maxProxiesPerDay) {
        throw new ProxyCandidateIneligibleError();
      }

      /**
       * 12. Final atomic assignment.
       */
      const result = await tx.proxyAssignment.update({
        where: {
          id: proxyAssignmentId,
        },
        data: {
          proxyTeacherId: teacherId,
          selectedByUserId,
          status: "ASSIGNED",
        },
      });

      /**
       * 13. Keep TeacherWorkload synchronized.
       */
      await tx.teacherWorkload.upsert({
        where: {
          teacherId_date: {
            teacherId,
            date: assignment.date,
          },
        },
        create: {
          teacherId,
          date: assignment.date,
          proxyCount: 1,
        },
        update: {
          proxyCount: {
            increment: 1,
          },
        },
      });

      return result;
    });
  }

  /**
   * Load scoring/workload settings.
   */
  private loadConstraints(
    constraints: Array<{
      key: string;
      value: string;
    }>,
  ): ConstraintSettings {
    const values = new Map(
      constraints.map((constraint) => [
        constraint.key,
        Number(constraint.value),
      ]),
    );

    return {
      weights: {
        freeSlot: this.getWeight(
          values,
          CONSTRAINT_KEYS.freeSlot,
          DEFAULT_WEIGHTS.freeSlot,
        ),

        sameDepartment: this.getWeight(
          values,
          CONSTRAINT_KEYS.sameDepartment,
          DEFAULT_WEIGHTS.sameDepartment,
        ),

        workload: this.getWeight(
          values,
          CONSTRAINT_KEYS.workload,
          DEFAULT_WEIGHTS.workload,
        ),

        noPreviousProxy: this.getWeight(
          values,
          CONSTRAINT_KEYS.noPreviousProxy,
          DEFAULT_WEIGHTS.noPreviousProxy,
        ),

        preferredTeacher: this.getWeight(
          values,
          CONSTRAINT_KEYS.preferredTeacher,
          DEFAULT_WEIGHTS.preferredTeacher,
        ),
      },

      maxDailyLoad: this.getOptionalPositiveValue(values, "MAX_DAILY_LOAD"),

      maxWeeklyLoad: this.getOptionalPositiveValue(values, "MAX_WEEKLY_LOAD"),
    };
  }

  private async fetchConstraintSettings() {
    return this.loadConstraints(await this.fetchConstraintRows());
  }

  private fetchConstraintRows() {
    return prisma.schedulingConstraint.findMany({
      where: {
        key: {
          in: [
            ...Object.values(CONSTRAINT_KEYS).flat(),
            "MAX_DAILY_LOAD",
            "MAX_WEEKLY_LOAD",
          ],
        },
        isActive: true,
      },

      select: {
        key: true,
        value: true,
      },
    });
  }

  private getWeight(
    values: Map<string, number>,
    keys: readonly string[],
    fallback: number,
  ) {
    for (const key of keys) {
      const value = values.get(key);

      if (value !== undefined && Number.isFinite(value) && value >= 0) {
        return value;
      }
    }

    return fallback;
  }

  private getOptionalPositiveValue(values: Map<string, number>, key: string) {
    const value = values.get(key);

    return value !== undefined && Number.isFinite(value) && value > 0
      ? value
      : undefined;
  }

  /**
   * Build metrics for already assigned proxies.
   */
  private buildProxyMetrics(
    assignments: Array<{
      proxyTeacherId: string | null;
      timetableSlot: {
        day: string;
        period: number;
      };
    }>,
    day: string,
    period: number,
  ) {
    const countByTeacher = new Map<string, number>();

    const busyTeacherIds = new Set<string>();

    for (const assignment of assignments) {
      if (!assignment.proxyTeacherId) {
        continue;
      }

      countByTeacher.set(
        assignment.proxyTeacherId,
        (countByTeacher.get(assignment.proxyTeacherId) ?? 0) + 1,
      );

      if (
        assignment.timetableSlot.day === day &&
        assignment.timetableSlot.period === period
      ) {
        busyTeacherIds.add(assignment.proxyTeacherId);
      }
    }

    return {
      countByTeacher,
      busyTeacherIds,
    };
  }

  /**
   * Convert database teacher data into candidate data.
   */
  private toCandidate(input: {
    staff: {
      id: string;
      name: string;
      department: string;
      maxPeriodsPerDay: number;
      maxPeriodsPerWeek: number;
      maxProxiesPerDay: number;
      isActive: boolean;
    };

    isPreferred: boolean;

    absentTeacherId: string;
    absentDepartment: string;

    isOnLeave: boolean;
    isBusy: boolean;
    hasProxyClash: boolean;

    maxDailyLoad?: number;
    maxWeeklyLoad?: number;

    dailyLectures: number;
    weeklyLectures: number;
    proxyCount: number;
  }): EligibleCandidate {
    const effectiveDailyLimit = Math.min(
      input.staff.maxPeriodsPerDay,
      input.maxDailyLoad ?? input.staff.maxPeriodsPerDay,
    );

    const effectiveWeeklyLimit = Math.min(
      input.staff.maxPeriodsPerWeek,
      input.maxWeeklyLoad ?? input.staff.maxPeriodsPerWeek,
    );

    return {
      id: input.staff.id,
      name: input.staff.name,
      department: input.staff.department,

      maxPeriodsPerDay: effectiveDailyLimit,

      maxPeriodsPerWeek: effectiveWeeklyLimit,

      maxProxiesPerDay: input.staff.maxProxiesPerDay,

      isActive: input.staff.isActive,

      isPreferred: input.isPreferred,

      sameDepartment: input.staff.department === input.absentDepartment,

      isOnLeave: input.isOnLeave,

      isBusy: input.isBusy,

      hasProxyClash: input.hasProxyClash,

      metrics: {
        dailyLectures: input.dailyLectures,

        weeklyLectures: input.weeklyLectures,

        proxyCount: input.proxyCount,

        dailyWorkloadPercentage:
          input.dailyLectures / Math.max(1, effectiveDailyLimit),

        weeklyWorkloadPercentage:
          input.weeklyLectures / Math.max(1, effectiveWeeklyLimit),
      },
    };
  }

  /**
   * HARD eligibility rules.
   *
   * A teacher failing any one of these rules
   * must never appear in the top-3 recommendations.
   */
  private isEligible(candidate: EligibleCandidate) {
    return (
      candidate.isActive &&
      !candidate.isOnLeave &&
      !candidate.isBusy &&
      !candidate.hasProxyClash &&
      candidate.metrics.dailyLectures + 1 <= candidate.maxPeriodsPerDay &&
      candidate.metrics.weeklyLectures + 1 <= candidate.maxPeriodsPerWeek &&
      candidate.metrics.proxyCount + 1 <= candidate.maxProxiesPerDay
    );
  }

  /**
   * Convert eligible candidate into UI/API recommendation.
   */
  private toRecommendation(
    candidate: EligibleCandidate,
    weights: ProxyWeights,
    subjectName: string,
    period: number,
  ): ProxyRecommendation {
    /**
     * Calculate the deterministic score before
     * constructing the recommendation.
     */
    const score = this.calculateScore(candidate, weights);

    return {
      teacherId: candidate.id,

      teacherName: candidate.name,

      score,

      reasons: this.buildReasons(candidate, subjectName, period),

      currentLectures: candidate.metrics.dailyLectures,

      currentProxies: candidate.metrics.proxyCount,

      sameDepartment: candidate.sameDepartment,

      /**
       * Required by ProxyRecommendation.
       */
      isPreferred: candidate.isPreferred,

      department: candidate.department,
    };
  }

  /**
   * Deterministic ranking score.
   *
   * Eligibility is handled separately.
   */
  private calculateScore(candidate: EligibleCandidate, weights: ProxyWeights) {
    const normalizedDailyLoad = Math.min(
      1,
      candidate.metrics.dailyWorkloadPercentage,
    );

    const normalizedWeeklyLoad = Math.min(
      1,
      candidate.metrics.weeklyWorkloadPercentage,
    );

    const normalizedLoad = (normalizedDailyLoad + normalizedWeeklyLoad) / 2;

    const workloadScore = Math.round((1 - normalizedLoad) * weights.workload);

    return (
      weights.freeSlot +
      (candidate.sameDepartment ? weights.sameDepartment : 0) +
      workloadScore +
      (candidate.metrics.proxyCount === 0 ? weights.noPreviousProxy : 0) +
      (candidate.isPreferred ? weights.preferredTeacher : 0)
    );
  }

  private buildReasons(
    candidate: EligibleCandidate,
    subjectName: string,
    period: number,
  ) {
    const reasons = [
      `Free during period ${period}`,

      `Qualified ${subjectName} teacher`,

      `Only ${candidate.metrics.dailyLectures} lecture${
        candidate.metrics.dailyLectures === 1 ? "" : "s"
      } today`,
    ];

    if (candidate.sameDepartment) {
      reasons.push("Same department");
    }

    if (candidate.metrics.proxyCount === 0) {
      reasons.push("No proxy assigned today");
    }

    if (candidate.isPreferred) {
      reasons.push("Preferred subject teacher");
    }

    return reasons;
  }

  private async persistRecommendations(
    proxyAssignmentId: string,
    recommendations: ProxyRecommendation[],
  ) {
    await prisma.proxyAssignment.update({
      where: {
        id: proxyAssignmentId,
      },
      data: {
        recommendations: JSON.stringify(recommendations),
      },
    });

    return recommendations;
  }

  private parseRecommendations(recommendations: string): ProxyRecommendation[] {
    try {
      const parsed = JSON.parse(recommendations || "[]");

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed as ProxyRecommendation[];
    } catch {
      return [];
    }
  }
}

export const proxyService = new ProxyService();
