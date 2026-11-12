-- 011: safety – block, report, daily limits and suspension.
-- Run once in the Supabase SQL Editor (after 001–010). Safe to re-run.
--
-- Error codes the app understands:
--   EV001  your account is suspended (sending and friend requests are off)
--   EV002  blocked (one of you blocked the other)
--   EV003  daily limit reached
--
-- Admin tools (only from the SQL Editor, never from the app) are at the bottom; see docs/ADMIN.md.

-- ---------- tables (clients never read or write them directly; only the functions below do) ----------
create table if not exists public.blocks (
  blocker    uuid not null references auth.users(id) on delete cascade,
  blocked    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
create index if not exists blocks_blocked_idx on public.blocks (blocked);

create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  reporter          uuid references auth.users(id) on delete set null,
  reported          uuid references auth.users(id) on delete set null,
  reporter_username text,
  reported_username text,
  reason            text not null check (reason in ('spam','inappropriate','harassment','other')),
  details           text check (details is null or char_length(details) <= 500),
  delivery_id       uuid,
  delivery_preview  text,
  status            text not null default 'open' check (status in ('open','done')),
  created_at        timestamptz not null default now()
);
create index if not exists reports_open_idx on public.reports (status, created_at desc);

create table if not exists public.suspensions (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  mode       text not null default 'social' check (mode in ('social','full')),  -- social: no sending / friend requests; full: the app is locked too
  until      timestamptz,                                                          -- null = permanent
  reason     text,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind    text not null,           -- friend_request | delivery | report
  at      timestamptz not null default now()
);
create index if not exists activity_log_idx on public.activity_log (user_id, kind, at desc);

alter table public.blocks       enable row level security;
alter table public.reports      enable row level security;
alter table public.suspensions  enable row level security;
alter table public.activity_log enable row level security;
revoke all on public.blocks, public.reports, public.suspensions, public.activity_log from anon, authenticated;

-- ---------- helpers ----------
create or replace function public.ev_suspended(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.suspensions where user_id = p and (until is null or until > now()))
$$;

create or replace function public.ev_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a))
$$;

create or replace function public.ev_count(p uuid, k text)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.activity_log where user_id = p and kind = k and at > now() - interval '24 hours'
$$;

-- ---------- guards: every new friend request and every delivery passes through these ----------
create or replace function public.ev_guard_friendship()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.ev_suspended(new.requester) then raise exception 'account suspended' using errcode = 'EV001'; end if;
  if public.ev_blocked(new.requester, new.addressee) then raise exception 'blocked' using errcode = 'EV002'; end if;
  if public.ev_count(new.requester, 'friend_request') >= 20 then raise exception 'daily limit: 20 friend requests' using errcode = 'EV003'; end if;
  insert into public.activity_log (user_id, kind) values (new.requester, 'friend_request');
  return new;
end $$;
drop trigger if exists ev_guard_friendship on public.friendships;
create trigger ev_guard_friendship before insert on public.friendships
  for each row execute function public.ev_guard_friendship();

create or replace function public.ev_guard_delivery()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.ev_suspended(new.sender) then raise exception 'account suspended' using errcode = 'EV001'; end if;
  if public.ev_blocked(new.sender, new.recipient) then raise exception 'blocked' using errcode = 'EV002'; end if;
  if public.ev_count(new.sender, 'delivery') >= 30 then raise exception 'daily limit: 30 deliveries' using errcode = 'EV003'; end if;
  insert into public.activity_log (user_id, kind) values (new.sender, 'delivery');
  return new;
end $$;
drop trigger if exists ev_guard_delivery on public.shared_songs;
create trigger ev_guard_delivery before insert on public.shared_songs
  for each row execute function public.ev_guard_delivery();

-- accepting a request is also refused while suspended
create or replace function public.ev_guard_accept()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' and public.ev_suspended(auth.uid()) then
    raise exception 'account suspended' using errcode = 'EV001';
  end if;
  return new;
end $$;
drop trigger if exists ev_guard_accept on public.friendships;
create trigger ev_guard_accept before update on public.friendships
  for each row execute function public.ev_guard_accept();

-- ---------- block ----------
create or replace function public.block_user(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if p_user is null or p_user = me then raise exception 'invalid user' using errcode = '22023'; end if;
  insert into public.blocks (blocker, blocked) values (me, p_user) on conflict do nothing;
  delete from public.friendships
   where least(requester, addressee) = least(me, p_user) and greatest(requester, addressee) = greatest(me, p_user);
  delete from public.shared_songs
   where (sender = me and recipient = p_user) or (sender = p_user and recipient = me);
end $$;

create or replace function public.unblock_user(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  delete from public.blocks where blocker = auth.uid() and blocked = p_user;
end $$;

create or replace function public.list_blocked()
returns table (id uuid, username text, display_name text, avatar_url text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.blocked, p.username, p.display_name, p.avatar_url, b.created_at
  from public.blocks b left join public.profiles p on p.id = b.blocked
  where b.blocker = auth.uid()
  order by b.created_at desc
$$;

-- people who blocked you (or whom you blocked) are not found by username
drop function if exists public.find_user(text);
create function public.find_user(p_username text)
returns table (id uuid, username text, display_name text, avatar_url text, bio text)
language sql security definer set search_path = public stable as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.bio
  from public.profiles p
  where auth.uid() is not null
    and p.username is not null
    and p.username = lower(btrim(p_username))
    and p.id <> auth.uid()
    and not public.ev_blocked(p.id, auth.uid())
  limit 1
$$;

-- ---------- report ----------
create or replace function public.report_user(p_user uuid, p_reason text, p_details text default null, p_delivery uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); prev text;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if p_user is null or p_user = me then raise exception 'invalid user' using errcode = '22023'; end if;
  if p_reason not in ('spam','inappropriate','harassment','other') then raise exception 'invalid reason' using errcode = '22023'; end if;
  if public.ev_count(me, 'report') >= 10 then raise exception 'daily limit: 10 reports' using errcode = 'EV003'; end if;
  if p_delivery is not null then
    select left(coalesce(title,'') || ' / ' || coalesce(payload::text,''), 2000) into prev
      from public.shared_songs where id = p_delivery and recipient = me;
  end if;
  insert into public.reports (reporter, reported, reporter_username, reported_username, reason, details, delivery_id, delivery_preview)
  values (me, p_user,
          (select username from public.profiles where id = me),
          (select username from public.profiles where id = p_user),
          p_reason, nullif(left(btrim(coalesce(p_details,'')), 500), ''), p_delivery, prev);
  insert into public.activity_log (user_id, kind) values (me, 'report');
end $$;

-- ---------- my status (the app asks this to show a suspension notice) ----------
create or replace function public.my_status()
returns table (suspended boolean, mode text, until timestamptz, reason text)
language sql stable security definer set search_path = public as $$
  select true, s.mode, s.until, s.reason
  from public.suspensions s
  where s.user_id = auth.uid() and (s.until is null or s.until > now())
  union all
  select false, null, null, null
  where auth.uid() is not null and not public.ev_suspended(auth.uid())
  limit 1
$$;

revoke all on function public.ev_suspended(uuid), public.ev_blocked(uuid, uuid), public.ev_count(uuid, text),
  public.block_user(uuid), public.unblock_user(uuid), public.list_blocked(), public.find_user(text),
  public.report_user(uuid, text, text, uuid), public.my_status() from public, anon;
grant execute on function public.block_user(uuid), public.unblock_user(uuid), public.list_blocked(), public.find_user(text),
  public.report_user(uuid, text, text, uuid), public.my_status() to authenticated;

-- ---------- admin tools: run these yourself in the SQL Editor (the app cannot call them) ----------
-- suspend by username:  select admin_suspend('username', 7, 'social', 'spam');   -- 7 days, no sending
--                       select admin_suspend('username', null, 'full', 'abuse'); -- permanent, app locked
create or replace function public.admin_suspend(p_username text, p_days int default null, p_mode text default 'social', p_reason text default null)
returns text language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  select id into u from public.profiles where username = lower(btrim(p_username));
  if u is null then return 'no user with username ' || p_username; end if;
  if p_mode not in ('social','full') then return 'mode must be social or full'; end if;
  insert into public.suspensions (user_id, mode, until, reason)
  values (u, p_mode, case when p_days is null then null else now() + make_interval(days => p_days) end, p_reason)
  on conflict (user_id) do update set mode = excluded.mode, until = excluded.until, reason = excluded.reason, created_at = now();
  return 'suspended @' || lower(btrim(p_username)) || ' (' || p_mode || ', ' || coalesce(p_days::text || ' days', 'permanent') || ')';
end $$;

create or replace function public.admin_unsuspend(p_username text)
returns text language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  select id into u from public.profiles where username = lower(btrim(p_username));
  if u is null then return 'no user with username ' || p_username; end if;
  delete from public.suspensions where user_id = u;
  return 'unsuspended @' || lower(btrim(p_username));
end $$;

revoke all on function public.admin_suspend(text, int, text, text), public.admin_unsuspend(text) from public, anon, authenticated;

notify pgrst, 'reload schema';
