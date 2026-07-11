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
