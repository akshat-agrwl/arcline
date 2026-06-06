-- Life Graph — database schema.
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
--
-- One row per user; the entire graph lives in a single JSONB document.
-- Row Level Security is the real security boundary: with the policies below,
-- a user can only ever read or write their own row, even though everyone
-- shares this one table and the browser holds the public anon key.

create table if not exists public.graphs (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.graphs enable row level security;

-- A user may read their own row.
create policy "graphs_select_own"
  on public.graphs for select
  using (auth.uid() = user_id);

-- A user may insert a row only for themselves.
create policy "graphs_insert_own"
  on public.graphs for insert
  with check (auth.uid() = user_id);

-- A user may update only their own row.
create policy "graphs_update_own"
  on public.graphs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A user may delete only their own row.
create policy "graphs_delete_own"
  on public.graphs for delete
  using (auth.uid() = user_id);
