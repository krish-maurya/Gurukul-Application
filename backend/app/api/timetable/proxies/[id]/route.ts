import { NextRequest, NextResponse } from "next/server";
import { ProxyDomainError, proxyService } from "@/lib/timetable/proxy-service";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const recommendations = await proxyService.generateRecommendations(
      params.id,
    );
    return NextResponse.json({ recommendations });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate recommendations";
    const statusCode =
      error instanceof ProxyDomainError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    if (typeof body.teacherId !== "string" || !body.teacherId.trim()) {
      return NextResponse.json(
        { error: "teacherId is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    const assignment = await proxyService.selectProxy(
      params.id,
      body.teacherId,
      body.selectedByUserId,
    );

    return NextResponse.json({ assignment });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to assign proxy";
    const statusCode =
      error instanceof ProxyDomainError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
