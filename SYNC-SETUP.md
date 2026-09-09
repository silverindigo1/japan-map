# Sync between two phones

The app keeps two phones on the same trip: places, days, notes, bookings, journal, expenses and trip settings merge item by item, newest change wins, deletions carry across. It uses a free Supabase project as the meeting point. Photos and pin images are part of the data, so keep them small.

## What this protects, and what it does not

- Nobody can list or read trips without the trip code. The database table is not reachable directly; the app only calls two server functions that require the code.
- Anyone who has the code can read and change that one trip. The code is 24 random characters. Treat it like a password: send it to Lendita in person or in a message you both delete.
- Two phones editing at the same time do not overwrite each other: every save carries a revision number and the server refuses stale writes, the phone then merges and retries.
- This is not user accounts. If you ever share the app beyond the two of you, it needs proper sign-in.

## One time, on a computer, about 10 minutes

1. Go to https://supabase.com, sign up, New project. Any name, region in Europe, set a database password and keep it. Wait a minute.
2. Left menu, SQL Editor, New query. Paste all of this and press Run:

```sql
create table if not exists trips (
  id text primary key,
  data jsonb not null,
  rev bigint not null default 1,
  updated_at timestamptz default now()
);
alter table trips enable row level security;
revoke all on table trips from anon, authenticated;

create or replace function trip_get(code text)
returns json language plpgsql security definer set search_path = public as $$
declare r trips%rowtype;
begin
  if code is null or length(code) < 12 then raise exception 'bad code'; end if;
  select * into r from trips where id = code;
  if not found then return null; end if;
  return json_build_object('data', r.data, 'rev', r.rev, 'updated_at', r.updated_at);
end $$;

create or replace function trip_put(code text, newdata jsonb, expected_rev bigint)
returns json language plpgsql security definer set search_path = public as $$
declare r trips%rowtype;
begin
  if code is null or length(code) < 12 then raise exception 'bad code'; end if;
  if pg_column_size(newdata) > 20000000 then raise exception 'too large'; end if;
  select * into r from trips where id = code for update;
  if not found then
    insert into trips (id, data, rev) values (code, newdata, 1) returning * into r;
    return json_build_object('ok', true, 'rev', r.rev);
  end if;
  if r.rev <> expected_rev then
    return json_build_object('ok', false, 'rev', r.rev, 'data', r.data);
  end if;
  update trips set data = newdata, rev = r.rev + 1, updated_at = now() where id = code returning * into r;
  return json_build_object('ok', true, 'rev', r.rev);
end $$;

revoke all on function trip_get(text) from public;
revoke all on function trip_put(text, jsonb, bigint) from public;
grant execute on function trip_get(text) to anon;
grant execute on function trip_put(text, jsonb, bigint) to anon;
```

3. Left menu, Project Settings, API. Copy the Project URL (https://something.supabase.co) and the anon public key. The anon key is meant to be public; the service role key must never go in the app.

## On each phone

More, Backup, "Sync between phones":

1. Paste the Project URL and the anon key.
2. First phone: tap New code, send the code to the other phone.
3. Tap Turn on sync. The status line says Synced with the time.
4. Second phone: same address, same key, same code, Turn on sync.

Changes are sent a few seconds after you make them; each phone checks every minute and whenever you open the app. Sync failing never blocks the app: everything is saved on the phone first and sent when it works again.

## Checks you can do

- Turn on sync on phone A, edit a note, watch it appear on phone B within a minute.
- Put phone B in airplane mode, edit on both, reconnect B: both edits are kept.
- Open the Supabase Table Editor: you should see one row per trip and be unable to read it through the API without the code.
