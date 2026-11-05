-- EvoLyric v113: send a whole CATEGORY (a named group of songs) and raise the limit to 300 songs per delivery.
-- Run once in Supabase > SQL Editor, after 006. Safe to re-run.

-- Bigger deliveries: up to 5 MB each (300 songs with long lyrics).
do $$ declare c record; begin
  for c in select conname from pg_constraint
            where conrelid = 'public.shared_songs'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%octet_length%'
  loop execute format('alter table public.shared_songs drop constraint %I', c.conname); end loop;
end $$;
alter table public.shared_songs add constraint shared_songs_size check (octet_length(payload::text) <= 5000000);

-- A delivery may carry a category name (null = a plain group of songs).
alter table public.shared_songs add column if not exists cat text;

-- send_songs now takes an optional category name. Drop the old 2-argument version first so the call is not ambiguous.
drop function if exists public.send_songs(uuid, jsonb);
create or replace function public.send_songs(p_to uuid, p_songs jsonb, p_cat text default null)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int; clean jsonb; first_title text; first_artist text; prev text; cn text := nullif(left(btrim(coalesce(p_cat, '')), 30), '');
begin
  if me is null then raise exception 'not signed in'; end if;
  if jsonb_typeof(p_songs) <> 'array' then raise exception 'songs must be an array' using errcode = '22023'; end if;
  n := jsonb_array_length(p_songs);
  if n < 1 or n > 300 then raise exception 'between 1 and 300 songs' using errcode = '22023'; end if;
  if not exists (select 1 from public.friendships
                  where status = 'accepted'
                    and least(requester, addressee) = least(me, p_to) and greatest(requester, addressee) = greatest(me, p_to)) then
    raise exception 'not friends' using errcode = '42501';
  end if;
  if (select count(*) from public.shared_songs where sender = me and recipient = p_to) >= 20 then
    raise exception 'too many waiting deliveries' using errcode = '54000';
  end if;
  select jsonb_agg(jsonb_build_object(
           'title',  left(coalesce(e->>'title',''), 200),
           'artist', left(coalesce(e->>'artist',''), 200),
           'lyrics', coalesce(e->>'lyrics',''),
           'key',    left(coalesce(e->>'key',''), 10),
           'colors', case when jsonb_typeof(e->'colors') = 'object' then e->'colors' else '{}'::jsonb end) order by i)
    into clean
    from jsonb_array_elements(p_songs) with ordinality as t(e, i);
  first_title  := clean->0->>'title';
  first_artist := clean->0->>'artist';
  select string_agg(x->>'title', ', ') into prev from (select x from jsonb_array_elements(clean) with ordinality as t(x, i) where i <= 3 order by i) q;
  insert into public.shared_songs (sender, recipient, title, artist, payload, song_count, preview, cat)
  values (me, p_to,
          case when cn is not null then cn when n = 1 then first_title else n || ' songs' end,
          case when n = 1 and cn is null then first_artist else '' end,
          case when cn is not null then jsonb_build_object('songs', clean, 'cat', cn) else jsonb_build_object('songs', clean) end,
          n, left(prev, 200), cn);
end $$;

-- Inbox list now also returns the category name.
drop function if exists public.list_inbox();
create or replace function public.list_inbox()
returns table (id uuid, sender_id uuid, username text, display_name text, avatar_url text, title text, artist text, song_count int, preview text, created_at timestamptz, cat text)
language sql security definer set search_path = public stable as $$
  select s.id, s.sender, p.username, p.display_name, p.avatar_url, s.title, s.artist, s.song_count, s.preview, s.created_at, s.cat
  from public.shared_songs s join public.profiles p on p.id = s.sender
  where auth.uid() is not null and s.recipient = auth.uid()
  order by s.created_at desc
  limit 100
$$;

revoke all on function public.send_songs(uuid, jsonb, text), public.list_inbox() from public, anon;
grant execute on function public.send_songs(uuid, jsonb, text), public.list_inbox() to authenticated;

notify pgrst, 'reload schema';
