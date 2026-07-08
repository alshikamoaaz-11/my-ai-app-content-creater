import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { SYSTEM_PROMPT, buildUserMessage, DraftFormInput } from "@/lib/prompt";
import { generateDraft, GenerationError } from "@/lib/anthropic";
import { appendLogRow } from "@/lib/sheets";
import { findCategory, findMechanic } from "@/lib/categories";
import { scrapeUrl } from "@/lib/scrape";
import { enforceHashtagsAboveLink } from "@/lib/format";

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

  // Scrape the link once, server-side: markdown grounds the model, and the
  // metadata is returned so the client renders the preview without re-fetching.
  const scraped = body.link?.trim() ? await scrapeUrl(body.link) : null;
  const preview = scraped
    ? {
        url: scraped.url,
        title: scraped.title,
        description: scraped.description,
        image: scraped.image,
        siteName: scraped.siteName,
      }
    : null;

  const userMessage = buildUserMessage(body, scraped?.markdown);

  let draft: string;
  try {
    draft = await generateDraft(SYSTEM_PROMPT, userMessage);
  } catch (err) {
    if (err instanceof GenerationError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
  }

  draft = enforceHashtagsAboveLink(draft, body.link);

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

  return NextResponse.json({ draft, preview });
}
