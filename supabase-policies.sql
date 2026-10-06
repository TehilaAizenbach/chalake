-- Run this in Supabase Dashboard -> SQL Editor
-- Creates the chalaka_tasks table and allows the public (anon) key used by this app to fully manage the board.
-- This app has no login system, so access control is "anyone with the link can use the board".

create table if not exists public.chalaka_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'ready_for_print', 'in_print', 'done')),
  category text not null default 'גרפיקה'
    check (category in ('מתנות', 'קניות לצילומים', 'קניות לחלאקה', 'אוכל', 'לחיים בטקס עצמו', 'גרפיקה')),
  assignee_name text,
  waiting_for text[] not null default '{}',
  approved_by text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- In case the table already existed without the category column
alter table public.chalaka_tasks
  add column if not exists category text not null default 'גרפיקה'
    check (category in ('מתנות', 'קניות לצילומים', 'קניות לחלאקה', 'אוכל', 'לחיים בטקס עצמו', 'גרפיקה'));

alter table public.chalaka_tasks enable row level security;

drop policy if exists "Public can read chalaka_tasks" on public.chalaka_tasks;
create policy "Public can read chalaka_tasks"
  on public.chalaka_tasks for select
  to anon
  using (true);

drop policy if exists "Public can create chalaka_tasks" on public.chalaka_tasks;
create policy "Public can create chalaka_tasks"
  on public.chalaka_tasks for insert
  to anon
  with check (true);

drop policy if exists "Public can update chalaka_tasks" on public.chalaka_tasks;
create policy "Public can update chalaka_tasks"
  on public.chalaka_tasks for update
  to anon
  using (true)
  with check (true);

drop policy if exists "Public can delete chalaka_tasks" on public.chalaka_tasks;
create policy "Public can delete chalaka_tasks"
  on public.chalaka_tasks for delete
  to anon
  using (true);

-- Family members shown in the assignee / approvals dropdowns
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.family_members enable row level security;

drop policy if exists "Public can read family_members" on public.family_members;
create policy "Public can read family_members"
  on public.family_members for select
  to anon
  using (true);

drop policy if exists "Public can create family_members" on public.family_members;
create policy "Public can create family_members"
  on public.family_members for insert
  to anon
  with check (true);

-- Make the new tables visible to the API immediately
notify pgrst, 'reload schema';
