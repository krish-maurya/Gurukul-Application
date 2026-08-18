"use server";

import { proxyService } from "@/lib/timetable/proxy-service";
import { conflictService } from "@/lib/timetable/conflict-service";
import { validateTeacherAbsenceInput } from "@/lib/timetable/proxy-validation";

export async function reportTeacherAbsenceAction(input: {
  teacherId: string;
  date: string;
  reason?: string;
}) {
  const validated = validateTeacherAbsenceInput(input);
  return proxyService.reportAbsence(
    validated.teacherId,
    validated.date,
    validated.reason,
  );
}

export async function selectProxyAction(input: {
  proxyAssignmentId: string;
  teacherId: string;
  selectedByUserId?: string;
}) {
  return proxyService.selectProxy(
    input.proxyAssignmentId,
    input.teacherId,
    input.selectedByUserId,
  );
}

export async function reassignRoomAction(input: {
  slotId: string;
  roomId: string;
  date?: string;
}) {
  return conflictService.reassignRoom(input.slotId, input.roomId, input.date);
}
