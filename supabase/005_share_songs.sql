-- EvoLyric v36: send a song (a COPY with its edits) to a friend. Run once in Supabase > SQL Editor, after 003/004. Safe to re-run.
-- Only accepted friends can send to each other. The recipient decides: Save (copy goes into their own library) or Dismiss.

create table if not exists public.shared_songs (
  id         uuid primary key default gen_random_uuid(),
  sender     uuid not null references auth.users(id) on delete cascade,
  recipient  uuid not null references auth.users(id) on delete cascade,
  title      text not null default '',
  artist     text not null default '',
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  check (sender <> recipient),
  check (octet_length(payload::text) <= 200000)
);
create index if not exists shared_songs_recipient_idx on public.shared_songs (recipient, created_at desc);

alter table public.shared_songs enable row level security;   -- no policies on purpose: clients only use the functions below
revoke all on public.shared_songs from anon, authenticated;

-- Send: only to an accepted friend, max 20 waiting songs per pair, only whitelisted fields are kept.
create or replace function public.send_song(p_to uuid, p_song jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); clean jsonb;
begin
  if me is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.friendships
                  where status = 'accepted'
                    and least(requester, addressee) = least(me, p_to) and greatest(requester, addressee) = greatest(me, p_to)) then
    raise exception 'not friends' using errcode = '42501';
  end if;
  if (select count(*) from public.shared_songs where sender = me and recipient = p_to) >= 20 then
    raise exception 'too many waiting songs' using errcode = '54000';
  end if;
  clean := jsonb_build_object(
    'title',  left(coalesce(p_song->>'title',''), 200),
    'artist', left(coalesce(p_song->>'artist',''), 200),
    'lyrics', coalesce(p_song->>'lyrics',''),
    'key',    left(coalesce(p_song->>'key',''), 10),
    'colors', case when jsonb_typeof(p_song->'colors') = 'object' then p_song->'colors' else '{}'::jsonb end);
  insert into public.shared_songs (sender, recipient, title, artist, payload)
  values (me, p_to, clean->>'title', clean->>'artist', clean);
end $$;

-- My inbox (songs waiting for me) with the sender's public profile (no email).
create or replace function public.list_inbox()
returns table (id uuid, sender_id uuid, username text, display_name text, avatar_url text, title text, artist text, payload jsonb, created_at timestamptz)
language sql security definer set search_path = public stable as $$
  select s.id, s.sender, p.username, p.display_name, p.avatar_url, s.title, s.artist, s.payload, s.created_at
  from public.shared_songs s join public.profiles p on p.id = s.sender
  where auth.uid() is not null and s.recipient = auth.uid()
  order by s.created_at desc
  limit 100
$$;

-- Done with a song (saved locally or dismissed): remove it from the inbox.
create or replace function public.clear_inbox_song(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from public.shared_songs where id = p_id and recipient = auth.uid();
end $$;

-- Unfriending also drops songs still waiting between the two people.
create or replace function public.remove_friendship(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.friendships;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into r from public.friendships where id = p_id and (requester = auth.uid() or addressee = auth.uid());
  if not found then return; end if;
  delete from public.shared_songs where (sender = r.requester and recipient = r.addressee) or (sender = r.addressee and recipient = r.requester);
  delete from public.friendships where id = r.id;
end $$;

revoke all on function public.send_song(uuid, jsonb), public.list_inbox(), public.clear_inbox_song(uuid), public.remove_friendship(uuid) from public, anon;
grant execute on function public.send_song(uuid, jsonb), public.list_inbox(), public.clear_inbox_song(uuid), public.remove_friendship(uuid) to authenticated;

notify pgrst, 'reload schema';
