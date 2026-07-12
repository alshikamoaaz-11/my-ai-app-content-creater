import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The anb Voice DNA document (style_dna.md at the repo root) is the canonical,
 * empirically-derived style guide. It is injected into every generation request
 * before the retrieved examples.
 *
 * Loaded once from disk (server-side, Node runtime) and cached. A short inline
 * fallback keeps generation grounded if the file can't be read for any reason.
 */
const FALLBACK = [
  "دليل أسلوب anb (مختصر احتياطي):",
  "- لهجة سعودية عامية، ودّية، تبدأ بخطاف قصير عن الفائدة.",
  "- 2 إلى 5 أسطر، فقرات مفصولة بسطر فارغ، الطول ~120-170 حرفًا.",
  "- 1-3 إيموجي، وأي قلب يكون أزرق 💙 فقط.",
  "- ضع #anb دائمًا، 1-2 هاشتاق، والهاشتاقات فوق الرابط مباشرةً (الرابط آخر سطر).",
  "- لا تخترع أي رقم أو نسبة أو اسم شريك أو تاريخ.",
].join("\n");

let cached: string | null = null;

export function getStyleDna(): string {
  if (cached !== null) return cached;
  try {
    cached = readFileSync(join(process.cwd(), "style_dna.md"), "utf8").trim();
  } catch {
    cached = FALLBACK;
  }
  return cached;
}
