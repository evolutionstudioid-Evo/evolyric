-- EvoLyric cloud sync: OPTIONAL, ADDITIVE, NON-DESTRUCTIVE (no DROP / DELETE / TRUNCATE / column removal).
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run. Read STEP 0 first.
--
-- The app needs: songs(id, user_id, title, artist, lyrics, local_id, app_data, updated_at),
--                categories(id, user_id, name, local_id, app_data, updated_at),
--                song_categories(song_id, category_id).
-- The tables already exist in your project; this file only fills in what may be missing.

-- ============================== STEP 0: look before you run (read-only) ==============================
-- select table_name, column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--  where table_schema='public' and table_name in ('songs','categories','song_categories') order by 1, ordinal_position;
-- select tablename, policyname, cmd, roles, qual, with_check from pg_policies
--  where schemaname='public' and tablename in ('songs','categories','song_categories');
-- select conname, contype, pg_get_constraintdef(oid) from pg_constraint
--  where conrelid in ('public.songs'::regclass,'public.categories'::regclass,'public.song_categories'::regclass);
-- Duplicate check (must return 0 rows before STEP 2 can create the unique indexes):
-- select user_id, local_id, count(*) from public.songs      where local_id is not null group by 1,2 having count(*)>1;
-- select user_id, local_id, count(*) from public.categories where local_id is not null group by 1,2 having count(*)>1;

-- ============================== STEP 1: columns (no-op if they already exist) ==============================
alter table public.songs      add column if not exists local_id   text;
alter table public.songs      add column if not exists app_data   jsonb not null default '{}'::jsonb;
alter table public.songs      add column if not exists updated_at timestamptz not null default now();
alter table public.categories add column if not exists local_id   text;
alter table public.categories add column if not exists app_data   jsonb not null default '{}'::jsonb;
alter table public.categories add column if not exists updated_at timestamptz not null default now();

-- ============================== STEP 2: one row per (user, app id) — prevents duplicate uploads ==============================
create unique index if not exists songs_user_local_uq      on public.songs      (user_id, local_id) where local_id is not null;
create unique index if not exists categories_user_local_uq on public.categories (user_id, local_id) where local_id is not null;
create index if not exists song_categories_category_idx    on public.song_categories (category_id);

-- ============================== STEP 3: row level security (adds owner-only policies; existing ones are left alone) ==============================
alter table public.songs           enable row level security;
alter table public.categories      enable row level security;
alter table public.song_categories enable row level security;

grant select, insert, update, delete on public.songs           to authenticated;
grant select, insert, update, delete on public.categories      to authenticated;
grant select, insert, delete         on public.song_categories to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='songs' and policyname='evolyric_songs_owner') then
    create policy evolyric_songs_owner on public.songs for all to authenticated
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='categories' and policyname='evolyric_categories_owner') then
    create policy evolyric_categories_owner on public.categories for all to authenticated
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  -- a relation row is visible/writable only when BOTH its song and its category belong to the caller
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='song_categories' and policyname='evolyric_song_categories_select') then
    create policy evolyric_song_categories_select on public.song_categories for select to authenticated
      using (exists (select 1 from public.songs s where s.id = song_id and s.user_id = auth.uid())
         and exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='song_categories' and policyname='evolyric_song_categories_insert') then
    create policy evolyric_song_categories_insert on public.song_categories for insert to authenticated
      with check (exists (select 1 from public.songs s where s.id = song_id and s.user_id = auth.uid())
              and exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='song_categories' and policyname='evolyric_song_categories_delete') then
    create policy evolyric_song_categories_delete on public.song_categories for delete to authenticated
      using (exists (select 1 from public.songs s where s.id = song_id and s.user_id = auth.uid())
         and exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()));
  end if;
end $$;

-- ============================== STEP 4 (optional): Realtime, so other devices update without a manual refresh ==============================
-- The app also refreshes on sign-in, tab focus and reconnect, so this is a convenience, not a requirement.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='songs') then
      alter publication supabase_realtime add table public.songs; end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='categories') then
      alter publication supabase_realtime add table public.categories; end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='song_categories') then
      alter publication supabase_realtime add table public.song_categories; end if;
  end if;
end $$;
