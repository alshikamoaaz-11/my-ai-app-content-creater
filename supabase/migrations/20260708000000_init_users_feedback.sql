create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  message text not null,
  rating int check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.feedback enable row level security;
