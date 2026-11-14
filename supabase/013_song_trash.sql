-- EvoLyric v174: song trash. ADDITIVE and NON-DESTRUCTIVE. Safe to re-run. Run in Supabase Dashboard > SQL Editor.
-- Every row deleted from public.songs is first copied into public.song_trash, so an accidental or scripted
-- wipe can be undone. The table has RLS on and no policy: only you (dashboard / service role) can read it.
create table if not exists public.song_trash (
  id         bigserial primary key,
  user_id    uuid,
  song_id    text,
  row_data   jsonb not null,
  deleted_at timestamptz not null default now()
);
alter table public.song_trash enable row level security;
create index if not exists song_trash_user_idx on public.song_trash (user_id, deleted_at desc);

create or replace function public.song_to_trash() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.song_trash (user_id, song_id, row_data) values (old.user_id, old.id::text, to_jsonb(old));
  return old;
end $$;

drop trigger if exists songs_to_trash on public.songs;
create trigger songs_to_trash before delete on public.songs for each row execute function public.song_to_trash();

-- ---------- RESTORE (run by hand when needed; replace the e-mail) ----------
-- See what is in the trash for one person:
--   select deleted_at, row_data->>'title' title, row_data->>'artist' artist from public.song_trash
--    where user_id = (select id from auth.users where email = 'someone@example.com') order by deleted_at desc;
-- Put everything deleted since a moment back (existing ids are skipped):
--   insert into public.songs select r.* from public.song_trash t, jsonb_populate_record(null::public.songs, t.row_data) r
--    where t.user_id = (select id from auth.users where email = 'someone@example.com') and t.deleted_at > now() - interval '2 days'
--   on conflict (id) do nothing;
-- Open EvoLyric on the device afterwards: the songs come back through normal sync.
