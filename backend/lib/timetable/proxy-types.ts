export type ProxyAssignmentStatus = "PENDING" | "ASSIGNED" | "CANCELLED";

export type ProxyRecommendation = {
  teacherId: string;
  teacherName: string;

  /**
   * Deterministic ranking score.
   * Higher score = better candidate.
   */
  score: number;

  /**
   * Human-readable explanation of why this teacher was ranked.
   */
  reasons: string[];

  /**
   * Number of normal timetable lectures already assigned
   * to the teacher on the absence date.
   */
  currentLectures: number;

  /**
   * Number of proxy classes already assigned
   * to the teacher on the absence date.
   */
  currentProxies: number;

  /**
   * Whether the candidate belongs to the same department
   * as the absent teacher.
   */
  sameDepartment: boolean;

  /**
   * Candidate's department.
   */
  department: string;

  /**
   * Whether this teacher is marked as preferred
   * for the affected subject.
   */
  isPreferred: boolean;
};

export type AffectedLecture = {
  proxyAssignmentId: string;
  timetableSlotId: string;

  date: string;
  status: ProxyAssignmentStatus;

  grade: string;
  day: string;
  period: number;

  subject: {
    id: string;
    name: string;
    code: string;
    requiresLab: boolean;
  };

  absentTeacher: {
    id: string;
    name: string;
    department: string;
  };

  room: {
    id: string;
    roomNumber: string;
    capacity: number;
    type: string;
    isAvailable: boolean;
  };

  assignedProxyTeacher?: {
    id: string;
    name: string;
    department?: string;
  } | null;

  recommendations: ProxyRecommendation[];
};

export type RoomSuggestion = {
  roomId: string;
  roomNumber: string;
  reason: string;
  capacity?: number;
  type?: string;
};

export type ScheduleConflictType =
  | "TEACHER_CLASH"
  | "ROOM_DOUBLE_BOOKED"
  | "LAB_DOUBLE_BOOKED"
  | "ROOM_CLASH"
  | "LAB_CLASH"
  | "LAB_CONFLICT"
  | "CAPACITY_EXCEEDED"
  | "ROOM_UNAVAILABLE";

export type ConflictSeverity = "CRITICAL" | "WARNING";

export type ScheduleConflict = {
  type: ScheduleConflictType;
  severity: ConflictSeverity;

  timetableSlotId: string;

  description: string;

  alternativeRooms: RoomSuggestion[];

  /**
   * Existing timetable slots that could potentially
   * participate in a swap.
   */
  swapSlotIds: string[];

  /**
   * Periods where the affected class/teacher/room
   * may potentially be moved.
   */
  freePeriods: number[];
};
