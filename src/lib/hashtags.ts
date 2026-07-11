/**
 * Mandatory, brand-level hashtags that must appear on every generated post
 * regardless of workspace or content type. The AI never generates these —
 * they are injected by the system. Extend this array to add future
 * mandatory campaign hashtags without touching call sites.
 */
export const MANDATORY_HASHTAGS: readonly string[] = ["#anb"];

const MAX_SUGGESTED_HASHTAGS = 5;

function normalizeHashtag(tag: string): string {
  const trimmed = tag.trim().replace(/\s+/g, "_");
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

/**
 * Cleans raw model output for suggested hashtags: normalizes the "#" prefix,
 * drops anything matching a mandatory hashtag (the model is instructed not
 * to produce these, but this is the safety net), dedupes, and caps the count.
 */
export function sanitizeSuggestedHashtags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const mandatory = new Set(MANDATORY_HASHTAGS.map((t) => t.toLowerCase()));
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of raw) {
    if (typeof item !== "string") continue;
    const normalized = normalizeHashtag(item);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (mandatory.has(key) || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length >= MAX_SUGGESTED_HASHTAGS) break;
  }

  return result;
}
