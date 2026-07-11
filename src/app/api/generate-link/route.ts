import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompt";
import { generateDraft, GenerationError } from "@/lib/anthropic";
import { fetchOgMeta } from "@/lib/scrape";
import { retrieveCategoryExamples } from "@/lib/retrieval";
import { appendLogRow } from "@/lib/sheets";
import { MANDATORY_HASHTAGS, sanitizeSuggestedHashtags } from "@/lib/hashtags";

// Link→post uses the same prompt stack + style DNA + retrieval as the form
// workspace. It grounds the draft ONLY in the page's og:title (passed as page
// context) and the URL — no article text is crawled or summarised. Retrieval is
// scoped to app_download_account, the closest template for driving to a page.
const LINK_CATEGORY = "app_download_account";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const url = body?.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "الرجاء إدخال رابط أولًا" }, { status: 400 });
  }

  // Fetch og:title + og:image only (no crawl, no article text).
  const preview = await fetchOgMeta(url);
  if (!preview) {
    return NextResponse.json(
      { error: "تعذّر قراءة بيانات الرابط، تأكد من صحته" },
      { status: 422 }
    );
  }

  const { merged: examples } = await retrieveCategoryExamples(LINK_CATEGORY, {
    queryText: preview.title,
  });

  const userMessage = buildUserMessage(
    { category: LINK_CATEGORY, partner: "", mechanic: "none", detail: "", link: url },
    preview.title, // og:title passed as the page context (sole fact source)
    examples
  );

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
    category: "تحويل رابط إلى منشور",
    partner: "",
    mechanic: "",
    detail: preview.title,
    link: url,
    draft,
  });

  return NextResponse.json({
    draft,
    preview,
    mandatoryHashtags: MANDATORY_HASHTAGS,
    suggestedHashtags,
  });
}
