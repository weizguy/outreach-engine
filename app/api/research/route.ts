import { NextResponse } from "next/server";
import { runResearch } from "@/lib/ai/research";
import { researchRequestSchema } from "@/lib/schemas/research";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = researchRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Invalid request body",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    const result = await runResearch(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
