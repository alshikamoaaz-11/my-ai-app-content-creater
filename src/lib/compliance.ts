import { reviewCompliance, type ComplianceAiResult } from "@/lib/anthropic";

/**
 * Public compliance result — the stable contract consumed by the UI. Both the
 * AI review and any future rule-based checks produce this same shape, so new
 * checks can be added without changing the API or UI contract.
 */
export type ComplianceResult = ComplianceAiResult;

export type ComplianceStatus = ComplianceResult["status"];

export type ComplianceWorkspace = "form" | "link" | "campaign";

const WORKSPACE_LABEL: Record<ComplianceWorkspace, string> = {
  form: "المولّد الذكي (قوالب جاهزة)",
  link: "تحويل الرابط إلى منشور",
  campaign: "توليد حملات مكثفة",
};

const SYSTEM_PROMPT = `أنت مدقق امتثال تسويقي لحساب X الرسمي للبنك العربي الوطني (anb) في السعودية. مهمتك مراجعة مسودة منشور تسويقي واحدة والتحقق من التزامها بمعايير الامتثال المصرفي والإعلاني، ثم إرجاع نتيجة منظمة فقط عبر الأداة المتاحة.

ركّز على المخاطر التالية:
- ادعاءات التفوق غير المدعومة (مثل: "الأفضل"، "الأول"، "رقم 1") دون سند.
- لغة الضمان القطعي (مثل: "مضمون"، "بدون أي مخاطر").
- ادعاءات التوقيت غير الواقعية (مثل: "خلال دقائق"، "فوري 100%").
- ادعاءات التمويل أو النسب أو العوائد بلا إفصاح.
- غياب إخلاء المسؤولية عند الحاجة (مثل: "تطبق الشروط والأحكام").

قواعد التقييم:
- status = "pass" إذا لا توجد مخاطر تُذكر ودرجة عالية.
- status = "review" إذا توجد صياغات تحتاج مراجعة بشرية.
- status = "warning" إذا توجد مخالفة واضحة.
- score من 0 إلى 100 يعكس مستوى الامتثال.
- اجعل كل عناصر warnings وsuggestions وrequiredDisclaimers نصوصًا عربية موجزة. اترك المصفوفة فارغة إن لم يوجد ما يُذكر.
- لا تعِد كتابة المنشور، فقط راجعه.`;

function buildUserMessage(draft: string, workspace: ComplianceWorkspace): string {
  return [
    `مساحة العمل: ${WORKSPACE_LABEL[workspace] ?? workspace}`,
    "",
    "المسودة المطلوب مراجعتها:",
    draft.trim(),
    "",
    "راجع المسودة وأرسل نتيجة الامتثال عبر الأداة.",
  ].join("\n");
}

/**
 * Deterministic, non-AI checks. Empty for now — this is the extension point
 * for future rule-based validation (superiority/guarantee/timing/financing
 * claims, missing disclaimers). Each rule returns a partial ComplianceResult
 * that gets merged into the AI result, so adding rules never touches the UI.
 */
type RuleCheck = (draft: string, workspace: ComplianceWorkspace) => Partial<ComplianceResult>;

const RULE_CHECKS: RuleCheck[] = [];

function mergeResults(
  ai: ComplianceResult,
  rules: Partial<ComplianceResult>[]
): ComplianceResult {
  const merged: ComplianceResult = {
    status: ai.status,
    score: ai.score,
    warnings: [...ai.warnings],
    suggestions: [...ai.suggestions],
    requiredDisclaimers: [...ai.requiredDisclaimers],
  };

  const rank: Record<ComplianceStatus, number> = { pass: 0, review: 1, warning: 2 };

  for (const r of rules) {
    if (r.warnings) merged.warnings.push(...r.warnings);
    if (r.suggestions) merged.suggestions.push(...r.suggestions);
    if (r.requiredDisclaimers) merged.requiredDisclaimers.push(...r.requiredDisclaimers);
    // A rule can only tighten (never loosen) the overall status/score.
    if (r.status && rank[r.status] > rank[merged.status]) merged.status = r.status;
    if (typeof r.score === "number") merged.score = Math.min(merged.score, r.score);
  }

  // Dedupe the merged string lists.
  merged.warnings = [...new Set(merged.warnings)];
  merged.suggestions = [...new Set(merged.suggestions)];
  merged.requiredDisclaimers = [...new Set(merged.requiredDisclaimers)];

  return merged;
}

/**
 * Runs a full compliance review: the AI review plus any registered rule
 * checks, merged into one stable ComplianceResult. Independent from content
 * generation — invoked only from the /api/compliance-review endpoint.
 */
export async function runComplianceReview(
  draft: string,
  workspace: ComplianceWorkspace
): Promise<ComplianceResult> {
  const ai = await reviewCompliance(SYSTEM_PROMPT, buildUserMessage(draft, workspace));
  const ruleResults = RULE_CHECKS.map((check) => check(draft, workspace));
  return mergeResults(ai, ruleResults);
}

export function isComplianceWorkspace(v: unknown): v is ComplianceWorkspace {
  return v === "form" || v === "link" || v === "campaign";
}
