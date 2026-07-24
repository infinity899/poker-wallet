-- Trips & Expenses Feature Migration
-- Adds the trips (festival / travel container) table and the expenses table.
-- APPLY MANUALLY in the Supabase SQL editor - this project has no CLI migration runner.
-- Re-running this file will error on CREATE POLICY / CREATE TRIGGER (they have no
-- IF NOT EXISTS); that matches the existing migrations in this folder.

-- ============================================
-- TRIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  venue TEXT,
  location TEXT,
  -- `date` is the trip START date. The column MUST be named `date`:
  -- app/adapters/SupabaseAdapter.ts hard-codes .order('date') in getAll()
  -- and .lt('date', cursor) in getPaginated() for every table.
  date DATE NOT NULL,
  end_date DATE NOT NULL,
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'RON')),
  -- Denormalized link to tournaments (deliberately NOT a junction table).
  -- TEXT[] rather than UUID[]: ids imported from demo mode are not always valid
  -- UUIDs, and a bad cast would hard-fail the whole INSERT. Stale ids are
  -- filtered on read instead (useTripsStore().getTripTournaments()).
  tournament_ids TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trips_end_date_after_start CHECK (end_date >= date)
);

CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips(user_id);
CREATE INDEX IF NOT EXISTS trips_date_idx ON trips(date DESC);
CREATE INDEX IF NOT EXISTS trips_tournament_ids_idx ON trips USING GIN (tournament_ids);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- NULLABLE on purpose: standalone expenses (no trip) are supported.
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'travel', 'accommodation', 'food', 'transport', 'fees', 'entertainment', 'other'
  )),
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0, -- ALWAYS USD
  original_currency TEXT NOT NULL DEFAULT 'USD' CHECK (original_currency IN ('USD', 'EUR', 'GBP', 'CAD', 'RON')),
  original_amount NUMERIC NOT NULL DEFAULT 0,
  exchange_rate NUMERIC NOT NULL DEFAULT 1,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS expenses_trip_id_idx ON expenses(trip_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON trips
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS (reuse the existing update_updated_at_column() from schema.sql)
-- ============================================
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DOCUMENTATION
-- ============================================
COMMENT ON COLUMN trips.date IS 'Trip start date. Named `date` because SupabaseAdapter orders every table by date.';
COMMENT ON COLUMN trips.end_date IS 'Trip end date (inclusive)';
COMMENT ON COLUMN trips.tournament_ids IS 'Denormalized tournament links; stale ids are filtered client-side';
COMMENT ON COLUMN expenses.trip_id IS 'Nullable - expenses without a trip are standalone';
COMMENT ON COLUMN expenses.amount IS 'Always USD';
COMMENT ON COLUMN expenses.original_amount IS 'Amount in the currency the user entered';
COMMENT ON COLUMN expenses.exchange_rate IS 'USD rate at time of recording (1 original_currency = X USD)';
