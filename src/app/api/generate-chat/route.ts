import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { SYSTEM_PROMPT, buildChatUserMessage } from "@/lib/prompt";
import { generateDraft, GenerationError } from "@/lib/anthropic";
import { appendLogRow } from "@/lib/sheets";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { topic?: string } | null;
  const topic = body?.topic?.trim();
  if (!topic) {
    return NextResponse.json({ error: "الرجاء كتابة الموضوع أولًا" }, { status: 400 });
  }

  const userMessage = buildChatUserMessage(topic);

  let draft: string;
  try {
    draft = await generateDraft(SYSTEM_PROMPT, userMessage);
  } catch (err) {
    if (err instanceof GenerationError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
  }

  await appendLogRow({
    timestamp: new Date().toISOString(),
    username: session.username,
    category: "محادثة حرة",
    partner: "",
    mechanic: "",
    detail: topic,
    link: "",
    draft,
  });

  return NextResponse.json({ draft });
}
