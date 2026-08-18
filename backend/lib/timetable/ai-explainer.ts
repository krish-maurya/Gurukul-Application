import { TimetableConflictDetail } from "./optimizer";

export interface AIExplanation {
  headline: string;
  cause: string;
  impact: string;
  recommendation: string;
  confidenceScore: number;
}

/**
 * Formulates clear, plain-language AI explanatory insights for timetable conflicts
 */
export function generateAIConflictExplanation(
  conflict: TimetableConflictDetail,
): AIExplanation {
  if (conflict.type === "TEACHER_CLASH") {
    return {
      headline: `Faculty Scheduling Overlap Detected`,
      cause: `The optimization engine detected that ${conflict.description.split("is assigned")[0]} has been scheduled for two simultaneous lectures.`,
      impact: `If unmanaged, one of the classes will be left unsupervised during Period ${conflict.period} on ${conflict.day}.`,
      recommendation: conflict.suggestedFix,
      confidenceScore: 0.98,
    };
  }

  if (conflict.type === "ROOM_CLASH") {
    return {
      headline: `Physical Facility Contention`,
      cause: `${conflict.description.split("is double-booked")[0]} has two different grade sections assigned to the same physical room.`,
      impact: `Physical overcrowding and student displacement in Main Academic Block.`,
      recommendation: conflict.suggestedFix,
      confidenceScore: 0.96,
    };
  }

  return {
    headline: `Schedule Constraint Warning`,
    cause: conflict.description,
    impact: `Minor administrative friction during schedule execution.`,
    recommendation: conflict.suggestedFix,
    confidenceScore: 0.92,
  };
}
