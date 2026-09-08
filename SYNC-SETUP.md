# Sync between two phones

The app can keep two phones on the same trip: places, days, notes, bookings, checklist, journal, expenses and the trip settings merge automatically, newest change wins per item, deletions carry across. It uses a free Supabase project as the meeting point. Photos and pin images are part of the data, so keep them small.

## One time, on a computer, about 10 minutes

1. Go to https://supabase.com, sign up (GitHub login works), New project. Any name, choose a region in Europe, set a database password and keep it somewhere. Wait a minute for it to start.
2. Left menu, SQL Editor, New query. Paste this and press Run:

```sql
create table if not exists trips (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table trips enable row level security;
create policy "anyone with the code" on trips
  for all to anon using (true) with check (true);
```

3. Left menu, Project Settings, API. Copy two things: the Project URL (looks like https://abcdefgh.supabase.co) and the anon public key (a long string).

## On each phone

More, Backup, "Sync between phones":

1. Paste the Project URL and the anon key.
2. On the first phone tap New code, and send that code to the other phone (or type your own, at least 8 characters).
3. Tap Turn on sync. The status line says Synced with the time.
4. On the second phone enter the same three values and tap Turn on sync. Within a few seconds it receives everything.

From then on every change is sent about three seconds after you make it, and each phone checks for changes every minute and whenever you open the app.

## What to know

- Anyone who has the code can read and change the trip. The code is 20 random characters; do not post it anywhere.
- The free Supabase tier is far more than this needs. It pauses projects that see no traffic for a week; opening the app wakes it up, so during the trip it stays awake.
- Sync only runs in Safari or the home screen app, not inside Claude.
- If both phones edit the same note within the same few seconds, the later edit wins. Everything else merges.
- Turn off sync on a phone and its data stays put; it just stops sharing.
