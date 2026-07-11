import Anthropic from "@anthropic-ai/sdk";

export class GenerationError extends Error {}

export type StructuredDraft = {
  draft: string;
  suggestedHashtags: string[];
};

const DRAFT_TOOL_NAME = "submit_draft";

/**
 * Forces the model to return draft text and suggested hashtags as separate,
 * structured fields (tool use) instead of one blob of text — avoids brittle
 * regex extraction of hashtags from free-form output.
 */
export async function generateDraft(
  systemPrompt: string,
  userMessage: string
): Promise<StructuredDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new GenerationError("لم يتم إعداد مفتاح Anthropic API على الخادم");
  }

  const anthropic = new Anthropic({ apiKey });

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      tools: [
        {
          name: DRAFT_TOOL_NAME,
          description:
            "أرسل نص التغريدة النهائي والهاشتاقات المقترحة كحقلين منفصلين.",
          input_schema: {
            type: "object",
            properties: {
              draft: {
                type: "string",
                description:
                  "نص التغريدة النهائي فقط، جاهز للنسخ، بدون أي هاشتاق (#) داخله مطلقًا وبدون شرح إضافي — إلا في حالات الاستثناء المذكورة في التعليمات.",
              },
              suggestedHashtags: {
                type: "array",
                items: { type: "string" },
                description:
                  "بين 2 و5 هاشتاقات مقترحة ذات صلة بمحتوى التغريدة فقط. لا تُدرِج #anb هنا أبدًا — يُضاف تلقائيًا من النظام كهاشتاق إلزامي.",
              },
            },
            required: ["draft", "suggestedHashtags"],
          },
        },
      ],
      tool_choice: { type: "tool", name: DRAFT_TOOL_NAME },
    });
  } catch (err) {
    console.error("[anthropic] API error:", err);
    throw new GenerationError("تعذّر الاتصال بخدمة الذكاء الاصطناعي");
  }

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === DRAFT_TOOL_NAME
  );
  const input = toolBlock?.input as
    | { draft?: string; suggestedHashtags?: unknown }
    | undefined;

  const draft = input?.draft?.trim() ?? "";
  if (!draft) {
    throw new GenerationError("لم يتمكن Claude من إنشاء مسودة");
  }

  const suggestedHashtags = Array.isArray(input?.suggestedHashtags)
    ? input.suggestedHashtags.filter((t): t is string => typeof t === "string")
    : [];

  return { draft, suggestedHashtags };
}

/** Raw structured output from the compliance-review model call. */
export type ComplianceAiResult = {
  status: "pass" | "review" | "warning";
  score: number;
  warnings: string[];
  suggestions: string[];
  requiredDisclaimers: string[];
};

const COMPLIANCE_TOOL_NAME = "submit_compliance_review";

function strArray(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter((t): t is string => typeof t === "string")
    : [];
}

/**
 * Separate model invocation for compliance review. Kept apart from
 * generateDraft so generation stays a single call and the review only runs
 * on explicit request. Forces structured output via tool use.
 */
export async function reviewCompliance(
  systemPrompt: string,
  userMessage: string
): Promise<ComplianceAiResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new GenerationError("لم يتم إعداد مفتاح Anthropic API على الخادم");
  }

  const anthropic = new Anthropic({ apiKey });

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      tools: [
        {
          name: COMPLIANCE_TOOL_NAME,
          description:
            "أرسل نتيجة مراجعة الامتثال كحقول منظمة (الحالة، الدرجة، التحذيرات، الاقتراحات، الإخلاءات المطلوبة).",
          input_schema: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["pass", "review", "warning"],
                description:
                  "pass = متوافق، review = يحتاج مراجعة بشرية، warning = مخالفة واضحة.",
              },
              score: {
                type: "number",
                description: "درجة الامتثال من 0 إلى 100.",
              },
              warnings: {
                type: "array",
                items: { type: "string" },
                description: "مخاطر امتثال محددة في النص (بالعربية).",
              },
              suggestions: {
                type: "array",
                items: { type: "string" },
                description: "تعديلات مقترحة لرفع الامتثال (بالعربية).",
              },
              requiredDisclaimers: {
                type: "array",
                items: { type: "string" },
                description: "إخلاءات مسؤولية يجب إضافتها إن لزم (بالعربية).",
              },
            },
            required: [
              "status",
              "score",
              "warnings",
              "suggestions",
              "requiredDisclaimers",
            ],
          },
        },
      ],
      tool_choice: { type: "tool", name: COMPLIANCE_TOOL_NAME },
    });
  } catch (err) {
    console.error("[anthropic] compliance API error:", err);
    throw new GenerationError("تعذّر الاتصال بخدمة الذكاء الاصطناعي");
  }

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === COMPLIANCE_TOOL_NAME
  );
  const input = toolBlock?.input as
    | {
        status?: unknown;
        score?: unknown;
        warnings?: unknown;
        suggestions?: unknown;
        requiredDisclaimers?: unknown;
      }
    | undefined;

  if (!input) {
    throw new GenerationError("تعذّر إجراء مراجعة الامتثال");
  }

  const status =
    input.status === "pass" || input.status === "warning" ? input.status : "review";
  const rawScore = typeof input.score === "number" ? input.score : 0;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    status,
    score,
    warnings: strArray(input.warnings),
    suggestions: strArray(input.suggestions),
    requiredDisclaimers: strArray(input.requiredDisclaimers),
  };
}
