-- ─── Chronos — Supabase Schema ────────────────────────────────────────────────
-- Run this in your Supabase project's SQL Editor (supabase.com/dashboard)
-- After running, your Chronos app will sync data across devices.

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists public.events (
  id           text        primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  data         jsonb       not null default '{}',
  updated_at   timestamptz default now()
);

create table if not exists public.tasks (
  id           text        primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  data         jsonb       not null default '{}',
  updated_at   timestamptz default now()
);

create table if not exists public.goals (
  id           text        primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  data         jsonb       not null default '{}',
  updated_at   timestamptz default now()
);

create table if not exists public.task_lists (
  id           text        primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  data         jsonb       not null default '{}',
  updated_at   timestamptz default now()
);

-- Stores meals and workouts as single JSON blobs per user
create table if not exists public.user_data (
  id           text        not null,   -- e.g. "meals" or "workouts"
  user_id      uuid        references auth.users(id) on delete cascade not null,
  data         jsonb       not null default '{}',
  updated_at   timestamptz default now(),
  primary key (id, user_id)
);

-- Push notification subscriptions (for server-sent push)
create table if not exists public.push_subs (
  user_id      uuid        references auth.users(id) on delete cascade not null,
  endpoint     text        not null,
  data         jsonb       not null default '{}',
  updated_at   timestamptz default now(),
  primary key (user_id, endpoint)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists events_user_idx      on public.events(user_id);
create index if not exists events_updated_idx   on public.events(updated_at desc);
create index if not exists tasks_user_idx       on public.tasks(user_id);
create index if not exists goals_user_idx       on public.goals(user_id);
create index if not exists task_lists_user_idx  on public.task_lists(user_id);

-- ── Updated_at triggers ───────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_events_updated    on public.events;
drop trigger if exists set_tasks_updated     on public.tasks;
drop trigger if exists set_goals_updated     on public.goals;
drop trigger if exists set_lists_updated     on public.task_lists;
drop trigger if exists set_userdata_updated  on public.user_data;

create trigger set_events_updated    before update on public.events    for each row execute function handle_updated_at();
create trigger set_tasks_updated     before update on public.tasks     for each row execute function handle_updated_at();
create trigger set_goals_updated     before update on public.goals     for each row execute function handle_updated_at();
create trigger set_lists_updated     before update on public.task_lists for each row execute function handle_updated_at();
create trigger set_userdata_updated  before update on public.user_data  for each row execute function handle_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Users can ONLY access their own rows.

alter table public.events     enable row level security;
alter table public.tasks      enable row level security;
alter table public.goals      enable row level security;
alter table public.task_lists enable row level security;
alter table public.user_data  enable row level security;
alter table public.push_subs  enable row level security;

-- events
create policy "Users own their events"
  on public.events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- tasks
create policy "Users own their tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- goals
create policy "Users own their goals"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- task_lists
create policy "Users own their task lists"
  on public.task_lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_data (meals, workouts)
create policy "Users own their user data"
  on public.user_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- push_subs
create policy "Users own their push subscriptions"
  on public.push_subs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Done ──────────────────────────────────────────────────────────────────────
-- Your database is ready. Now:
-- 1. Go to Project Settings > API to get your URL and anon key
-- 2. Add them to your .env file (see .env.example)
-- 3. Enable Email auth in Authentication > Providers
