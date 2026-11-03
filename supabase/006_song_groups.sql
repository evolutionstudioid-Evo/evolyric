-- EvoLyric v37: send a GROUP of songs in one delivery (up to 50). Run once in Supabase > SQL Editor, after 005. Safe to re-run.

-- Bigger groups need a bigger size cap (1 MB per delivery). Drop the old 200 KB check whatever it is called.
do $$ declare c record; begin
  for c in select conname from pg_constraint
            where conrelid = 'public.shared_songs'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%octet_length%'
  loop execute format('alter table public.shared_songs drop constraint %I', c.conname); end loop;
end $$;
alter table public.shared_songs add constraint shared_songs_size check (octet_length(payload::text) <= 1000000);

alter table public.shared_songs add column if not exists song_count int not null default 1;
alter table public.shared_songs add column if not exists preview text;

-- Send 1..50 songs as ONE delivery. Only accepted friends; max 20 waiting deliveries per pair; only whitelisted fields are kept.
create or replace function public.send_songs(p_to uuid, p_songs jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int; clean jsonb; first_title text; first_artist text; prev text;
begin
  if me is null then raise exception 'not signed in'; end if;
  if jsonb_typeof(p_songs) <> 'array' then raise exception 'songs must be an array' using errcode = '22023'; end if;
  n := jsonb_array_length(p_songs);
  if n < 1 or n > 50 then raise exception 'between 1 and 50 songs' using errcode = '22023'; end if;
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
  insert into public.shared_songs (sender, recipient, title, artist, payload, song_count, preview)
  values (me, p_to,
          case when n = 1 then first_title else n || ' songs' end,
          case when n = 1 then first_artist else '' end,
          jsonb_build_object('songs', clean), n, left(prev, 200));
end $$;

-- Inbox list: light (no lyrics). The lyrics are fetched only when the recipient taps Save.
drop function if exists public.list_inbox();
create or replace function public.list_inbox()
returns table (id uuid, sender_id uuid, username text, display_name text, avatar_url text, title text, artist text, song_count int, preview text, created_at timestamptz)
language sql security definer set search_path = public stable as $$
  select s.id, s.sender, p.username, p.display_name, p.avatar_url, s.title, s.artist, s.song_count, s.preview, s.created_at
  from public.shared_songs s join public.profiles p on p.id = s.sender
  where auth.uid() is not null and s.recipient = auth.uid()
  order by s.created_at desc
  limit 100
$$;

create or replace function public.get_inbox_item(p_id uuid)
returns jsonb language sql security definer set search_path = public stable as $$
  select s.payload from public.shared_songs s where auth.uid() is not null and s.id = p_id and s.recipient = auth.uid()
$$;

revoke all on function public.send_songs(uuid, jsonb), public.list_inbox(), public.get_inbox_item(uuid) from public, anon;
grant execute on function public.send_songs(uuid, jsonb), public.list_inbox(), public.get_inbox_item(uuid) to authenticated;

notify pgrst, 'reload schema';
