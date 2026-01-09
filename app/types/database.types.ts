// Supabase Database Types
// These types map to the database schema

export interface DbSession {
  id: string;
  user_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  type: 'live' | 'online';
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'RON';
  stake: string;
  small_blind: number;
  big_blind: number;
  game: 'NLH' | 'PLO' | 'PLO5' | 'Mixed';
  result: number;
  duration: number;
  location: string | null;
  site: string | null;
  table_count: number | null;
  buy_in_total: number | null;
  cash_out_total: number | null;
  bankroll_initial: number | null;
  bankroll_final: number | null;
  rake_fees: number | null;
  notes: string | null;
  tags: string[];
  sites: { name: string; cashIn?: number; cashOut?: number }[] | null;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface DbTournament {
  id: string;
  user_id: string;
  date: string;
  type: 'live' | 'online';
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'RON';
  name: string;
  buy_in: number;
  fee: number;
  entries: number;
  winnings: number;
  venue: string | null;
  site: string | null;
  field_size: number | null;
  finish_position: number | null;
  cashed: boolean | null;
  notes: string | null;
  tags: string[];
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface DbHorse {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'RON';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbHorseTransaction {
  id: string;
  user_id: string;
  horse_id: string;
  date: string;
  type: 'cash' | 'tournament';
  result: number;
  description: string | null;
  is_session: boolean;
  session_count: number | null;
  created_at: string;
}

export interface DbReferenceData {
  id: string;
  user_id: string;
  venues: string[];
  sites: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DbUserSettings {
  id: string;
  user_id: string;
  default_currency: string;
  is_demo_mode: boolean;
  theme: string;
  created_at: string;
  updated_at: string;
}

// Type for Supabase Database
export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: DbSession;
        Insert: Omit<DbSession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbSession, 'id' | 'user_id' | 'created_at'>>;
      };
      tournaments: {
        Row: DbTournament;
        Insert: Omit<DbTournament, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbTournament, 'id' | 'user_id' | 'created_at'>>;
      };
      horses: {
        Row: DbHorse;
        Insert: Omit<DbHorse, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbHorse, 'id' | 'user_id' | 'created_at'>>;
      };
      horse_transactions: {
        Row: DbHorseTransaction;
        Insert: Omit<DbHorseTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<DbHorseTransaction, 'id' | 'user_id' | 'created_at'>>;
      };
      reference_data: {
        Row: DbReferenceData;
        Insert: Omit<DbReferenceData, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbReferenceData, 'id' | 'user_id' | 'created_at'>>;
      };
      user_settings: {
        Row: DbUserSettings;
        Insert: Omit<DbUserSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbUserSettings, 'id' | 'user_id' | 'created_at'>>;
      };
    };
  };
}
