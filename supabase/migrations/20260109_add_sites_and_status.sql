-- Migration: Add sites and status columns to sessions and tournaments tables
-- Run this in Supabase SQL Editor
-- BACKWARDS COMPATIBLE: Migrates existing data to new schema

-- ============================================
-- STEP 1: ADD NEW COLUMNS TO SESSIONS
-- ============================================

-- Add 'sites' column to store multi-site session data as JSONB array
-- Structure: [{name: string, cashIn?: number, cashOut?: number}]
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS sites JSONB DEFAULT NULL;

-- Add 'status' column to sessions (defaults to 'completed' for existing data)
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'
CHECK (status IN ('in_progress', 'completed'));

-- ============================================
-- STEP 2: ADD NEW COLUMNS TO TOURNAMENTS
-- ============================================

-- Add 'status' column to tournaments
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'
CHECK (status IN ('in_progress', 'completed'));

-- Add 'sites' column to tournaments for multi-site support
-- Structure: [{name: string, buyIn?: number, fee?: number, entries?: number}]
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS sites JSONB DEFAULT NULL;

-- ============================================
-- STEP 2: MIGRATE EXISTING SESSION DATA
-- ============================================
-- Convert existing location/site + buy_in_total/cash_out_total into sites array
-- Only for sessions that have a venue/site name AND don't already have sites data

UPDATE sessions
SET sites = jsonb_build_array(
  jsonb_build_object(
    'name', COALESCE(
      CASE WHEN type = 'live' THEN location ELSE site END,
      ''
    ),
    'cashIn', COALESCE(buy_in_total, 0),
    'cashOut', COALESCE(cash_out_total, 0)
  )
)
WHERE sites IS NULL
  AND (
    (type = 'live' AND location IS NOT NULL AND location != '')
    OR (type = 'online' AND site IS NOT NULL AND site != '')
  )
  AND (buy_in_total IS NOT NULL OR cash_out_total IS NOT NULL);

-- ============================================
-- STEP 3: SET STATUS FOR EXISTING DATA
-- ============================================
-- All existing sessions are considered 'completed'
UPDATE sessions SET status = 'completed' WHERE status IS NULL;
UPDATE tournaments SET status = 'completed' WHERE status IS NULL;

-- ============================================
-- VERIFICATION QUERY (optional - run to check migration)
-- ============================================
-- SELECT id, type, location, site, buy_in_total, cash_out_total, sites, status
-- FROM sessions
-- LIMIT 10;
