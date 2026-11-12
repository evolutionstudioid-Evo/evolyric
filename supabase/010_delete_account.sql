-- 010: let a signed-in user permanently delete their own account and everything that belongs to it.
-- Run once in the Supabase SQL Editor (after 001–009). Called by the app: Account Settings → Delete account.
-- The function only ever deletes the caller's own data (auth.uid()); it cannot touch anyone else.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  -- cloud library
  if to_regclass('public.song_categories') is not null then
    delete from public.song_categories
     where song_id in (select id from public.songs where user_id = me)
        or category_id in (select id from public.categories where user_id = me);
  end if;
  if to_regclass('public.songs') is not null then delete from public.songs where user_id = me; end if;
  if to_regclass('public.categories') is not null then delete from public.categories where user_id = me; end if;

  -- sharing and friends (also removed by "on delete cascade", deleted here explicitly to be sure)
  delete from public.shared_songs where sender = me or recipient = me;
  delete from public.friendships where requester = me or addressee = me;
  delete from public.profiles where id = me;

  -- the sign-in account itself
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
