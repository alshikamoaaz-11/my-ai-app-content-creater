-- Phase 1 of AI style cloning: a corpus of real anb tweets used to learn the
-- account's voice. Populated by scripts/import-tweets.ts (raw export) and
-- enriched by scripts/analyze-tweets.ts (derived analysis columns).
--
-- pgvector is enabled here for the future style-retrieval phase. The `embedding`
-- column is left unpopulated in Phase 1 (embedding generation is deferred).

create extension if not exists vector;

create table if not exists public.tweets (
  -- Natural key: the original Tweet ID from the export (snowflake, kept as text
  -- to avoid JS/JSON 64-bit precision loss). Enables idempotent re-imports.
  id text primary key,

  -- Raw export fields
  text text not null,
  created_at timestamptz,
  likes integer not null default 0,
  retweets integer not null default 0,
  replies integer not null default 0,
  impressions integer not null default 0,
  source text,

  -- Derived analysis fields (written by analyze-tweets.ts)
  category text,
  hashtags text[] not null default '{}',
  emoji_count integer not null default 0,
  engagement_score numeric not null default 0,
  has_cta boolean not null default false,

  -- Style-retrieval vector. Dimension 1024 = Voyage AI (voyage-3.5) embeddings,
  -- used with Anthropic instead of OpenAI. Populated in Phase 2 (embed-tweets.ts).
  embedding vector(1024),

  imported_at timestamptz not null default now(),
  analyzed_at timestamptz
);

create index if not exists tweets_category_idx on public.tweets(category);
create index if not exists tweets_created_at_idx on public.tweets(created_at desc);
create index if not exists tweets_engagement_score_idx on public.tweets(engagement_score desc);

-- RLS: mirror the existing app convention (app auth is app-level, not Supabase
-- Auth; the anon key is used server-side), so enable RLS with an allow-all
-- policy rather than leaving the table unreachable.
alter table public.tweets enable row level security;

drop policy if exists "allow all tweets" on public.tweets;
create policy "allow all tweets" on public.tweets for all using (true) with check (true);
