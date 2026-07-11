import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { SYSTEM_PROMPT, buildChatUserMessage } from "@/lib/prompt";
import { generateDraft, GenerationError } from "@/lib/anthropic";
import { appendLogRow } from "@/lib/sheets";
import { MANDATORY_HASHTAGS, sanitizeSuggestedHashtags } from "@/lib/hashtags";

// Bulk campaign: 3 distinct drafts from one brief, reusing the existing chat
// prompt stack (style DNA + example sampling) untouched. A per-version nudge is
// appended to the user message only to keep the three variants distinct.
const ALL_LABELS = ["A", "B", "C"] as const;
type CampaignLabel = (typeof ALL_LABELS)[number];

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { brief?: string; labels?: string[] }
    | null;
  const brief = body?.brief?.trim();
  if (!brief) {
    return NextResponse.json({ error: "الرجاء كتابة موجز الحملة أولًا" }, { status: 400 });
  }

  // Optional: regenerate a subset (e.g. just one variation) instead of all three.
  const requestedLabels = body?.labels?.filter((l): l is CampaignLabel =>
    (ALL_LABELS as readonly string[]).includes(l)
  );
  const labels: readonly CampaignLabel[] =
    requestedLabels && requestedLabels.length ? requestedLabels : ALL_LABELS;

  const base = buildChatUserMessage(brief);

  try {
    const drafts = await Promise.all(
      labels.map(async (label) => {
        const userMessage = `${base}\n\n(اكتب نسخة مختلفة ومتميزة عن باقي النسخ — النسخة ${label}.)`;
        const result = await generateDraft(SYSTEM_PROMPT, userMessage);
        return {
          label,
          draft: result.draft,
          mandatoryHashtags: MANDATORY_HASHTAGS,
          suggestedHashtags: sanitizeSuggestedHashtags(result.suggestedHashtags),
        };
      })
    );

    await appendLogRow({
      timestamp: new Date().toISOString(),
      username: session.username,
      category: "توليد حملات مكثفة",
      partner: "",
      mechanic: "",
      detail: brief,
      link: "",
      draft: drafts.map((d) => `النسخة ${d.label}:\n${d.draft}`).join("\n\n———\n\n"),
    });

    return NextResponse.json({ drafts });
  } catch (err) {
    if (err instanceof GenerationError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
  }
}
