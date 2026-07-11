import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { SYSTEM_PROMPT, buildUserMessage, DraftFormInput } from "@/lib/prompt";
import { generateDraft, GenerationError } from "@/lib/anthropic";
import { appendLogRow } from "@/lib/sheets";
import { findCategory, findMechanic } from "@/lib/categories";
import { scrapeUrl } from "@/lib/scrape";
import { retrieveCategoryExamples } from "@/lib/retrieval";
import { MANDATORY_HASHTAGS, sanitizeSuggestedHashtags } from "@/lib/hashtags";

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

  // Ground the draft in real anb tweets from the same category (top engagement
  // + hashtag/recency matches). Falls back to hardcoded examples if empty.
  const { merged: examples } = await retrieveCategoryExamples(body.category, {
    queryText: `${body.partner ?? ""} ${body.detail ?? ""}`,
  });

  const userMessage = buildUserMessage(body, scraped?.markdown, examples);

  let draft: string;
  let suggestedHashtags: string[];
  try {
    const result = await generateDraft(SYSTEM_PROMPT, userMessage);
    draft = result.draft;
    suggestedHashtags = sanitizeSuggestedHashtags(result.suggestedHashtags);
  } catch (err) {
    if (err instanceof GenerationError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
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

  return NextResponse.json({
    draft,
    preview,
    mandatoryHashtags: MANDATORY_HASHTAGS,
    suggestedHashtags,
  });
}
