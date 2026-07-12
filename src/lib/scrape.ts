/**
 * URL scraping for link previews + agent grounding.
 *
 * Primary path: the standalone Crawl4AI service (see /crawler-service), reached
 * over HTTP via CRAWLER_SERVICE_URL. It renders JS and returns clean markdown.
 *
 * Fallback path: a dependency-free fetch + Open Graph tag parser that runs
 * natively on Vercel. No JS rendering, meta + <title> only, empty markdown.
 *
 * The fallback keeps the app fully working when the crawler service is unset
 * or unreachable.
 */

export type ScrapeResult = {
  url: string;
  title: string;
  description: string;
  image: string | null;
  siteName: string | null;
  /** Clean page text/markdown for grounding. Empty on the fallback path. */
  markdown: string;
};

/** Metadata subset sent to the client for the preview card (no markdown). */
export type LinkPreview = Omit<ScrapeResult, "markdown">;

function isHttpUrl(value: string): URL | null {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function scrapeViaCrawler(url: string): Promise<ScrapeResult | null> {
  const base = process.env.CRAWLER_SERVICE_URL?.trim();
  if (!base) return null;

  const endpoint = `${base.replace(/\/+$/, "")}/scrape?url=${encodeURIComponent(url)}`;
  const headers: Record<string, string> = {};
  if (process.env.CRAWLER_SECRET) {
    headers["x-crawler-secret"] = process.env.CRAWLER_SECRET;
  }

  try {
    const res = await fetch(endpoint, {
      headers,
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<ScrapeResult>;
    return {
      url: data.url ?? url,
      title: data.title ?? new URL(url).hostname,
      description: data.description ?? "",
      image: data.image ?? null,
      siteName: data.siteName ?? new URL(url).hostname,
      markdown: data.markdown ?? "",
    };
  } catch {
    return null;
  }
}

async function scrapeViaFetch(u: URL): Promise<ScrapeResult | null> {
  let html: string;
  try {
    const res = await fetch(u.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; anbContentAgent/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const titleTagMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  let image = extractMeta(html, "og:image") || extractMeta(html, "twitter:image");
  if (image) {
    try {
      image = new URL(image, u).toString();
    } catch {
      /* keep as-is */
    }
  }

  return {
    url: u.toString(),
    title:
      extractMeta(html, "og:title") ||
      extractMeta(html, "twitter:title") ||
      titleTagMatch?.[1]?.trim() ||
      u.hostname,
    description:
      extractMeta(html, "og:description") ||
      extractMeta(html, "twitter:description") ||
      extractMeta(html, "description") ||
      "",
    image: image ?? null,
    siteName: extractMeta(html, "og:site_name") || u.hostname,
    markdown: "",
  };
}

/**
 * Fetch ONLY Open Graph metadata (title + image, plus description/siteName),
 * never article text and never the Crawl4AI service. Used by the link→post
 * workspace, which must not crawl or summarise full page content.
 */
export async function fetchOgMeta(rawUrl: string): Promise<LinkPreview | null> {
  const u = isHttpUrl(rawUrl.trim());
  if (!u) return null;
  const result = await scrapeViaFetch(u);
  if (!result) return null;
  const { markdown: _markdown, ...meta } = result;
  return meta;
}

/**
 * Scrape a URL, preferring Crawl4AI, falling back to fetch+OG parsing.
 * Returns null only for an invalid URL or when both paths fail.
 */
export async function scrapeUrl(rawUrl: string): Promise<ScrapeResult | null> {
  const u = isHttpUrl(rawUrl.trim());
  if (!u) return null;

  const viaCrawler = await scrapeViaCrawler(u.toString());
  if (viaCrawler) return viaCrawler;

  return scrapeViaFetch(u);
}
