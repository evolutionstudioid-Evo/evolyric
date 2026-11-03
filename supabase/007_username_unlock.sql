-- EvoLyric v39: usernames can be changed again. Run once in Supabase > SQL Editor. Safe to re-run.
-- Removes the lock from 004. Uniqueness (index profiles_username_key) and the format check are unchanged,
-- so two people can still never share a username. Friends and shared songs are linked by internal id, so a rename breaks nothing.
drop trigger if exists profiles_lock_username on public.profiles;
drop function if exists public.lock_username();
notify pgrst, 'reload schema';
