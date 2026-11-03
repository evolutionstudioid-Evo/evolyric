-- EvoLyric v40: profile bio. Run once in Supabase > SQL Editor, after 007. Safe to re-run.
-- Adds profiles.bio (max 300 chars) that the owner can edit. Friends and people who find you by your exact username can read it.
-- Emails are still never returned.

alter table public.profiles add column if not exists bio text;
alter table public.profiles drop constraint if exists profiles_bio_len;
alter table public.profiles add constraint profiles_bio_len check (bio is null or char_length(bio) <= 300);
grant update (display_name, avatar_url, username, bio) on public.profiles to authenticated;

-- find_user and list_friends now also return the bio (their return type changes, so they are dropped and recreated).
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
  limit 1
$$;

drop function if exists public.list_friends();
create function public.list_friends()
returns table (id uuid, other_id uuid, username text, display_name text, avatar_url text, status text, incoming boolean, updated_at timestamptz, bio text)
language sql security definer set search_path = public stable as $$
  select f.id,
         case when f.requester = auth.uid() then f.addressee else f.requester end,
         p.username, p.display_name, p.avatar_url, f.status, (f.addressee = auth.uid()), f.updated_at, p.bio
  from public.friendships f
  join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where auth.uid() is not null and (f.requester = auth.uid() or f.addressee = auth.uid())
  order by f.updated_at desc
$$;

revoke all on function public.find_user(text), public.list_friends() from public, anon;
grant execute on function public.find_user(text), public.list_friends() to authenticated;

notify pgrst, 'reload schema';
