import type { Currency, GameType, SessionType } from './session';

export interface Venue {
  id: string;
  name: string;
  type: SessionType;
  location?: string; // city, country for live venues
}

export interface Tag {
  id: string;
  name: string;
  color: string; // hex color
}

export interface ReferenceData {
  venues: Venue[];
  tags: Tag[];
  currencies: Currency[];
  gameTypes: GameType[];
}

// Default reference data
export const DEFAULT_CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'RON'];

export const DEFAULT_GAME_TYPES: GameType[] = ['NLH', 'PLO', 'PLO5', 'Mixed'];

export const DEFAULT_VENUES: Venue[] = [
  { id: '1', name: 'Bellagio', type: 'live', location: 'Las Vegas, NV' },
  { id: '2', name: 'Aria', type: 'live', location: 'Las Vegas, NV' },
  { id: '3', name: 'Wynn', type: 'live', location: 'Las Vegas, NV' },
  { id: '4', name: 'Commerce Casino', type: 'live', location: 'Los Angeles, CA' },
  { id: '5', name: 'PokerStars', type: 'online' },
  { id: '6', name: 'GGPoker', type: 'online' },
  { id: '7', name: '888poker', type: 'online' },
  { id: '8', name: 'partypoker', type: 'online' },
  { id: '9', name: 'WPT Global', type: 'online' },
];

export const DEFAULT_TAGS: Tag[] = [
  { id: '1', name: 'Deepstack', color: '#3b82f6' },
  { id: '2', name: 'Turbo', color: '#ef4444' },
  { id: '3', name: 'Good Run', color: '#22c55e' },
  { id: '4', name: 'Bad Beat', color: '#f59e0b' },
  { id: '5', name: 'Soft Table', color: '#8b5cf6' },
  { id: '6', name: 'Tough Table', color: '#64748b' },
  { id: '7', name: 'Tilted', color: '#dc2626' },
  { id: '8', name: 'Shot Take', color: '#0891b2' },
];
