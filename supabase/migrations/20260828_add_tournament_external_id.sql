-- Desktop table-capture support.
-- Adds provenance (`source`) and a stable per-user identity (`external_id`) to
-- tournaments so the desktop companion app can register a table once and
-- recognise a re-capture of the same table as a re-entry instead of a duplicate.
-- APPLY MANUALLY in the Supabase SQL editor - this project has no CLI migration runner.
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'desktop'));

-- Partial unique index: the guard that makes the re-entry rule safe. A second
-- insert with the same external_id can never create a duplicate row, so the
-- only outcomes of a repeat capture are "re-entry" or "ignore". Rows written by
-- the web app leave external_id NULL and are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS tournaments_user_external_id_idx
  ON tournaments(user_id, external_id)
  WHERE external_id IS NOT NULL;

-- ============================================
-- DOCUMENTATION
-- ============================================
COMMENT ON COLUMN tournaments.external_id IS 'Desktop capture identity: "<siteSlug>:<siteTournamentId>" or "<siteSlug>:<YYYY-MM-DD>:<hash>". NULL for web-app rows.';
COMMENT ON COLUMN tournaments.source IS 'Provenance: manual (web app) or desktop (companion app)';
