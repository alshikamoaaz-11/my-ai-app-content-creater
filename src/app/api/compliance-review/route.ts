import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { GenerationError } from "@/lib/anthropic";
import { runComplianceReview, isComplianceWorkspace } from "@/lib/compliance";

// Standalone compliance review. Never called during generation — only when the
// marketer explicitly clicks "مراجعة الامتثال". Separate endpoint + separate
// model invocation so generation stays a single call.
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { draft?: string; workspace?: string }
    | null;
  const draft = body?.draft?.trim();
  if (!draft) {
    return NextResponse.json(
      { error: "لا توجد مسودة لمراجعتها" },
      { status: 400 }
    );
  }

  const workspace = isComplianceWorkspace(body?.workspace) ? body.workspace : "form";

  try {
    const result = await runComplianceReview(draft, workspace);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GenerationError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
  }
}
