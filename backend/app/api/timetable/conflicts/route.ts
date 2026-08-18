import { NextRequest, NextResponse } from "next/server";
import {
  conflictService,
  RoomConflictError,
} from "@/lib/timetable/conflict-service";
import { ProxyDomainError } from "@/lib/timetable/proxy-service";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "YYYY-MM-DD date is required in query parameter" },
        { status: 400 },
      );
    }

    const conflicts = await conflictService.detect(date);
    return NextResponse.json({ conflicts });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to detect timetable conflicts";
    const statusCode =
      error instanceof ProxyDomainError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slotId, roomId, date } = body;

    if (!slotId || typeof slotId !== "string") {
      return NextResponse.json(
        { error: "slotId is required" },
        { status: 400 },
      );
    }

    if (!roomId || typeof roomId !== "string") {
      return NextResponse.json(
        { error: "roomId is required" },
        { status: 400 },
      );
    }

    const updatedSlot = await conflictService.reassignRoom(
      slotId,
      roomId,
      date,
    );
    return NextResponse.json({ success: true, slot: updatedSlot });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reassign room";
    const statusCode =
      error instanceof RoomConflictError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
