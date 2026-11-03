-- EvoLyric v34: richer usernames + Friends (requests / accept / remove). Run once in Supabase > SQL Editor, after 002. Safe to re-run.

-- 1) Usernames may now also contain . _ -  (3-20 chars, start with a letter/digit, no "..", stored lowercase)
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or (
    username ~ '^[a-z0-9][a-z0-9._-]{2,19}$'
    and username !~ '\.\.'
    and username not in ('admin','root','support','evolyric','evo','system')));

-- 2) Friendships. One row per pair (either direction). Clients never write to it directly: only the functions below do.
create table if not exists public.friendships (
  id         uuid primary key default gen_random_uuid(),
  requester  uuid not null references auth.users(id) on delete cascade,
  addressee  uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester <> addressee)
);
create unique index if not exists friendships_pair_key
  on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists friendships_addressee_idx on public.friendships (addressee);

alter table public.friendships enable row level security;
drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own" on public.friendships
  for select to authenticated using (requester = auth.uid() or addressee = auth.uid());
revoke all on public.friendships from anon, authenticated;
grant select on public.friendships to authenticated;

-- 3) Find ONE person by exact username (no prefix search, so nobody can list or scrape users). Never returns the email.
create or replace function public.find_user(p_username text)
returns table (id uuid, username text, display_name text, avatar_url text)
language sql security definer set search_path = public stable as $$
  select p.id, p.username, p.display_name, p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and p.username is not null
    and p.username = lower(btrim(p_username))
    and p.id <> auth.uid()
  limit 1
$$;

-- 4) Send a request. If the other person already asked you, this accepts it.
create or replace function public.send_friend_request(p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.friendships;
begin
  if me is null then raise exception 'not signed in'; end if;
  if p_user is null or p_user = me then raise exception 'invalid user'; end if;
  if not exists (select 1 from public.profiles where id = p_user and username is not null) then raise exception 'user not found'; end if;
  select * into r from public.friendships
   where least(requester, addressee) = least(me, p_user) and greatest(requester, addressee) = greatest(me, p_user);
  if found then
    if r.status = 'accepted' then return 'friends'; end if;
    if r.requester = me then return 'sent'; end if;
    update public.friendships set status = 'accepted', updated_at = now() where id = r.id;
    return 'friends';
  end if;
  insert into public.friendships (requester, addressee) values (me, p_user);
  return 'sent';
end $$;

-- 5) Answer a request addressed to you.
create or replace function public.respond_friend_request(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_accept then
    update public.friendships set status = 'accepted', updated_at = now()
     where id = p_id and addressee = auth.uid() and status = 'pending';
  else
    delete from public.friendships where id = p_id and addressee = auth.uid() and status = 'pending';
  end if;
end $$;

-- 6) Cancel a request you sent, or remove a friend (either side can do this).
create or replace function public.remove_friendship(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from public.friendships where id = p_id and (requester = auth.uid() or addressee = auth.uid());
end $$;

-- 7) My friends and requests, with the other person's public profile (no email).
create or replace function public.list_friends()
returns table (id uuid, other_id uuid, username text, display_name text, avatar_url text, status text, incoming boolean, updated_at timestamptz)
language sql security definer set search_path = public stable as $$
  select f.id,
         case when f.requester = auth.uid() then f.addressee else f.requester end,
         p.username, p.display_name, p.avatar_url, f.status, (f.addressee = auth.uid()), f.updated_at
  from public.friendships f
  join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where auth.uid() is not null and (f.requester = auth.uid() or f.addressee = auth.uid())
  order by f.updated_at desc
$$;

revoke all on function public.find_user(text), public.send_friend_request(uuid), public.respond_friend_request(uuid, boolean),
  public.remove_friendship(uuid), public.list_friends() from public, anon;
grant execute on function public.find_user(text), public.send_friend_request(uuid), public.respond_friend_request(uuid, boolean),
  public.remove_friendship(uuid), public.list_friends() to authenticated;

notify pgrst, 'reload schema';
