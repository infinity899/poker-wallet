import type { Currency } from './session';

export type CommunityVisibility = 'public' | 'private';
export type MemberRole = 'admin' | 'member';
export type MemberStatus = 'pending' | 'approved' | 'rejected';

export interface Community {
  id: string;
  name: string;
  description?: string;
  avatar?: string; // Hex color for avatar background
  visibility: CommunityVisibility;
  inviteCode?: string; // For private communities
  currency: Currency;
  createdBy: string; // User ID of creator
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  displayName?: string;
  joinedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated from user profile (join query)
  userEmail?: string;
}

export interface SessionCommunity {
  id: string;
  sessionId: string;
  communityId: string;
  createdAt: string;
}

export interface TournamentCommunity {
  id: string;
  tournamentId: string;
  communityId: string;
  createdAt: string;
}

export interface CommunityStats {
  totalMembers: number;
  totalSessions: number;
  totalTournaments: number;
  totalProfit: number;
  totalHours: number;
  winRate: number;
  hourlyRate: number;
  bestResult: number;
  worstResult: number;
}

export interface CommunityMemberStats {
  memberId: string;
  userId: string;
  displayName: string;
  totalProfit: number;
  totalSessions: number;
  totalTournaments: number;
  winRate: number;
  hourlyRate: number;
  totalHours: number;
  bestResult: number;
  worstResult: number;
}

export interface CommunityMemberWithResults extends CommunityMember {
  stats: CommunityMemberStats;
}

export type NewCommunity = Omit<Community, 'id' | 'createdAt' | 'updatedAt' | 'inviteCode'>;
export type NewCommunityMember = Omit<CommunityMember, 'id' | 'createdAt' | 'updatedAt' | 'joinedAt'>;

// Chart colors for community members (8 distinct colors)
export const COMMUNITY_MEMBER_COLORS = [
  'rgb(16, 185, 129)', // emerald-500 (accent)
  'rgb(59, 130, 246)', // blue-500
  'rgb(168, 85, 247)', // purple-500
  'rgb(245, 158, 11)', // amber-500
  'rgb(236, 72, 153)', // pink-500
  'rgb(34, 211, 238)', // cyan-400
  'rgb(249, 115, 22)', // orange-500
  'rgb(239, 68, 68)', // red-500
];

// Color for combined community total line
export const COMMUNITY_COMBINED_COLOR = 'rgb(16, 185, 129)'; // emerald-500

// Avatar color options for communities
export const COMMUNITY_AVATAR_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#ef4444', // red-500
];
