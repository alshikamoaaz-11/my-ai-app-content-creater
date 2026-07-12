/**
 * import-tweets.ts — Phase 1 raw import.
 *
 * Reads the exported tweet workbook and upserts rows into public.tweets,
 * keyed on the original Tweet ID so re-runs are idempotent. Does NOT compute
 * analysis columns (see analyze-tweets.ts) or embeddings.
 *
 * Usage:
 *   npm run import-tweets                 # imports ./data/tweets.xlsx
 *   npm run import-tweets -- path.xlsx    # custom file
 *   npm run import-tweets -- --dry-run    # parse + report, no DB writes
 */
import { readTweetsFromXlsx } from "./xlsx";
import { getSupabase, TWEETS_TABLE, chunk } from "./supabaseClient";

const DEFAULT_PATH = "./data/tweets.xlsx";
const BATCH_SIZE = 500;

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const path = args.find((a) => !a.startsWith("--")) ?? DEFAULT_PATH;

  console.log(`Reading tweets from ${path} …`);
  const tweets = await readTweetsFromXlsx(path);
  console.log(`Parsed ${tweets.length} unique tweets.`);

  const withLikes = tweets.filter((t) => t.likes > 0).length;
  const withDate = tweets.filter((t) => t.created_at).length;
  console.log(
    `  with likes: ${withLikes} | with date: ${withDate} | ` +
      `retweets/replies/impressions absent in export (default 0)`
  );
  console.log("Sample row:", JSON.stringify(tweets[0], null, 2));

  if (dryRun) {
    console.log("\n--dry-run: no database writes performed.");
    return;
  }

  const supabase = getSupabase();
  const batches = chunk(tweets, BATCH_SIZE);
  let written = 0;

  for (const [i, batch] of batches.entries()) {
    const { error } = await supabase
      .from(TWEETS_TABLE)
      .upsert(batch, { onConflict: "id" });
    if (error) {
      throw new Error(`Batch ${i + 1}/${batches.length} failed: ${error.message}`);
    }
    written += batch.length;
    console.log(`  upserted ${written}/${tweets.length}`);
  }

  console.log(`\nDone. Upserted ${written} tweets into public.${TWEETS_TABLE}.`);
}

main().catch((err) => {
  console.error("import-tweets failed:", err.message ?? err);
  process.exit(1);
});
