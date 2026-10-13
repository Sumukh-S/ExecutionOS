-- ============================================================================
-- EXECUTION OS — CLOUD DATABASE SCHEMA FOR SUPABASE POSTGRESQL
-- ============================================================================
-- Enables reliable offline-first cross-device synchronization with Row Level Security,
-- optimistic concurrency control (versions), soft-deletions (tombstones), and
-- strict concurrency-safe limits (max 2 active main tasks per user).
-- ============================================================================

-- 1. EXTENSIONS & TYPES
create extension if not exists "uuid-ossp";

do $$ begin
  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type task_priority as enum ('low', 'medium', 'high', 'urgent');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('todo', 'in_progress', 'done');
  end if;
  if not exists (select 1 from pg_type where typname = 'goal_type') then
    create type goal_type as enum ('weekly', 'monthly', 'longterm');
  end if;
  if not exists (select 1 from pg_type where typname = 'outcome_status') then
    create type outcome_status as enum ('yes', 'partially', 'no');
  end if;
end $$;

-- 2. USER PROFILES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  version bigint default 1 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  deleted_at timestamptz
);

-- Auto-provision profile row on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. GOALS
create table if not exists public.goals (
  id text primary key, -- Text to seamlessly support client-generated UUIDs and migrated keys
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  type goal_type default 'weekly' not null,
  target text not null,
  progress numeric default 0 not null,
  progress_mode text default 'numeric' not null,
  progress_entries jsonb default '[]'::jsonb not null,
  version bigint default 1 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  deleted_at timestamptz
);

-- 4. TASKS
create table if not exists public.tasks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- Hierarchy & Pinned State
  is_main boolean default false not null,
  parent_id text references public.tasks(id) on delete cascade,

  -- Section A: Definition
  title text not null,
  icon text default '✅' not null,
  list_name text default 'Personal' not null,
  description text default '' not null,
  scope text default '' not null,
  first_action text default '' not null,
  outcome text default '' not null,
  priority task_priority default 'medium' not null,
  predicted_difficulty integer default 7 check (predicted_difficulty between 1 and 10) not null,
  
  -- Lifecycle Status
  status task_status default 'todo' not null,

  -- Section B: Scheduling
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  planned_end timestamptz,
  expected_duration integer default 30 not null,
  deadline timestamptz,
  location text default '' not null,
  alarm boolean default false not null,

  -- Section C: Additional Collapsible Details
  wish text default '' not null,
  obstacle text default '' not null,
  notes text default '' not null,
  resources text default '' not null,

  -- Goal References
  weekly_goal text default '' not null,
  monthly_goal text default '' not null,

  -- Live Execution Timers
  execution_started_at timestamptz,
  execution_paused_at timestamptz,
  execution_elapsed_ms bigint default 0 not null,

  -- Mandatory Completion Review
  actual_difficulty integer check (actual_difficulty is null or (actual_difficulty between 1 and 10)),
  actual_minutes integer,
  outcome_achieved outcome_status,
  reflection text,
  completed_at timestamptz,

  -- Sync Metadata
  version bigint default 1 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  deleted_at timestamptz
);

-- Concurrency-safe limit enforcement: Max 2 active main tasks per user
create or replace function public.check_max_active_main_tasks()
returns trigger as $$
declare
  active_count integer;
begin
  if new.deleted_at is null and new.is_main = true and new.status != 'done' then
    -- Lock profile row for user to serialize concurrent additions
    perform 1 from public.profiles where id = new.user_id for update;
    
    select count(*) into active_count
    from public.tasks
    where user_id = new.user_id
      and is_main = true
      and status != 'done'
      and deleted_at is null
      and id != new.id;

    if active_count >= 2 then
      raise exception 'Maximum of 2 active main tasks reached for this user.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_check_max_active_main_tasks on public.tasks;
create trigger trg_check_max_active_main_tasks
before insert or update on public.tasks
for each row execute function public.check_max_active_main_tasks();

-- 5. QUICK TASKS (<5 MIN)
create table if not exists public.quick_tasks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  completed boolean default false not null,
  version bigint default 1 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  deleted_at timestamptz
);

-- 6. FOCUS SESSIONS
create table if not exists public.focus_sessions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id text references public.tasks(id) on delete set null,
  task_title text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_minutes integer not null,
  status text default 'completed' not null,
  version bigint default 1 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  deleted_at timestamptz
);

-- 7. STANDARDS & PRACTICES
create table if not exists public.standards (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  practice text not null,
  sort_order integer default 0 not null,
  version bigint default 1 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  deleted_at timestamptz
);

-- 8. INDEXES FOR PERFORMANCE & SYNC CURSORS
create index if not exists idx_tasks_user_sync on public.tasks (user_id, updated_at);
create index if not exists idx_goals_user_sync on public.goals (user_id, updated_at);
create index if not exists idx_quick_tasks_user_sync on public.quick_tasks (user_id, updated_at);
create index if not exists idx_focus_sessions_user_sync on public.focus_sessions (user_id, updated_at);
create index if not exists idx_standards_user_sync on public.standards (user_id, updated_at);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.tasks enable row level security;
alter table public.quick_tasks enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.standards enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Goals Policies
drop policy if exists "Users can access own goals" on public.goals;
create policy "Users can access own goals" on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tasks Policies
drop policy if exists "Users can access own tasks" on public.tasks;
create policy "Users can access own tasks" on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Quick Tasks Policies
drop policy if exists "Users can access own quick tasks" on public.quick_tasks;
create policy "Users can access own quick tasks" on public.quick_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Focus Sessions Policies
drop policy if exists "Users can access own focus sessions" on public.focus_sessions;
create policy "Users can access own focus sessions" on public.focus_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Standards Policies
drop policy if exists "Users can access own standards" on public.standards;
create policy "Users can access own standards" on public.standards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
