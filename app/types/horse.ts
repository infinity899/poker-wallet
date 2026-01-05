import type { Currency } from './session';

export type HorseTransactionType = 'cash' | 'tournament';

export interface Horse {
  id: string;
  name: string;
  avatar?: string; // Optional color identifier (hex color)
  currency: Currency;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HorseTransaction {
  id: string;
  horseId: string;
  date: string; // ISO format YYYY-MM-DD
  type: HorseTransactionType;
  result: number; // profit/loss (signed)
  description?: string; // e.g., "WSOP Main Event", "2/5 NLH session"
  createdAt: string;
  // Session fields (for batch logging multiple games)
  isSession?: boolean;
  sessionCount?: number; // number of games in the session
}

export interface HorseStats {
  totalTransactions: number;
  totalProfit: number;
  winRate: number; // % of profitable transactions
  bestResult: number;
  worstResult: number;
  winningTransactions: number;
  losingTransactions: number;
}

export type NewHorse = Omit<Horse, 'id' | 'createdAt' | 'updatedAt'>;
export type NewHorseTransaction = Omit<HorseTransaction, 'id' | 'createdAt'>;

// Chart colors for horses
export const HORSE_COLORS = [
  'rgb(245, 158, 11)', // amber-500
  'rgb(236, 72, 153)', // pink-500
  'rgb(34, 211, 238)', // cyan-400
  'rgb(168, 85, 247)', // purple-500
  'rgb(34, 197, 94)', // green-500
  'rgb(249, 115, 22)', // orange-500
  'rgb(59, 130, 246)', // blue-500
  'rgb(239, 68, 68)', // red-500
];

// Combined horses line color for Dashboard/Analytics
export const HORSES_COMBINED_COLOR = 'rgb(251, 146, 60)'; // orange-400
