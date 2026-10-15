-- Run this in the Supabase SQL Editor before using the Event tab.
-- It is safe to run again: re-run it whenever this file changes.
-- It keeps publishing and commenting permissions in the database, so they
-- cannot be bypassed by changing browser code.

-- ---------------------------------------------------------------
-- Event publishers
-- ---------------------------------------------------------------

create table if not exists public.event_authorizations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now()
);

alter table public.event_authorizations enable row level security;

create or replace function public.is_event_publisher(target_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = target_id and role in ('admin', 'mod')
  ) or exists (
    select 1 from public.event_authorizations where user_id = target_id
  );
$$;

create or replace function public.is_event_manager(target_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = target_id and role in ('admin', 'mod')
  );
$$;

-- True when the member is allowed to post: not banned and not currently muted.
-- Used by the comment insert policy so the check cannot be skipped from the browser.
create or replace function public.can_post(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid
      and coalesce(banned, false) = false
      and (muted_until is null or muted_until <= now())
  );
$$;

revoke all on function public.can_post(uuid) from public;
grant execute on function public.can_post(uuid) to authenticated;

drop policy if exists "People can see their own event publishing access" on public.event_authorizations;
create policy "People can see their own event publishing access"
on public.event_authorizations for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins and moderators manage event publishing access" on public.event_authorizations;
create policy "Admins and moderators manage event publishing access"
on public.event_authorizations for all to authenticated
using (public.is_event_manager(auth.uid()))
with check (public.is_event_manager(auth.uid()));

create or replace function public.enforce_event_publisher()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_event_publisher(auth.uid()) then
    raise exception 'Only admins, moderators, and approved event publishers can create or edit events';
  end if;
  return new;
end;
$$;

drop trigger if exists events_require_publisher on public.events;
create trigger events_require_publisher
before insert or update on public.events
for each row execute function public.enforce_event_publisher();

-- ---------------------------------------------------------------
-- Event comments
-- ---------------------------------------------------------------

create table if not exists public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists event_comments_event_created_at_idx
on public.event_comments (event_id, created_at);

alter table public.event_comments enable row level security;

-- Everyone signed in can read comments.
drop policy if exists "Signed-in members can read event comments" on public.event_comments;
create policy "Signed-in members can read event comments"
on public.event_comments for select to authenticated
using (true);

-- Members can write comments as themselves, unless muted or banned.
drop policy if exists "Signed-in members can write their own event comments" on public.event_comments;
create policy "Signed-in members can write their own event comments"
on public.event_comments for insert to authenticated
with check (user_id = auth.uid() and public.can_post(auth.uid()));

-- Authors can delete their own comments; admins and moderators can delete any.
drop policy if exists "People can delete their own event comments" on public.event_comments;
drop policy if exists "Authors and moderators can delete event comments" on public.event_comments;
create policy "Authors and moderators can delete event comments"
on public.event_comments for delete to authenticated
using (user_id = auth.uid() or public.is_event_manager(auth.uid()));
