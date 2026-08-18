import { NextResponse } from "next/server";
import { answerCopilot } from "@/lib/copilot/engine";
import {
  generateCasualReply,
  isCasualGreeting,
  polishGroundedResponse,
  understandCopilotRequest,
} from "@/lib/copilot/nlp";
import type { CopilotContext } from "@/lib/copilot/types";
import { getSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Identity comes from the authenticated server session cookie — the client
  // can no longer choose its own identity via headers.
  const session = await getSession();
  if (!session)
    return NextResponse.json(
      { message: "Sign in to use GURUKUL Assistant." },
      { status: 401 },
    );
  const context: CopilotContext = {
    userId: session.sub,
    name: session.name,
    role: session.role,
  };
  try {
    const body = await request.json();
    if (typeof body?.query !== "string")
      return NextResponse.json(
        { message: "A valid question is required." },
        { status: 400 },
      );
    const history: Array<{ role: string; content: string; intent?: string }> =
      Array.isArray(body.history) ? body.history : [];
    if (isCasualGreeting(body.query)) {
      const casualMessage = await generateCasualReply(body.query, context.name);
      if (casualMessage)
        return NextResponse.json({
          message: casualMessage,
          intent: "AMBIGUOUS_QUERY",
        });
    }
    const normalizedQuery = await understandCopilotRequest(body.query, history);
    const retrievedResponse = await answerCopilot(
      normalizedQuery,
      context,
      history,
    );
    const response = await polishGroundedResponse(
      retrievedResponse,
      body.query,
      context,
    );
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { message: "I couldn't process that request right now." },
      { status: 500 },
    );
  }
}
