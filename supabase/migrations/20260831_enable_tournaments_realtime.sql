-- Live tournament updates in the web app.
-- Lets an open browser or phone hear about a tournament registered elsewhere -
-- the desktop companion capturing a table, another tab, another device - instead
-- of only finding out on the next refresh.
-- APPLY MANUALLY in the Supabase SQL editor - this project has no CLI migration runner.

-- Postgres sends only the replica identity for UPDATE/DELETE. With the default
-- (primary key) the old row is just an id, so a subscription filtered on
-- `user_id=eq.<uid>` never matches a delete and rows would linger in an open tab
-- until it reloaded. FULL puts the whole old row in the WAL, which costs a little
-- write amplification on a table that sees a handful of writes a day.
ALTER TABLE tournaments REPLICA IDENTITY FULL;

-- Add the table to the publication Realtime reads. Guarded because
-- `ALTER PUBLICATION ... ADD TABLE` errors if the table is already a member,
-- and this file may well be run twice.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tournaments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
  END IF;
END
$$;

-- No policy changes: Realtime evaluates the SAME RLS policies as a SELECT, so
-- "Users can view own tournaments" is what keeps another user's rows off this
-- user's socket. The client-side `user_id=eq.<uid>` filter is a bandwidth
-- optimisation on top of that, not the security boundary.
