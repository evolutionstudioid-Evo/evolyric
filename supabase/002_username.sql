-- EvoLyric v33: unique username on profiles (first step of the Friends feature).
-- Run once in Supabase Dashboard > SQL Editor (after 001_profiles.sql). Safe to re-run.

alter table public.profiles add column if not exists username text;

-- Format: 3-20 chars, lowercase letters, digits, underscore. Stored lowercase, so a plain unique index is case-insensitive.
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or (username ~ '^[a-z0-9_]{3,20}$' and username not in ('admin','root','support','evolyric','evo','system')));

create unique index if not exists profiles_username_key on public.profiles (username) where username is not null;

-- Clients may set their own username (RLS policy profiles_update_own already limits this to their own row).
grant update (display_name, avatar_url, username) on public.profiles to authenticated;

notify pgrst, 'reload schema';
