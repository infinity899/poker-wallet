import type { Currency, SessionType } from './session';

export interface Tournament {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  type: SessionType;
  currency: Currency;
  buyIn: number;
  fee: number; // rake/fees separate from buy-in
  entries: number; // 0 = single entry, 1+ = re-entries/re-buys
  winnings: number; // total prize won (0 if busted)
  name: string;
  venue?: string; // for live tournaments
  site?: string; // for online tournaments
  fieldSize?: number;
  finishPosition?: number;
  cashed?: boolean; // explicit ITM flag (winnings > 0 doesn't always mean ITM with bounties)
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TournamentStats {
  totalTournaments: number;
  totalBuyIns: number; // includes fees and re-entries
  totalWinnings: number;
  totalProfit: number;
  roi: number; // % return on investment
  avgBuyIn: number;
  avgPrize: number;
  itm: number; // in the money count
  itmPercentage: number;
  avgFinish: number;
  bestFinish: number;
  avgFieldSize: number;
}

export type NewTournament = Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>;

// Computed derived values
export function calculateTournamentResult(tournament: Tournament): number {
  const totalCost = (tournament.buyIn + tournament.fee) * (tournament.entries + 1);
  return tournament.winnings - totalCost;
}

export function calculateTournamentROI(tournament: Tournament): number {
  const totalCost = (tournament.buyIn + tournament.fee) * (tournament.entries + 1);
  if (totalCost === 0) {
    return 0;
  }
  return ((tournament.winnings - totalCost) / totalCost) * 100;
}
