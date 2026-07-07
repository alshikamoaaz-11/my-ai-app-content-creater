import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { SYSTEM_PROMPT, buildUserMessage, DraftFormInput } from "@/lib/prompt";
import { appendLogRow } from "@/lib/sheets";
import { findCategory, findMechanic } from "@/lib/categories";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as DraftFormInput | null;
  if (!body || !body.category || !body.mechanic) {
    return NextResponse.json({ error: "بيانات النموذج غير مكتملة" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "لم يتم إعداد مفتاح Anthropic API على الخادم" },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const userMessage = buildUserMessage(body);

  let draft: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    draft = textBlock && "text" in textBlock ? textBlock.text.trim() : "";

    if (!draft) {
      return NextResponse.json(
        { error: "لم يتمكن Claude من إنشاء مسودة" },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[generate] Anthropic API error:", err);
    return NextResponse.json(
      { error: "تعذّر الاتصال بخدمة الذكاء الاصطناعي" },
      { status: 502 }
    );
  }

  await appendLogRow({
    timestamp: new Date().toISOString(),
    username: session.username,
    category: findCategory(body.category)?.label ?? body.category,
    partner: body.partner || "",
    mechanic: findMechanic(body.mechanic)?.label ?? body.mechanic,
    detail: body.detail || "",
    link: body.link || "",
    draft,
  });

  return NextResponse.json({ draft });
}
