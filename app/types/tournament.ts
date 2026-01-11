import type { Currency, SessionStatus, SessionType } from './session';

export interface TournamentSiteEntry {
  name: string; // site or venue name
  buyIn?: number;
  fee?: number;
  entries?: number; // re-entries at this site
  bankrollInitial?: number; // starting bankroll at this site
  bankrollFinal?: number; // ending bankroll at this site
}

export interface Tournament {
  id: string;
  userId?: string; // for community aggregation
  communityId?: string; // linked community for result aggregation
  date: string; // ISO format YYYY-MM-DD
  type: SessionType;
  currency: Currency;
  buyIn: number;
  fee: number; // rake/fees separate from buy-in
  entries: number; // 0 = single entry, 1+ = re-entries/re-buys
  winnings: number; // total prize won (0 if busted)
  name: string;
  venue?: string; // for live tournaments (primary venue)
  site?: string; // for online tournaments (primary site)
  sites?: TournamentSiteEntry[]; // additional sites/venues for multi-site sessions
  fieldSize?: number;
  finishPosition?: number;
  cashed?: boolean; // explicit ITM flag (winnings > 0 doesn't always mean ITM with bounties)
  notes?: string;
  tags: string[];
  status: SessionStatus; // in_progress or completed
  createdAt: string;
  updatedAt: string;
  // Session fields (for batch logging multiple tournaments)
  isSession?: boolean;
  sessionCount?: number; // number of tournaments in the session
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
