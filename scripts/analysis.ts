/**
 * Pure tweet-analysis functions used by analyze-tweets.ts.
 *
 * Kept dependency-free and side-effect-free so they can be unit-tested and
 * reused by later phases (e.g. style retrieval / generation). Category values
 * are aligned with the app's taxonomy in src/lib/categories.ts.
 */
import { CATEGORIES } from "../src/lib/categories";

export type TweetMetrics = {
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
};

export type TweetAnalysis = {
  hashtags: string[];
  emoji_count: number;
  engagement_score: number;
  has_cta: boolean;
  category: string;
};

/** Valid category values (the 7 app templates) plus an explicit fallback. */
export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);
export const UNCATEGORIZED = "other";

const HASHTAG_RE = /#[\p{L}\p{N}_\p{M}]+/gu;
const URL_RE = /https?:\/\/\S+|\[LINK\]/i;
const EMOJI_RE = /\p{Extended_Pictographic}/u;

/** Extract hashtags (Arabic + Latin), including the leading '#', de-duplicated. */
export function extractHashtags(text: string): string[] {
  const matches = text.match(HASHTAG_RE) ?? [];
  return Array.from(new Set(matches));
}

/**
 * Count emoji as user-perceived characters: grapheme clusters containing an
 * Extended_Pictographic code point. This treats ZWJ sequences and skin-tone
 * modifiers (👨‍👩‍👧, 👍🏽) as a single emoji rather than several.
 */
export function countEmojis(text: string): number {
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
  let count = 0;
  for (const { segment } of segmenter.segment(text)) {
    if (EMOJI_RE.test(segment)) count++;
  }
  return count;
}

/** Weighted interaction score. Replies/retweets weigh more than a like. */
export function computeEngagementScore(m: TweetMetrics): number {
  return m.likes + 2 * m.retweets + 3 * m.replies;
}

const CTA_PHRASES = [
  "حمّل التطبيق",
  "حمل التطبيق",
  "حمّل",
  "حمل",
  "للتفاصيل",
  "للمزيد",
  "افتح حساب",
  "افتح حسابك",
  "فتح حساب",
  "سجل",
  "سجّل",
  "شارك",
  "شاركنا",
  "تابعنا",
  "فعّل",
  "فعل التنبيهات",
  "اضغط",
  "زور",
  "اطلب",
  "انضم",
  "احجز",
  "اشترك",
  "للاشتراك",
  "سارع",
  "العب",
  "الحق",
];

/** A tweet has a CTA if it links out or contains an explicit action phrase. */
export function detectCTA(text: string): boolean {
  if (URL_RE.test(text)) return true;
  return CTA_PHRASES.some((p) => text.includes(p));
}

// Keyword signals per category. Order of iteration is the tiebreak priority.
const CATEGORY_KEYWORDS: Array<{ value: string; keywords: string[] }> = [
  {
    value: "banking_tip_security",
    keywords: [
      "فكر_مرتين",
      "احتيال",
      "الرمز السري",
      "رمز التحقق",
      "بياناتك",
      "أمان",
      "تحذير",
      "لا تشارك",
      "حقك_كمستهلك",
      "حريص",
      "حماية",
      "خصوصيتك",
    ],
  },
  {
    value: "prize_sweepstakes",
    keywords: [
      "مسابقة",
      "السحب",
      "سحب",
      "الفائز",
      "فائز",
      "جائزة",
      "جوائز",
      "اربح",
      "السؤال الأسبوعي",
      "ادخل السحب",
      "وفالك الفوز",
      "مليون",
    ],
  },
  {
    value: "holiday_greeting",
    keywords: [
      "عيد",
      "العيد",
      "رمضان",
      "مبارك",
      "كل عام",
      "اليوم الوطني",
      "اليوم_الوطني",
      "هجري",
      "رأس السنة",
      "تهنئة",
      "عيدكم",
      "عساكم",
    ],
  },
  {
    value: "app_download_account",
    keywords: [
      "حمّل التطبيق",
      "حمل التطبيق",
      "افتح حساب",
      "افتح حسابك",
      "فتح حساب",
      "سجل في برنامج مكافآت",
      "التطبيق",
    ],
  },
  {
    value: "cashback_rewards",
    keywords: [
      "استرداد نقدي",
      "كاش باك",
      "كاشباك",
      "نقاط مكافآت",
      "نقاطك",
      "مكافآت",
      "استبدال النقاط",
      "استرداد",
    ],
  },
  {
    value: "bare_partner_card",
    keywords: ["ادفع بنقاطك", "ادفع بنقاط", "بنقاطك في"],
  },
];

function countHits(text: string, keywords: string[]): number {
  return keywords.reduce((n, k) => (text.includes(k) ? n + 1 : n), 0);
}

/**
 * Heuristic content classifier mapping a tweet to one of the app's 7 template
 * categories (or "other"). Combines keyword scoring with two structural rules:
 *   - a short, link-free question is an engagement poll;
 *   - a short "ادفع بنقاطك …" line is a bare partner card.
 */
export function classifyCategory(text: string): string {
  const trimmed = text.trim();
  const hasLink = URL_RE.test(trimmed);
  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  const isQuestion = /[؟?]\s*$/.test(trimmed);

  // Poll: a single short question with no link and no call-to-action.
  if (isQuestion && !hasLink && lines.length <= 2 && trimmed.length <= 140) {
    return "engagement_poll";
  }

  const scores = CATEGORY_KEYWORDS.map((c) => ({
    value: c.value,
    score: countHits(trimmed, c.keywords),
  }));

  // Bare partner card: pay-with-points mention in a short, image-led post.
  const partnerHit = trimmed.includes("ادفع بنقاطك");
  if (partnerHit && lines.length <= 2 && trimmed.length <= 120) {
    return "bare_partner_card";
  }

  let best = scores[0];
  for (const s of scores) if (s.score > best.score) best = s;

  return best.score > 0 ? best.value : UNCATEGORIZED;
}

export function analyzeTweet(text: string, metrics: TweetMetrics): TweetAnalysis {
  return {
    hashtags: extractHashtags(text),
    emoji_count: countEmojis(text),
    engagement_score: computeEngagementScore(metrics),
    has_cta: detectCTA(text),
    category: classifyCategory(text),
  };
}
