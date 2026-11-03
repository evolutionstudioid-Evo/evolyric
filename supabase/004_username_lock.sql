-- EvoLyric v35: a username can be set once and then cannot be changed by the user. Run once in Supabase > SQL Editor. Safe to re-run.
-- (Uniqueness is already guaranteed by the unique index profiles_username_key from 002.)

create or replace function public.lock_username()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Only app users (signed-in JWT) are blocked. You, as the project owner in the SQL Editor / Table Editor, can still fix a name by hand.
  if auth.uid() is not null and old.username is not null and new.username is distinct from old.username then
    raise exception 'username is locked' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists profiles_lock_username on public.profiles;
create trigger profiles_lock_username before update on public.profiles
  for each row execute function public.lock_username();
