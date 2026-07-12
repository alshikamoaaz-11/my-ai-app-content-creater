/**
 * Voyage AI embeddings client (used with Anthropic instead of OpenAI).
 *
 * Model voyage-3.5 returns 1024-dim vectors, matching public.tweets.embedding.
 * Docs: https://docs.voyageai.com/reference/embeddings-api
 */
export const VOYAGE_MODEL = "voyage-3.5";
export const VOYAGE_DIM = 1024;

/** Max inputs per request (Voyage caps a batch at 128 texts). */
export const VOYAGE_MAX_BATCH = 128;

type VoyageResponse = {
  data: Array<{ embedding: number[]; index: number }>;
  usage?: { total_tokens: number };
};

export type InputType = "document" | "query";

/**
 * Embed a batch of texts. `input_type` should be "document" when embedding the
 * corpus and "query" when embedding a user prompt to search against it.
 */
export async function embedBatch(
  texts: string[],
  inputType: InputType
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY not set in .env.local");
  if (texts.length > VOYAGE_MAX_BATCH) {
    throw new Error(`Batch too large: ${texts.length} > ${VOYAGE_MAX_BATCH}`);
  }

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: VOYAGE_MODEL,
      input_type: inputType,
      output_dimension: VOYAGE_DIM,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage API ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as VoyageResponse;
  // Sort by index so vectors line up with the input order.
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/** pgvector accepts a bracketed string literal: "[0.1,0.2,...]". */
export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
