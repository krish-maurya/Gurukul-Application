import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const documents = await prisma.documentRecord.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error("[api/documents] request failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = String(body.id || "");
    if (!id)
      return NextResponse.json(
        { error: "Document id is required" },
        { status: 400 },
      );
    const document = await prisma.documentRecord.update({
      where: { id },
      data: {
        ...(body.status ? { status: String(body.status) } : {}),
        ...(body.confidenceScore !== undefined
          ? { confidenceScore: Number(body.confidenceScore) }
          : {}),
        ...(body.extractedFields
          ? {
              extractedFields:
                typeof body.extractedFields === "string"
                  ? body.extractedFields
                  : JSON.stringify(body.extractedFields),
            }
          : {}),
      },
    });
    return NextResponse.json(document);
  } catch (error) {
    console.error("[api/documents] update failed:", error);
    return NextResponse.json(
      { error: "Failed to update document record" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const document = await prisma.documentRecord.create({
      data: {
        fileName: body.fileName,
        documentType: body.documentType || "Admission Form",
        status: body.status || "NEEDS_REVIEW",
        confidenceScore: body.confidenceScore || 80.0,
        rawText: body.rawText || "",
        extractedFields:
          typeof body.extractedFields === "string"
            ? body.extractedFields
            : JSON.stringify(body.extractedFields),
      },
    });
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("[api/documents] request failed:", error);
    return NextResponse.json(
      { error: "Failed to create document record" },
      { status: 500 },
    );
  }
}
