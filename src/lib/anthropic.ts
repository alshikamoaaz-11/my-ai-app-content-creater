import Anthropic from "@anthropic-ai/sdk";

export class GenerationError extends Error {}

export async function generateDraft(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new GenerationError("لم يتم إعداد مفتاح Anthropic API على الخادم");
  }

  const anthropic = new Anthropic({ apiKey });

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    console.error("[anthropic] API error:", err);
    throw new GenerationError("تعذّر الاتصال بخدمة الذكاء الاصطناعي");
  }

  const textBlock = response.content.find((block) => block.type === "text");
  const draft = textBlock && "text" in textBlock ? textBlock.text.trim() : "";

  if (!draft) {
    throw new GenerationError("لم يتمكن Claude من إنشاء مسودة");
  }

  return draft;
}
