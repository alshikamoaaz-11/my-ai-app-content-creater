/**
 * embed-tweets.ts — Phase 2 embedding backfill.
 *
 * Embeds every tweet that has no vector yet (Voyage voyage-3.5, 1024-dim) and
 * writes it to public.tweets.embedding. Idempotent: re-runs only fill the gaps.
 *
 * Requires: applied migrations + NEXT_PUBLIC_SUPABASE_URL / anon key + VOYAGE_API_KEY.
 *
 * Usage:
 *   npm run embed-tweets                 # embed all rows missing embedding
 *   npm run embed-tweets -- --limit 200  # cap how many rows this run touches
 */
import { embedBatch, toPgVector, VOYAGE_MAX_BATCH } from "./voyage";
import { getSupabase, TWEETS_TABLE, chunk } from "./supabaseClient";

const PAGE_SIZE = 1000;

type Row = { id: string; text: string };

async function fetchUnembedded(limit: number | null): Promise<Row[]> {
  const supabase = getSupabase();
  const all: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const size = limit ? Math.min(PAGE_SIZE, limit - all.length) : PAGE_SIZE;
    if (size <= 0) break;
    const { data, error } = await supabase
      .from(TWEETS_TABLE)
      .select("id, text")
      .is("embedding", null)
      .order("id", { ascending: true })
      .range(from, from + size - 1);
    if (error) throw new Error(`Fetch failed: ${error.message}`);
    if (!data?.length) break;
    all.push(...(data as Row[]));
    if (data.length < size) break;
    if (limit && all.length >= limit) break;
  }
  return all;
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : null;

  console.log("Fetching tweets without embeddings …");
  const rows = await fetchUnembedded(limit);
  console.log(`${rows.length} tweets to embed.`);
  if (rows.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const supabase = getSupabase();
  const batches = chunk(rows, VOYAGE_MAX_BATCH);
  let done = 0;

  for (const [i, batch] of batches.entries()) {
    const vectors = await embedBatch(batch.map((r) => r.text), "document");
    const payload = batch.map((r, j) => ({ id: r.id, embedding: toPgVector(vectors[j]) }));

    const { error } = await supabase.from(TWEETS_TABLE).upsert(payload, { onConflict: "id" });
    if (error) throw new Error(`Write batch ${i + 1}/${batches.length} failed: ${error.message}`);

    done += batch.length;
    console.log(`  embedded ${done}/${rows.length}`);
  }

  console.log(`\nDone. Embedded ${done} tweets.`);
}

main().catch((err) => {
  console.error("embed-tweets failed:", err.message ?? err);
  process.exit(1);
});
