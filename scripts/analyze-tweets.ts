/**
 * analyze-tweets.ts — Phase 1 analysis pass.
 *
 * For each tweet it extracts hashtags, counts emojis, computes a weighted
 * engagement score, detects call-to-action presence, and classifies the
 * content category, then writes those columns back to public.tweets.
 *
 * Usage:
 *   npm run analyze-tweets                  # read from DB, write results back
 *   npm run analyze-tweets -- --dry-run     # read from DB, print, no writes
 *   npm run analyze-tweets -- --xlsx path   # offline: analyze a file, no DB
 */
import { readTweetsFromXlsx, type RawTweet } from "./xlsx";
import { analyzeTweet, CATEGORY_VALUES, UNCATEGORIZED } from "./analysis";
import { getSupabase, TWEETS_TABLE, chunk } from "./supabaseClient";

const PAGE_SIZE = 1000;
const BATCH_SIZE = 500;

type Metrics = Pick<RawTweet, "id" | "text" | "likes" | "retweets" | "replies" | "impressions">;

/** Read all tweets from the DB, paginating past the PostgREST row cap. */
async function fetchAllFromDb(): Promise<Metrics[]> {
  const supabase = getSupabase();
  const all: Metrics[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(TWEETS_TABLE)
      .select("id, text, likes, retweets, replies, impressions")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Fetch failed: ${error.message}`);
    if (!data?.length) break;
    all.push(...(data as Metrics[]));
    if (data.length < PAGE_SIZE) break;
  }
  return all;
}

function printDistribution(rows: Array<{ category: string; has_cta: boolean; emoji_count: number }>) {
  const dist = new Map<string, number>();
  for (const v of [...CATEGORY_VALUES, UNCATEGORIZED]) dist.set(v, 0);
  let cta = 0;
  let emojis = 0;
  for (const r of rows) {
    dist.set(r.category, (dist.get(r.category) ?? 0) + 1);
    if (r.has_cta) cta++;
    emojis += r.emoji_count;
  }
  console.log("\nCategory distribution:");
  for (const [k, v] of dist) console.log(`  ${k.padEnd(22)} ${v}`);
  console.log(
    `\nWith CTA: ${cta}/${rows.length} | avg emojis/tweet: ` +
      `${(emojis / Math.max(rows.length, 1)).toFixed(2)}`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const xlsxIdx = args.indexOf("--xlsx");
  const xlsxPath = xlsxIdx >= 0 ? args[xlsxIdx + 1] : null;

  let source: Metrics[];
  if (xlsxPath) {
    console.log(`Analyzing from file ${xlsxPath} (offline, no DB) …`);
    source = await readTweetsFromXlsx(xlsxPath);
  } else {
    console.log("Fetching tweets from Supabase …");
    source = await fetchAllFromDb();
  }
  console.log(`Analyzing ${source.length} tweets …`);

  const analyzed_at = new Date().toISOString();
  const results = source.map((t) => {
    const a = analyzeTweet(t.text, {
      likes: t.likes,
      retweets: t.retweets,
      replies: t.replies,
      impressions: t.impressions,
    });
    // `text` is carried in the payload so the upsert's INSERT tuple satisfies
    // the NOT NULL constraint (checked before ON CONFLICT arbitration); on
    // conflict it only updates the analysis columns.
    return { id: t.id, text: t.text, ...a, analyzed_at };
  });

  printDistribution(results);
  const { text: _t, ...sample } = results[0];
  console.log("\nSample analysis:", JSON.stringify(sample, null, 2));

  if (dryRun || xlsxPath) {
    console.log("\nNo database writes performed (dry-run / offline mode).");
    return;
  }

  const supabase = getSupabase();
  const batches = chunk(results, BATCH_SIZE);
  let written = 0;
  for (const [i, batch] of batches.entries()) {
    const { error } = await supabase
      .from(TWEETS_TABLE)
      .upsert(batch, { onConflict: "id" });
    if (error) {
      throw new Error(`Batch ${i + 1}/${batches.length} failed: ${error.message}`);
    }
    written += batch.length;
    console.log(`  updated ${written}/${results.length}`);
  }

  console.log(`\nDone. Wrote analysis for ${written} tweets.`);
}

main().catch((err) => {
  console.error("analyze-tweets failed:", err.message ?? err);
  process.exit(1);
});
