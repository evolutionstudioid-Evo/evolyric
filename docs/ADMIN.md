# Admin: moderation (EvoLyric)

Everything here is done in the **Supabase dashboard** of the EvoLyric project. The app itself cannot call any of the admin tools.
Requires `supabase/011_safety.sql` (and `010_delete_account.sql`) to have been run once in the SQL Editor.

## Read reports
Table Editor → `reports`, or in the SQL Editor:

```sql
select created_at, reporter_username, reported_username, reason, details, left(delivery_preview, 200) as delivery
from reports where status = 'open' order by created_at desc;
```

Mark one as handled: `update reports set status = 'done' where id = '…';`

## Suspend an account
```sql
select admin_suspend('username', 7, 'social', 'spam');      -- 7 days: cannot send songs, send/accept friend requests
select admin_suspend('username', null, 'social', 'spam');   -- the same, until you lift it
select admin_suspend('username', 30, 'full', 'harassment'); -- 30 days: the app is locked (Contact support / Sign out only)
select admin_unsuspend('username');                          -- lift it
select p.username, s.* from suspensions s join profiles p on p.id = s.user_id;  -- who is suspended
```
The user sees the notice within about half a minute (or when they open Friends).

## Delete an account
Authentication → Users → the user → Delete user. Their songs, categories, profile, friends and deliveries go with it.

## Limits built into the server (011_safety.sql)
| What | Limit |
| --- | --- |
| Friend requests | 20 per 24 hours per account |
| Song deliveries | 30 per 24 hours per account (each delivery: 1–300 songs, max 5 MB) |
| Waiting deliveries | 20 per friend pair (005/006) |
| Reports | 10 per 24 hours per account |

Blocked people cannot find each other by username, send requests or send songs; blocking also ends the friendship and deletes waiting songs both ways. The blocked person is not told.

Error codes the app shows as messages: `EV001` suspended, `EV002` blocked, `EV003` daily limit.

## Support
Users reach you from Help → Contact support (`evolution.studio.id@gmail.com`); the email already contains their app version, device and @username.
