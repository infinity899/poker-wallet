import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CashSession,
  Community,
  CommunityMember,
  SessionCommunity,
  Tournament,
  TournamentCommunity,
} from '~/types';
import { dbSessionToSession, dbTournamentToTournament } from '~/composables/useDatabase';

const STORAGE_KEY_COMMUNITIES = 'poker-wallet-communities';
const STORAGE_KEY_MEMBERS = 'poker-wallet-community-members';
const STORAGE_KEY_SESSION_COMMUNITIES = 'poker-wallet-session-communities';
const STORAGE_KEY_TOURNAMENT_COMMUNITIES = 'poker-wallet-tournament-communities';

// Database to frontend mapping for Community
function dbCommunityToCommunity(db: any): Community {
  return {
    id: db.id,
    name: db.name,
    description: db.description ?? undefined,
    avatar: db.avatar ?? undefined,
    visibility: db.visibility,
    inviteCode: db.invite_code ?? undefined,
    currency: db.currency,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// Frontend to database mapping for Community
function communityToDbCommunity(community: Partial<Community>): Record<string, any> {
  const result: Record<string, any> = {};

  if (community.name !== undefined) {
    result.name = community.name;
  }
  if (community.description !== undefined) {
    result.description = community.description;
  }
  if (community.avatar !== undefined) {
    result.avatar = community.avatar;
  }
  if (community.visibility !== undefined) {
    result.visibility = community.visibility;
  }
  if (community.currency !== undefined) {
    result.currency = community.currency;
  }

  return result;
}

// Database to frontend mapping for CommunityMember
function dbMemberToMember(db: any): CommunityMember {
  return {
    id: db.id,
    communityId: db.community_id,
    userId: db.user_id,
    role: db.role,
    status: db.status,
    displayName: db.display_name ?? undefined,
    joinedAt: db.joined_at ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    userEmail: db.user_email ?? undefined,
  };
}

// Database to frontend mapping for SessionCommunity
function dbSessionCommunityToSessionCommunity(db: any): SessionCommunity {
  return {
    id: db.id,
    sessionId: db.session_id,
    communityId: db.community_id,
    createdAt: db.created_at,
  };
}

// Database to frontend mapping for TournamentCommunity
function dbTournamentCommunityToTournamentCommunity(db: any): TournamentCommunity {
  return {
    id: db.id,
    tournamentId: db.tournament_id,
    communityId: db.community_id,
    createdAt: db.created_at,
  };
}

/**
 * LocalStorage adapter for communities (demo mode)
 */
export class LocalStorageCommunityAdapter {
  async getCommunities(): Promise<Community[]> {
    const stored = localStorage.getItem(STORAGE_KEY_COMMUNITIES);
    if (stored) {
      try {
        return JSON.parse(stored);
      }
      catch {
        console.error('Failed to parse localStorage communities');
      }
    }
    return [];
  }

  async saveCommunities(communities: Community[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY_COMMUNITIES, JSON.stringify(communities));
  }

  async getMembers(): Promise<CommunityMember[]> {
    const stored = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (stored) {
      try {
        return JSON.parse(stored);
      }
      catch {
        console.error('Failed to parse localStorage community members');
      }
    }
    return [];
  }

  async saveMembers(members: CommunityMember[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
  }

  async getSessionCommunities(): Promise<SessionCommunity[]> {
    const stored = localStorage.getItem(STORAGE_KEY_SESSION_COMMUNITIES);
    if (stored) {
      try {
        return JSON.parse(stored);
      }
      catch {
        console.error('Failed to parse localStorage session communities');
      }
    }
    return [];
  }

  async saveSessionCommunities(links: SessionCommunity[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY_SESSION_COMMUNITIES, JSON.stringify(links));
  }

  async getTournamentCommunities(): Promise<TournamentCommunity[]> {
    const stored = localStorage.getItem(STORAGE_KEY_TOURNAMENT_COMMUNITIES);
    if (stored) {
      try {
        return JSON.parse(stored);
      }
      catch {
        console.error('Failed to parse localStorage tournament communities');
      }
    }
    return [];
  }

  async saveTournamentCommunities(links: TournamentCommunity[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY_TOURNAMENT_COMMUNITIES, JSON.stringify(links));
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY_COMMUNITIES);
    localStorage.removeItem(STORAGE_KEY_MEMBERS);
    localStorage.removeItem(STORAGE_KEY_SESSION_COMMUNITIES);
    localStorage.removeItem(STORAGE_KEY_TOURNAMENT_COMMUNITIES);
  }
}

/**
 * Supabase adapter for communities (production mode)
 */
export class SupabaseCommunityAdapter {
  constructor(
    private supabase: SupabaseClient,
    private userId: string,
  ) {}

  // ==================== COMMUNITIES ====================

  /**
   * Get all communities the user is a member of (approved)
   */
  async getUserCommunities(): Promise<Community[]> {
    // Get communities where user is an approved member
    const { data: memberData, error: memberError } = await this.supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', this.userId)
      .eq('status', 'approved');

    if (memberError) {
      throw new Error(`Failed to fetch user memberships: ${memberError.message}`);
    }

    if (!memberData || memberData.length === 0) {
      return [];
    }

    const communityIds = memberData.map(m => m.community_id);

    const { data, error } = await this.supabase
      .from('communities')
      .select('*')
      .in('id', communityIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch communities: ${error.message}`);
    }

    return (data || []).map(dbCommunityToCommunity);
  }

  /**
   * Get public communities for discovery (with optional search)
   */
  async getPublicCommunities(search?: string): Promise<Community[]> {
    let query = this.supabase
      .from('communities')
      .select('*')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(50);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch public communities: ${error.message}`);
    }

    return (data || []).map(dbCommunityToCommunity);
  }

  /**
   * Get community by invite code
   */
  async getCommunityByInviteCode(code: string): Promise<Community | null> {
    const { data, error } = await this.supabase
      .from('communities')
      .select('*')
      .eq('invite_code', code)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch community by invite code: ${error.message}`);
    }

    return data ? dbCommunityToCommunity(data) : null;
  }

  /**
   * Get community by ID
   */
  async getCommunityById(id: string): Promise<Community | null> {
    const { data, error } = await this.supabase
      .from('communities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch community: ${error.message}`);
    }

    return data ? dbCommunityToCommunity(data) : null;
  }

  /**
   * Create a new community
   */
  async createCommunity(community: Omit<Community, 'id' | 'createdAt' | 'updatedAt' | 'inviteCode'>): Promise<Community> {
    const dbData = {
      ...communityToDbCommunity(community),
      created_by: this.userId,
    };

    const { data, error } = await this.supabase
      .from('communities')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create community: ${error.message}`);
    }

    return dbCommunityToCommunity(data);
  }

  /**
   * Update a community
   */
  async updateCommunity(id: string, updates: Partial<Community>): Promise<Community> {
    const dbData = communityToDbCommunity(updates);

    const { data, error } = await this.supabase
      .from('communities')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update community: ${error.message}`);
    }

    return dbCommunityToCommunity(data);
  }

  /**
   * Delete a community (only creator can delete)
   */
  async deleteCommunity(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('communities')
      .delete()
      .eq('id', id)
      .eq('created_by', this.userId);

    if (error) {
      throw new Error(`Failed to delete community: ${error.message}`);
    }
  }

  /**
   * Regenerate invite code for a private community
   */
  async regenerateInviteCode(communityId: string): Promise<string> {
    // Generate new code
    const newCode = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    const { data, error } = await this.supabase
      .from('communities')
      .update({ invite_code: newCode })
      .eq('id', communityId)
      .select('invite_code')
      .single();

    if (error) {
      throw new Error(`Failed to regenerate invite code: ${error.message}`);
    }

    return data.invite_code;
  }

  // ==================== MEMBERS ====================

  /**
   * Get members of a community
   */
  async getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    const { data, error } = await this.supabase
      .from('community_members')
      .select('*')
      .eq('community_id', communityId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch community members: ${error.message}`);
    }

    return (data || []).map(dbMemberToMember);
  }

  /**
   * Get all memberships for current user (all statuses)
   */
  async getUserMemberships(): Promise<CommunityMember[]> {
    const { data, error } = await this.supabase
      .from('community_members')
      .select('*')
      .eq('user_id', this.userId);

    if (error) {
      throw new Error(`Failed to fetch user memberships: ${error.message}`);
    }

    return (data || []).map(dbMemberToMember);
  }

  /**
   * Get pending requests for communities where user is admin
   */
  async getPendingRequests(): Promise<CommunityMember[]> {
    // First get communities where user is admin
    const { data: adminCommunities } = await this.supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', this.userId)
      .eq('role', 'admin')
      .eq('status', 'approved');

    if (!adminCommunities || adminCommunities.length === 0) {
      return [];
    }

    const communityIds = adminCommunities.map(c => c.community_id);

    const { data, error } = await this.supabase
      .from('community_members')
      .select('*')
      .in('community_id', communityIds)
      .eq('status', 'pending');

    if (error) {
      throw new Error(`Failed to fetch pending requests: ${error.message}`);
    }

    return (data || []).map(dbMemberToMember);
  }

  /**
   * Request to join a community (uses upsert to handle existing records)
   */
  async requestToJoin(communityId: string, displayName?: string): Promise<CommunityMember> {
    const { data, error } = await this.supabase
      .from('community_members')
      .upsert(
        {
          community_id: communityId,
          user_id: this.userId,
          role: 'member',
          status: 'pending',
          display_name: displayName,
        },
        {
          onConflict: 'community_id,user_id',
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to request to join: ${error.message}`);
    }

    return dbMemberToMember(data);
  }

  /**
   * Add the creator as an admin member (uses upsert to handle if record already exists)
   */
  async addCreatorAsAdmin(communityId: string, displayName?: string): Promise<CommunityMember> {
    const { data, error } = await this.supabase
      .from('community_members')
      .upsert(
        {
          community_id: communityId,
          user_id: this.userId,
          role: 'admin',
          status: 'approved',
          display_name: displayName,
          joined_at: new Date().toISOString(),
        },
        {
          onConflict: 'community_id,user_id',
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add creator as admin: ${error.message}`);
    }

    return dbMemberToMember(data);
  }

  /**
   * Approve a membership request (admin only)
   */
  async approveMember(membershipId: string): Promise<CommunityMember> {
    const { data, error } = await this.supabase
      .from('community_members')
      .update({
        status: 'approved',
        joined_at: new Date().toISOString(),
      })
      .eq('id', membershipId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to approve member: ${error.message}`);
    }

    return dbMemberToMember(data);
  }

  /**
   * Reject a membership request (admin only)
   */
  async rejectMember(membershipId: string): Promise<void> {
    const { error } = await this.supabase
      .from('community_members')
      .update({ status: 'rejected' })
      .eq('id', membershipId);

    if (error) {
      throw new Error(`Failed to reject member: ${error.message}`);
    }
  }

  /**
   * Remove a member from community (admin only, or self)
   */
  async removeMember(membershipId: string): Promise<void> {
    const { error } = await this.supabase
      .from('community_members')
      .delete()
      .eq('id', membershipId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  /**
   * Update member display name
   */
  async updateMemberDisplayName(membershipId: string, displayName: string): Promise<CommunityMember> {
    const { data, error } = await this.supabase
      .from('community_members')
      .update({ display_name: displayName })
      .eq('id', membershipId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update display name: ${error.message}`);
    }

    return dbMemberToMember(data);
  }

  // ==================== SESSION LINKS ====================

  /**
   * Get all session-community links for communities user is a member of
   */
  async getSessionCommunities(): Promise<SessionCommunity[]> {
    // Get communities user is a member of
    const { data: memberData } = await this.supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', this.userId)
      .eq('status', 'approved');

    if (!memberData || memberData.length === 0) {
      return [];
    }

    const communityIds = memberData.map(m => m.community_id);

    const { data, error } = await this.supabase
      .from('session_communities')
      .select('*')
      .in('community_id', communityIds);

    if (error) {
      throw new Error(`Failed to fetch session communities: ${error.message}`);
    }

    return (data || []).map(dbSessionCommunityToSessionCommunity);
  }

  /**
   * Link a session to a community
   */
  async linkSession(sessionId: string, communityId: string): Promise<SessionCommunity> {
    const { data, error } = await this.supabase
      .from('session_communities')
      .insert({
        session_id: sessionId,
        community_id: communityId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to link session: ${error.message}`);
    }

    return dbSessionCommunityToSessionCommunity(data);
  }

  /**
   * Unlink a session from a community
   */
  async unlinkSession(sessionId: string, communityId: string): Promise<void> {
    const { error } = await this.supabase
      .from('session_communities')
      .delete()
      .eq('session_id', sessionId)
      .eq('community_id', communityId);

    if (error) {
      throw new Error(`Failed to unlink session: ${error.message}`);
    }
  }

  // ==================== TOURNAMENT LINKS ====================

  /**
   * Get all tournament-community links for communities user is a member of
   */
  async getTournamentCommunities(): Promise<TournamentCommunity[]> {
    // Get communities user is a member of
    const { data: memberData } = await this.supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', this.userId)
      .eq('status', 'approved');

    if (!memberData || memberData.length === 0) {
      return [];
    }

    const communityIds = memberData.map(m => m.community_id);

    const { data, error } = await this.supabase
      .from('tournament_communities')
      .select('*')
      .in('community_id', communityIds);

    if (error) {
      throw new Error(`Failed to fetch tournament communities: ${error.message}`);
    }

    return (data || []).map(dbTournamentCommunityToTournamentCommunity);
  }

  /**
   * Link a tournament to a community
   */
  async linkTournament(tournamentId: string, communityId: string): Promise<TournamentCommunity> {
    const { data, error } = await this.supabase
      .from('tournament_communities')
      .insert({
        tournament_id: tournamentId,
        community_id: communityId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to link tournament: ${error.message}`);
    }

    return dbTournamentCommunityToTournamentCommunity(data);
  }

  /**
   * Unlink a tournament from a community
   */
  async unlinkTournament(tournamentId: string, communityId: string): Promise<void> {
    const { error } = await this.supabase
      .from('tournament_communities')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('community_id', communityId);

    if (error) {
      throw new Error(`Failed to unlink tournament: ${error.message}`);
    }
  }

  // ==================== COMMUNITY DATA AGGREGATION ====================

  /**
   * Fetch sessions linked to a community (from all members)
   */
  async getCommunitySessions(communityId: string): Promise<CashSession[]> {
    // First get session IDs linked to this community
    const { data: links, error: linksError } = await this.supabase
      .from('session_communities')
      .select('session_id')
      .eq('community_id', communityId);

    if (linksError) {
      throw new Error(`Failed to fetch session links: ${linksError.message}`);
    }

    if (!links || links.length === 0) {
      return [];
    }

    const sessionIds = links.map(l => l.session_id);

    // Fetch sessions without user_id filter (to get all members' sessions)
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .in('id', sessionIds)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch community sessions: ${error.message}`);
    }

    return (data || []).map(dbSessionToSession);
  }

  /**
   * Fetch tournaments linked to a community (from all members)
   */
  async getCommunityTournaments(communityId: string): Promise<Tournament[]> {
    // First get tournament IDs linked to this community
    const { data: links, error: linksError } = await this.supabase
      .from('tournament_communities')
      .select('tournament_id')
      .eq('community_id', communityId);

    if (linksError) {
      throw new Error(`Failed to fetch tournament links: ${linksError.message}`);
    }

    if (!links || links.length === 0) {
      return [];
    }

    const tournamentIds = links.map(l => l.tournament_id);

    // Fetch tournaments without user_id filter (to get all members' tournaments)
    const { data, error } = await this.supabase
      .from('tournaments')
      .select('*')
      .in('id', tournamentIds)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch community tournaments: ${error.message}`);
    }

    return (data || []).map(dbTournamentToTournament);
  }
}

/**
 * Create a community adapter based on the current mode
 */
export function createCommunityAdapter(
  isDemoMode: boolean,
  supabase?: SupabaseClient,
  userId?: string,
): LocalStorageCommunityAdapter | SupabaseCommunityAdapter {
  if (isDemoMode) {
    return new LocalStorageCommunityAdapter();
  }

  if (!supabase || !userId) {
    throw new Error('Supabase client and userId required for database mode');
  }

  return new SupabaseCommunityAdapter(supabase, userId);
}

export {
  STORAGE_KEY_COMMUNITIES,
  STORAGE_KEY_MEMBERS,
  STORAGE_KEY_SESSION_COMMUNITIES,
  STORAGE_KEY_TOURNAMENT_COMMUNITIES,
};
