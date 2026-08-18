export interface RiskStudent {
  rollNumber: number;
  name: string;
  grade: string;
  attendancePct: number;
  absentDays: number;
  contact: string;
}

export interface CopilotToolResult {
  toolName: string;
  data: any;
  summary: string;
}

/**
 * Business Service Tools for AI Copilot Function Calling
 */
export async function executeCopilotTool(
  query: string,
): Promise<CopilotToolResult> {
  const q = query.toLowerCase();

  // 1. Attendance Risk Tool Query
  if (
    q.includes("75%") ||
    q.includes("attendance") ||
    q.includes("risk") ||
    q.includes("absent")
  ) {
    const riskStudents: RiskStudent[] = [
      {
        rollNumber: 7,
        name: "Mason Miller",
        grade: "Grade 10A",
        attendancePct: 68.5,
        absentDays: 7,
        contact: "+1 (555) 107-2007",
      },
      {
        rollNumber: 19,
        name: "Alexander Robinson",
        grade: "Grade 10A",
        attendancePct: 71.2,
        absentDays: 6,
        contact: "+1 (555) 119-2019",
      },
      {
        rollNumber: 24,
        name: "Riley Walker",
        grade: "Grade 10A",
        attendancePct: 74.0,
        absentDays: 5,
        contact: "+1 (555) 124-2024",
      },
    ];

    return {
      toolName: "getStudentsAtRisk",
      data: riskStudents,
      summary: `Found 3 students with attendance below the 75% threshold in Grade 10A.`,
    };
  }

  // 2. Pending Documents Tool Query
  if (
    q.includes("document") ||
    q.includes("ocr") ||
    q.includes("review") ||
    q.includes("admission")
  ) {
    const pendingDocs = [
      {
        id: "doc-101",
        fileName: "Admission_Form_Aarav_Sharma.pdf",
        extractedName: "Aarav Sharma",
        grade: "Grade 11B",
        confidence: 78.5,
        status: "NEEDS_REVIEW",
      },
    ];

    return {
      toolName: "getPendingDocuments",
      data: pendingDocs,
      summary: `Found 1 document pending human review in the Document Intelligence queue.`,
    };
  }

  // 3. Timetable Conflicts Tool Query
  if (
    q.includes("timetable") ||
    q.includes("conflict") ||
    q.includes("clash") ||
    q.includes("schedule")
  ) {
    const conflicts = [
      {
        id: "conflict-t-1",
        type: "TEACHER_CLASH",
        description:
          "Prof. Alan Turing double-booked at Mon Period 1 (Math 101 & CS 102).",
        suggestedFix: "Move Grade 11B CS 102 to Mon Period 2.",
      },
      {
        id: "conflict-r-2",
        type: "ROOM_CLASH",
        description:
          "Room 101 double-booked at Mon Period 2 for Curie & Feynman.",
        suggestedFix: "Reassign Grade 12A Chem to Room 201.",
      },
    ];

    return {
      toolName: "getTimetableConflicts",
      data: conflicts,
      summary: `Found 2 critical clashes in the master timetable.`,
    };
  }

  // Default General Insight Answer
  return {
    toolName: "generalQuery",
    data: null,
    summary: `GURUKUL AI OS is online and monitoring all school operational services (Document OCR, Timetable Engine, Attendance Grid, and RBAC Audit).`,
  };
}
