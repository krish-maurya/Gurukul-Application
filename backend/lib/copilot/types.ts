export type CopilotRole = "ADMIN" | "TEACHER";
export type AssistantIntent =
  | "STUDENT_QUERY"
  | "ATTENDANCE_QUERY"
  | "FEE_QUERY"
  | "TIMETABLE_QUERY"
  | "STAFF_QUERY"
  | "STATS_QUERY"
  | "DOCUMENT_QUERY"
  | "NAVIGATION_REQUEST"
  | "ACTION_REQUEST"
  | "OUT_OF_SCOPE"
  | "AMBIGUOUS_QUERY";

export type AssistantSource = {
  type: "database" | "document";
  label: string;
  id?: string;
};

export type AssistantAction = {
  id: string;
  label: string;
  type: "navigate" | "confirm";
  route?: string;
};

export type AssistantResponse = {
  message: string;
  intent: AssistantIntent;
  sources?: AssistantSource[];
  actions?: AssistantAction[];
  data?: {
    kind:
      | "students"
      | "student_profile"
      | "attendance"
      | "fees"
      | "timetable"
      | "documents"
      | "staff"
      | "stats"
      | "conflicts";
    rows: Record<string, string | number>[];
    stats?: { label: string; value: string }[];
  };
  requiresConfirmation?: boolean;
};

export type CopilotContext = {
  userId: string;
  role: CopilotRole;
  name: string;
};
