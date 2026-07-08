-- extend existing users table (had only id, email, created_at) with app-level login fields
alter table public.users add column if not exists username text;
alter table public.users add column if not exists display_name text;

-- backfill + enforce for the 3 testers below, then lock down
update public.users set username = email where username is null and email is not null;

alter table public.users alter column username set not null;
alter table public.users alter column display_name set not null;

create unique index if not exists users_username_key on public.users(username);

-- feedback table: one row per tester submission
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  username text not null,
  message text not null,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_id_idx on public.feedback(user_id);
create index if not exists feedback_created_at_idx on public.feedback(created_at desc);

-- seed the 3 testers
insert into public.users (username, display_name) values
  ('marketing1', 'Marketing User 1'),
  ('marketing2', 'Marketing User 2'),
  ('marketing3', 'Marketing User 3')
on conflict (username) do nothing;

-- RLS: enable, allow anon key full access (app auth is app-level, not Supabase Auth)
alter table public.users enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "allow all users" on public.users;
drop policy if exists "allow all feedback" on public.feedback;
create policy "allow all users" on public.users for all using (true) with check (true);
create policy "allow all feedback" on public.feedback for all using (true) with check (true);
