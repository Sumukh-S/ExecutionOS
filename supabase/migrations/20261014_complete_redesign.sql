-- ============================================================================
-- EXECUTION OS — COMPLETE PRODUCT & ARCHITECTURE REDESIGN SCHEMA
-- Migration: 20261014_complete_redesign.sql
-- ============================================================================
-- Supabase PostgreSQL single source of truth with strict Row Level Security (RLS)
-- ============================================================================
-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
-- 2. DROP OBSOLETE CONSTRAINT TRIGGERS (e.g. max 2 active main tasks trigger)
drop trigger if exists trg_check_max_active_main_tasks on public.tasks;
drop function if exists public.check_max_active_main_tasks();
-- 3. PROFILES & USER PREFERENCES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text default '',
  avatar_url text default '',
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
create or replace function public.handle_new_user() returns trigger as $$ begin
insert into public.profiles (id, email, full_name, avatar_url)
values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  ) on conflict (id) do nothing;
return new;
end;
$$ language plpgsql security definer;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after
insert on auth.users for each row execute function public.handle_new_user();
create table if not exists public.user_preferences (
  user_id uuid references auth.users(id) on delete cascade primary key,
  timezone text default 'UTC' not null,
  current_work_grade integer default 1 not null check (
    current_work_grade between 0 and 4
  ),
  break_duration_minutes integer default 5 not null,
  alarm_sound_enabled boolean default true not null,
  daily_main_limit integer default 2 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
-- 4. GOALS
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  desired_outcome text default '' not null,
  measurement_method text default 'numeric' not null,
  -- 'numeric' | 'boolean' | 'milestone'
  target_value text default '' not null,
  current_progress numeric default 0 not null,
  start_date date,
  deadline date,
  why_it_matters text default '' not null,
  next_steps text default '' not null,
  status text default 'active' not null check (
    status in ('active', 'completed', 'paused', 'archived')
  ),
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  deleted_at timestamptz
);
-- 5. RECURRENCE RULES
create table if not exists public.recurrence_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  frequency text not null check (
    frequency in (
      'daily',
      'weekly',
      'selected_days',
      'monthly',
      'interval_days'
    )
  ),
  weekdays integer [] default '{}',
  -- 0=Sunday, 1=Monday... 6=Saturday
  month_day integer check (
    month_day between 1 and 31
  ),
  interval_days integer default 1,
  start_date date not null,
  end_date date,
  is_active boolean default true not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
-- 6. MASTER TASKS
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  expected_outcome text default '' not null,
  first_action text default '' not null,
  priority text default 'medium' not null check (priority in ('low', 'medium', 'high', 'urgent')),
  predicted_difficulty integer default 5 not null check (
    predicted_difficulty between 1 and 10
  ),
  expected_duration integer default 30 not null,
  -- minutes
  scheduled_date date,
  scheduled_time time,
  deadline timestamptz,
  has_alarm boolean default false not null,
  alarm_time timestamptz,
  alarm_set_confirmed boolean default false not null,
  description text default '' not null,
  notes text default '' not null,
  goal_id uuid references public.goals(id) on delete
  set null,
    progress integer default 0 not null check (
      progress between 0 and 100
    ),
    -- Mental preparation (MCII/WOOP)
    wish text default '' not null,
    outcome text default '' not null,
    obstacle text default '' not null,
    plan text default '' not null,
    -- Status & Recurrence
    status text default 'todo' not null check (status in ('todo', 'in_progress', 'done')),
    recurrence_id uuid references public.recurrence_rules(id) on delete
  set null,
    created_at timestamptz default timezone('utc', now()) not null,
    updated_at timestamptz default timezone('utc', now()) not null,
    completed_at timestamptz,
    deleted_at timestamptz
);
-- 7. TASK OCCURRENCES (for recurring and daily scheduled tasks)
create table if not exists public.task_occurrences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  scheduled_date date not null,
  daily_section text default 'supporting' not null check (daily_section in ('main', 'supporting', 'easy')),
  daily_sort_order integer default 0 not null,
  status text default 'todo' not null check (status in ('todo', 'in_progress', 'done')),
  progress integer default 0 not null check (
    progress between 0 and 100
  ),
  actual_difficulty integer check (
    actual_difficulty is null
    or (
      actual_difficulty between 1 and 10
    )
  ),
  actual_minutes integer,
  completed_at timestamptz,
  completion_notes text,
  next_action_scheduled_for date,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  constraint uq_user_task_date unique (user_id, task_id, scheduled_date)
);
-- 8. FIVE-MINUTE TASKS (Date-Specific Lightweight Checklist)
create table if not exists public.five_minute_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  date date not null,
  target_time time,
  completed boolean default false not null,
  sort_order integer default 0 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
-- 9. CALENDAR EVENTS & REMINDERS
create table if not exists public.calendar_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  date date not null,
  start_time time not null,
  end_time time,
  location text default '' not null,
  description text default '' not null,
  reminder_minutes_before integer default 15 not null,
  has_alarm boolean default false not null,
  alarm_set_confirmed boolean default false not null,
  recurrence text default 'none' not null check (
    recurrence in ('none', 'daily', 'weekly', 'monthly')
  ),
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
-- 10. FOCUS SESSIONS & BREAKS
create table if not exists public.focus_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete
  set null,
    occurrence_id uuid references public.task_occurrences(id) on delete
  set null,
    task_title text default '' not null,
    work_grade integer default 1 not null check (
      work_grade between 0 and 4
    ),
    intended_duration integer default 25 not null,
    -- minutes
    actual_duration integer default 0 not null,
    -- minutes
    started_at timestamptz not null,
    ended_at timestamptz not null,
    status text default 'completed' not null check (
      status in ('completed', 'interrupted', 'extended')
    ),
    actual_difficulty integer check (
      actual_difficulty is null
      or (
        actual_difficulty between 1 and 10
      )
    ),
    interruption_reason text default '',
    reflection text default '',
    created_at timestamptz default timezone('utc', now()) not null
);
create table if not exists public.break_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  focus_session_id uuid references public.focus_sessions(id) on delete
  set null,
    duration_minutes integer default 5 not null,
    started_at timestamptz not null,
    ended_at timestamptz not null,
    created_at timestamptz default timezone('utc', now()) not null
);
-- 11. WHAT WORKS / WHAT DOESN'T WORK
create table if not exists public.personal_observations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('what_works', 'what_doesnt_work')),
  title text not null,
  points text [] default '{}' not null,
  category text default 'general' not null,
  status text default 'active' not null check (status in ('active', 'testing', 'retired')),
  date date default current_date not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
-- 12. FOUR-CATEGORY POINTWISE JOURNAL
create table if not exists public.journal_subcategories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null check (
    category in ('learnings', 'behaviour', 'problems', 'purpose')
  ),
  name text not null,
  created_at timestamptz default timezone('utc', now()) not null,
  constraint uq_user_cat_name unique (user_id, category, name)
);
create table if not exists public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null check (
    category in ('learnings', 'behaviour', 'problems', 'purpose')
  ),
  subcategory_id uuid references public.journal_subcategories(id) on delete
  set null,
    title text not null,
    points text [] default '{}' not null,
    is_pinned boolean default false not null,
    -- Category-specific optional metadata
    quote_source text,
    -- For learnings
    context text,
    -- For behaviour
    problem_triggers text,
    -- For specific problems
    problem_what_helped text,
    -- For specific problems
    problem_current_approach text,
    -- For specific problems
    visualization_future text,
    -- For purpose visualization
    visualization_next_step text,
    -- For purpose visualization
    entry_date date default current_date not null,
    created_at timestamptz default timezone('utc', now()) not null,
    updated_at timestamptz default timezone('utc', now()) not null
);
-- 13. STANDARDS & PRACTICES
create table if not exists public.standards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  rule text not null,
  why_it_exists text default '' not null,
  practical_implementation text default '' not null,
  when_it_applies text default '' not null,
  status text default 'active' not null check (status in ('active', 'paused')),
  sort_order integer default 0 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
-- 14. INSIGHT FEEDBACK & CALIBRATION
create table if not exists public.user_insight_feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  insight_key text not null,
  rating text not null check (
    rating in ('useful', 'incorrect', 'needs_more_observation')
  ),
  created_at timestamptz default timezone('utc', now()) not null
);
-- ============================================================================
-- 15. PERFORMANCE INDEXES
-- ============================================================================
create index if not exists idx_tasks_user_status on public.tasks (user_id, status, scheduled_date);
create index if not exists idx_occurrences_user_date on public.task_occurrences (user_id, scheduled_date);
create index if not exists idx_five_min_user_date on public.five_minute_tasks (user_id, date);
create index if not exists idx_events_user_date on public.calendar_events (user_id, date);
create index if not exists idx_focus_user_started on public.focus_sessions (user_id, started_at);
create index if not exists idx_journal_user_cat on public.journal_entries (user_id, category, entry_date);
create index if not exists idx_goals_user_status on public.goals (user_id, status);
create index if not exists idx_standards_user on public.standards (user_id, status);
-- ============================================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.goals enable row level security;
alter table public.recurrence_rules enable row level security;
alter table public.tasks enable row level security;
alter table public.task_occurrences enable row level security;
alter table public.five_minute_tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.break_sessions enable row level security;
alter table public.personal_observations enable row level security;
alter table public.journal_subcategories enable row level security;
alter table public.journal_entries enable row level security;
alter table public.standards enable row level security;
alter table public.user_insight_feedback enable row level security;
-- Profiles
drop policy if exists "Users own profile select" on public.profiles;
create policy "Users own profile select" on public.profiles for
select using (auth.uid() = id);
drop policy if exists "Users own profile update" on public.profiles;
create policy "Users own profile update" on public.profiles for
update using (auth.uid() = id) with check (auth.uid() = id);
-- User Preferences
drop policy if exists "Users own prefs all" on public.user_preferences;
create policy "Users own prefs all" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Goals
drop policy if exists "Users own goals all" on public.goals;
create policy "Users own goals all" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Recurrence Rules
drop policy if exists "Users own recurrence all" on public.recurrence_rules;
create policy "Users own recurrence all" on public.recurrence_rules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Tasks
drop policy if exists "Users own tasks all" on public.tasks;
create policy "Users own tasks all" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Task Occurrences
drop policy if exists "Users own occurrences all" on public.task_occurrences;
create policy "Users own occurrences all" on public.task_occurrences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Five-Minute Tasks
drop policy if exists "Users own five_min all" on public.five_minute_tasks;
create policy "Users own five_min all" on public.five_minute_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Calendar Events
drop policy if exists "Users own events all" on public.calendar_events;
create policy "Users own events all" on public.calendar_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Focus Sessions
drop policy if exists "Users own focus all" on public.focus_sessions;
create policy "Users own focus all" on public.focus_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Break Sessions
drop policy if exists "Users own breaks all" on public.break_sessions;
create policy "Users own breaks all" on public.break_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Personal Observations
drop policy if exists "Users own observations all" on public.personal_observations;
create policy "Users own observations all" on public.personal_observations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Journal Subcategories
drop policy if exists "Users own subcategories all" on public.journal_subcategories;
create policy "Users own subcategories all" on public.journal_subcategories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Journal Entries
drop policy if exists "Users own journal all" on public.journal_entries;
create policy "Users own journal all" on public.journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Standards
drop policy if exists "Users own standards all" on public.standards;
create policy "Users own standards all" on public.standards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- User Insight Feedback
drop policy if exists "Users own insights all" on public.user_insight_feedback;
create policy "Users own insights all" on public.user_insight_feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);