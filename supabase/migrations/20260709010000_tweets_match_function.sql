-- Phase 2: style retrieval over the tweet corpus.
--
-- match_tweets() returns the most stylistically similar tweets to a query
-- embedding (cosine distance), optionally scoped to one category. Used by the
-- generation phase to ground drafts in real high-similarity examples.

-- HNSW index for fast approximate nearest-neighbour on cosine distance.
-- Safe to create while empty; it fills as embeddings are written.
create index if not exists tweets_embedding_hnsw_idx
  on public.tweets
  using hnsw (embedding vector_cosine_ops);

create or replace function public.match_tweets(
  query_embedding vector(1024),
  match_count int default 5,
  filter_category text default null
)
returns table (
  id text,
  text text,
  category text,
  engagement_score numeric,
  similarity float
)
language sql
stable
as $$
  select
    t.id,
    t.text,
    t.category,
    t.engagement_score,
    1 - (t.embedding <=> query_embedding) as similarity
  from public.tweets t
  where t.embedding is not null
    and (filter_category is null or t.category = filter_category)
  order by t.embedding <=> query_embedding
  limit match_count;
$$;
