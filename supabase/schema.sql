-- Poker Wallet Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CASH SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TEXT, -- HH:mm
  end_time TEXT, -- HH:mm
  type TEXT NOT NULL CHECK (type IN ('live', 'online')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'RON')),
  stake TEXT NOT NULL, -- e.g., "1/2", "2/5"
  small_blind NUMERIC NOT NULL DEFAULT 0,
  big_blind NUMERIC NOT NULL DEFAULT 0,
  game TEXT NOT NULL CHECK (game IN ('NLH', 'PLO', 'PLO5', 'Mixed')),
  result NUMERIC NOT NULL DEFAULT 0, -- profit/loss (signed)
  duration INTEGER NOT NULL DEFAULT 0, -- minutes
  location TEXT, -- for live sessions
  site TEXT, -- for online sessions
  table_count INTEGER, -- for online multi-tabling
  buy_in_total NUMERIC,
  cash_out_total NUMERIC,
  rake_fees NUMERIC,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  sites JSONB DEFAULT NULL, -- Array of site entries: [{name: string, cashIn?: number, cashOut?: number}]
  status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_date_idx ON sessions(date DESC);

-- ============================================
-- TOURNAMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('live', 'online')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'RON')),
  name TEXT NOT NULL,
  buy_in NUMERIC NOT NULL DEFAULT 0,
  fee NUMERIC NOT NULL DEFAULT 0, -- rake/fees separate from buy-in
  entries INTEGER NOT NULL DEFAULT 0, -- 0 = single entry, 1+ = re-entries/re-buys
  winnings NUMERIC NOT NULL DEFAULT 0, -- total prize won (0 if busted)
  venue TEXT, -- for live tournaments
  site TEXT, -- for online tournaments
  sites JSONB DEFAULT NULL, -- Array of site entries: [{name: string, buyIn?: number, fee?: number, entries?: number}]
  field_size INTEGER,
  finish_position INTEGER,
  cashed BOOLEAN,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed')),
  external_id TEXT, -- desktop capture identity: "<siteSlug>:<siteTournamentId>" or "<siteSlug>:<date>:<hash>"; NULL for web-app rows
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'desktop')), -- provenance: web app vs desktop companion
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS tournaments_user_id_idx ON tournaments(user_id);
CREATE INDEX IF NOT EXISTS tournaments_date_idx ON tournaments(date DESC);
-- Partial unique index: a repeat desktop capture can never create a duplicate row
CREATE UNIQUE INDEX IF NOT EXISTS tournaments_user_external_id_idx
  ON tournaments(user_id, external_id)
  WHERE external_id IS NOT NULL;

-- ============================================
-- HORSES TABLE (Staking)
-- ============================================
CREATE TABLE IF NOT EXISTS horses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT, -- Optional color identifier (hex color)
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'RON')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS horses_user_id_idx ON horses(user_id);

-- ============================================
-- HORSE TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS horse_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'tournament')),
  result NUMERIC NOT NULL DEFAULT 0, -- profit/loss (signed)
  description TEXT, -- e.g., "WSOP Main Event", "2/5 NLH session"
  is_session BOOLEAN DEFAULT false,
  session_count INTEGER, -- number of games in the session
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS horse_transactions_user_id_idx ON horse_transactions(user_id);
CREATE INDEX IF NOT EXISTS horse_transactions_horse_id_idx ON horse_transactions(horse_id);
CREATE INDEX IF NOT EXISTS horse_transactions_date_idx ON horse_transactions(date DESC);

-- ============================================
-- REFERENCE DATA TABLE (Venues, Sites, Tags)
-- ============================================
CREATE TABLE IF NOT EXISTS reference_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venues TEXT[] DEFAULT '{}',
  sites TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  default_currency TEXT DEFAULT 'USD',
  is_demo_mode BOOLEAN DEFAULT true, -- true = show mock data, false = db only
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE horse_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Tournaments policies
CREATE POLICY "Users can view own tournaments" ON tournaments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tournaments" ON tournaments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tournaments" ON tournaments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tournaments" ON tournaments
  FOR DELETE USING (auth.uid() = user_id);

-- Horses policies
CREATE POLICY "Users can view own horses" ON horses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own horses" ON horses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own horses" ON horses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own horses" ON horses
  FOR DELETE USING (auth.uid() = user_id);

-- Horse transactions policies
CREATE POLICY "Users can view own horse transactions" ON horse_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own horse transactions" ON horse_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own horse transactions" ON horse_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own horse transactions" ON horse_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Reference data policies
CREATE POLICY "Users can view own reference data" ON reference_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reference data" ON reference_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reference data" ON reference_data
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reference data" ON reference_data
  FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_horses_updated_at
  BEFORE UPDATE ON horses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reference_data_updated_at
  BEFORE UPDATE ON reference_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Initialize user data on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default user settings
  INSERT INTO user_settings (user_id, is_demo_mode, default_currency, theme)
  VALUES (NEW.id, true, 'USD', 'dark');

  -- Create default reference data
  INSERT INTO reference_data (user_id, venues, sites, tags)
  VALUES (
    NEW.id,
    ARRAY['Bellagio', 'Aria', 'Venetian', 'Commerce Casino', 'Wynn'],
    ARRAY['PokerStars', 'GGPoker', 'partypoker', 'WPT Global', '888poker'],
    ARRAY['Good Run', 'Bad Beat', 'Deepstack', 'Turbo', 'Bounty']
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize user data on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
