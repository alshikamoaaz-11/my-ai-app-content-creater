/**
 * Temporary (pre-embedding) style retrieval over the tweet corpus.
 *
 * Until semantic embeddings land, we ground generation in real anb tweets using
 * only lexical + metadata signals from public.tweets:
 *   - category matching   (hard filter to the requested category)
 *   - engagement sorting   (top-N by engagement_score)
 *   - hashtag similarity   (Jaccard overlap vs the category's typical hashtags
 *                           and any hashtags in the user's input)
 *   - recency weighting    (newer tweets favoured, gentle decay)
 *
 * Two example sets are returned per the product spec: the top engagement tweets
 * and the top "matching" tweets (hashtag similarity + recency). If Supabase is
 * unconfigured or empty, callers fall back to the hardcoded voice examples.
 */
import { getServerSupabase } from "./supabaseServer";

export type RetrievedTweet = {
  id: string;
  text: string;
  hashtags: string[];
  engagement_score: number;
  created_at: string | null;
};

export type RetrievalResult = {
  topEngagement: RetrievedTweet[];
  matches: RetrievedTweet[];
  /** Deduped example texts, engagement set first, ready for the prompt. */
  merged: string[];
};

const EMPTY: RetrievalResult = { topEngagement: [], matches: [], merged: [] };

const HASHTAG_RE = /#[\p{L}\p{N}_\p{M}]+/gu;
const RECENCY_HALFLIFE_DAYS = 180;
const HASHTAG_WEIGHT = 0.7;
const RECENCY_WEIGHT = 0.3;

export function extractHashtags(text?: string): string[] {
  if (!text) return [];
  return Array.from(new Set(text.match(HASHTAG_RE) ?? []));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** 1.0 for "now", decaying with a half-life; 0.5 at RECENCY_HALFLIFE_DAYS old. */
function recencyWeight(createdAt: string | null, nowMs: number): number {
  if (!createdAt) return 0;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return 0;
  const ageDays = Math.max(0, (nowMs - t) / 86_400_000);
  return Math.pow(0.5, ageDays / RECENCY_HALFLIFE_DAYS);
}

/** The most common hashtags in a category — used as its "prototype" tag set. */
function topCategoryHashtags(rows: RetrievedTweet[], limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    for (const h of r.hashtags ?? []) counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([h]) => h);
}

export async function retrieveCategoryExamples(
  category: string,
  opts: { queryText?: string; matchCount?: number; topEngagementCount?: number } = {}
): Promise<RetrievalResult> {
  const matchCount = opts.matchCount ?? 10;
  const topEngagementCount = opts.topEngagementCount ?? 5;

  const supabase = getServerSupabase();
  if (!supabase || !category) return EMPTY;

  const { data, error } = await supabase
    .from("tweets")
    .select("id, text, hashtags, engagement_score, created_at")
    .eq("category", category)
    .limit(1000);

  if (error || !data || data.length === 0) return EMPTY;
  const rows = data as RetrievedTweet[];

  // Engagement set: highest engagement_score first.
  const topEngagement = [...rows]
    .sort((a, b) => b.engagement_score - a.engagement_score)
    .slice(0, topEngagementCount);

  // Matching set: hashtag similarity + recency. Query hashtags = user's own
  // hashtags (if any) unioned with the category's prototypical hashtags.
  const queryTags = new Set([
    ...extractHashtags(opts.queryText),
    ...topCategoryHashtags(rows),
  ]);
  const now = Date.now();

  const matches = [...rows]
    .map((r) => {
      const sim = jaccard(new Set(r.hashtags ?? []), queryTags);
      const rec = recencyWeight(r.created_at, now);
      return { row: r, score: HASHTAG_WEIGHT * sim + RECENCY_WEIGHT * rec };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, matchCount)
    .map((s) => s.row);

  // Merge: engagement examples first (highest quality), then matches, deduped.
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const t of [...topEngagement, ...matches]) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    merged.push(t.text);
  }

  return { topEngagement, matches, merged };
}
