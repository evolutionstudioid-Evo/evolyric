-- 012: deleting an account also removes its username and content excerpts from moderation reports
-- (the reports themselves stay for moderation, anonymised). Run once after 011. Safe to re-run.

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

  -- moderation reports: keep the report, remove this account's name and content
  if to_regclass('public.reports') is not null then
    update public.reports set reporter_username = null where reporter = me;
    update public.reports set reported_username = null, delivery_preview = null where reported = me;
  end if;

  -- sharing and friends
  delete from public.shared_songs where sender = me or recipient = me;
  delete from public.friendships where requester = me or addressee = me;
  delete from public.profiles where id = me;

  -- the sign-in account itself (blocks, activity log and suspension go with it: on delete cascade)
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
