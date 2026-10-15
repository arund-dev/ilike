-- Run this once in the Supabase SQL Editor before using the Event tab.
-- It keeps publishing permissions in the database, so they cannot be bypassed
-- by changing browser code.

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
create policy "People can see their own event publishing access"
on public.event_authorizations for select to authenticated
using (user_id = auth.uid());

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

create policy "Signed-in members can read event comments"
on public.event_comments for select to authenticated using (true);

create policy "Signed-in members can write their own event comments"
on public.event_comments for insert to authenticated
with check (user_id = auth.uid());

create policy "People can delete their own event comments"
on public.event_comments for delete to authenticated
using (user_id = auth.uid());
