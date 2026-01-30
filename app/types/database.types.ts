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
  // Currency exchange fields
  original_currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'RON' | null;
  original_result: number | null;
  exchange_rate: number | null;
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
  sites: { name: string; buyIn?: number; fee?: number; entries?: number; bankrollInitial?: number; bankrollFinal?: number }[] | null;
  field_size: number | null;
  finish_position: number | null;
  cashed: boolean | null;
  notes: string | null;
  tags: string[];
  status: 'in_progress' | 'completed';
  is_session: boolean | null;
  session_count: number | null;
  // Currency exchange fields
  original_currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'RON' | null;
  original_buy_in: number | null;
  original_fee: number | null;
  original_winnings: number | null;
  exchange_rate: number | null;
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

export interface DbCommunity {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  visibility: 'public' | 'private';
  invite_code: string | null;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'RON';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbCommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'admin' | 'member';
  status: 'pending' | 'approved' | 'rejected';
  display_name: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSessionCommunity {
  id: string;
  session_id: string;
  community_id: string;
  created_at: string;
}

export interface DbTournamentCommunity {
  id: string;
  tournament_id: string;
  community_id: string;
  created_at: string;
}

// Type for Supabase Database
export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: DbSession;
        Insert: Omit<DbSession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbSession, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      tournaments: {
        Row: DbTournament;
        Insert: Omit<DbTournament, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbTournament, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      horses: {
        Row: DbHorse;
        Insert: Omit<DbHorse, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbHorse, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      horse_transactions: {
        Row: DbHorseTransaction;
        Insert: Omit<DbHorseTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<DbHorseTransaction, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      reference_data: {
        Row: DbReferenceData;
        Insert: Omit<DbReferenceData, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbReferenceData, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      user_settings: {
        Row: DbUserSettings;
        Insert: Omit<DbUserSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbUserSettings, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      communities: {
        Row: DbCommunity;
        Insert: Omit<DbCommunity, 'id' | 'created_at' | 'updated_at' | 'invite_code'>;
        Update: Partial<Omit<DbCommunity, 'id' | 'created_by' | 'created_at'>>;
        Relationships: [];
      };
      community_members: {
        Row: DbCommunityMember;
        Insert: Omit<DbCommunityMember, 'id' | 'created_at' | 'updated_at' | 'joined_at'>;
        Update: Partial<Omit<DbCommunityMember, 'id' | 'created_at'>>;
        Relationships: [];
      };
      session_communities: {
        Row: DbSessionCommunity;
        Insert: Omit<DbSessionCommunity, 'id' | 'created_at'>;
        Update: never;
        Relationships: [];
      };
      tournament_communities: {
        Row: DbTournamentCommunity;
        Insert: Omit<DbTournamentCommunity, 'id' | 'created_at'>;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
