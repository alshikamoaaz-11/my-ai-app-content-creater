/**
 * Deterministic post-processing of generated drafts.
 *
 * The model is instructed to keep hashtags above the link, but LLM formatting
 * is not 100% reliable. This guarantees the required order: any standalone
 * hashtag line that ends up AFTER the URL is relocated to just above it, so the
 * final structure is always: body … → hashtags → link (last line).
 */

const URL_RE = /https?:\/\/\S+/i;

/** A line whose entire (trimmed) content is one or more hashtags. */
function isStandaloneHashtagLine(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith("#")) return false;
  return /^#[^\s#]+(\s+#[^\s#]+)*$/.test(t);
}

export function enforceHashtagsAboveLink(draft: string, link?: string): string {
  const text = draft.replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  // Find the last line containing the actual link (preferred) or any URL.
  const target = link?.trim();
  let urlIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (target ? line.includes(target) : URL_RE.test(line)) {
      urlIdx = i;
      break;
    }
  }
  if (urlIdx === -1) return draft.trim();

  const after = lines.slice(urlIdx + 1);
  const hashtagsAfter = after.filter(isStandaloneHashtagLine);
  if (hashtagsAfter.length === 0) return draft.trim();

  const restAfter = after.filter((l) => !isStandaloneHashtagLine(l));
  const before = lines.slice(0, urlIdx);
  const urlLine = lines[urlIdx];

  const rebuilt = [...before, ...hashtagsAfter, urlLine, ...restAfter]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return rebuilt;
}
