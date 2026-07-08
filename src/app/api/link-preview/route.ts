import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { scrapeUrl } from "@/lib/scrape";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "الرابط مطلوب" }, { status: 400 });
  }

  const result = await scrapeUrl(target);
  if (!result) {
    return NextResponse.json({ error: "تعذّر جلب الرابط" }, { status: 502 });
  }

  // The card only needs metadata; drop the (potentially large) markdown here.
  const { markdown: _markdown, ...preview } = result;
  return NextResponse.json(preview);
}
