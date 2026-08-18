import { NextRequest, NextResponse } from "next/server";
import { ProxyDomainError, proxyService } from "@/lib/timetable/proxy-service";
import {
  InvalidAbsenceRequestError,
  validateTeacherAbsenceInput,
} from "@/lib/timetable/proxy-validation";

export async function POST(request: NextRequest) {
  try {
    const input = validateTeacherAbsenceInput(await request.json());
    const lectures = await proxyService.reportAbsence(
      input.teacherId,
      input.date,
      input.reason,
    );

    return NextResponse.json({ lectures }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidAbsenceRequestError) {
      return NextResponse.json(
        { error: error.message, issues: error.issues },
        { status: error.statusCode },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to report absence";
    const statusCode =
      error instanceof ProxyDomainError ? error.statusCode : 500;

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
