export type SessionType = 'live' | 'online';
export type GameType = 'NLH' | 'PLO' | 'PLO5' | 'Mixed';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'RON';

export interface CashSession {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  type: SessionType;
  currency: Currency;
  stake: string; // e.g., "1/2", "2/5"
  smallBlind: number;
  bigBlind: number;
  game: GameType;
  result: number; // profit/loss (signed)
  duration: number; // minutes
  location?: string; // for live sessions
  site?: string; // for online sessions
  tableCount?: number; // for online multi-tabling
  buyInTotal?: number;
  cashOutTotal?: number;
  rakeFees?: number;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionStats {
  totalSessions: number;
  totalProfit: number;
  totalHours: number;
  winRate: number; // % of winning sessions
  avgProfit: number;
  hourlyRate: number;
  bestSession: number;
  worstSession: number;
  currentStreak: number; // positive = winning streak, negative = losing
  winningSessions: number;
  losingSessions: number;
}

export type NewCashSession = Omit<CashSession, 'id' | 'createdAt' | 'updatedAt'>;
