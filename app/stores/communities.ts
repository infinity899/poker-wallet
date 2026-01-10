import type { SupabaseCommunityAdapter } from '~/adapters/communityAdapter';
import type { CashSession, Community, CommunityMember, CommunityMemberStats, CommunityStats, NewCommunity, Result, SessionCommunity, Tournament, TournamentCommunity } from '~/types';
import { defineStore } from 'pinia';
import { createCommunityAdapter, LocalStorageCommunityAdapter } from '~/adapters/communityAdapter';
import { useTypedSupabaseClient } from '~/composables/useTypedSupabase';

export const useCommunitiesStore = defineStore('communities', () => {
  const supabase = useTypedSupabaseClient();
  const user = useSupabaseUser();

  // State
  const communities = ref<Community[]>([]);
  const members = ref<CommunityMember[]>([]);
  const sessionCommunities = ref<SessionCommunity[]>([]);
  const tournamentCommunities = ref<TournamentCommunity[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const error = ref<string | null>(null);

  // Current user's active community (selected)
  const activeCommunityId = ref<string | null>(null);

  // Cache for community-wide sessions/tournaments (from all members)
  const communitySessionsCache = ref<Map<string, CashSession[]>>(new Map());
  const communityTournamentsCache = ref<Map<string, Tournament[]>>(new Map());

  // Get auth store (lazy to avoid circular dependency)
  const getAuthStore = () => useAuthStore();

  // Check if we're in demo mode
  const isDemoMode = computed(() => getAuthStore().isDemoMode);

  // Get current user ID
  const currentUserId = computed(() => {
    if (isDemoMode.value) {
      return 'demo-user';
    }
    return user.value?.sub || 'demo-user';
  });

  // Get adapter
  function getAdapter(): LocalStorageCommunityAdapter | SupabaseCommunityAdapter {
    return createCommunityAdapter(isDemoMode.value, supabase, user.value?.sub);
  }

  // Getters
  const sortedCommunities = computed(() => {
    return [...communities.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

  // Communities user is a member of (approved)
  const myCommunities = computed(() => {
    const myMemberCommunityIds = members.value
      .filter(m => m.userId === currentUserId.value && m.status === 'approved')
      .map(m => m.communityId);
    return communities.value.filter(c => myMemberCommunityIds.includes(c.id));
  });

  // Communities user created/owns
  const ownedCommunities = computed(() => {
    return communities.value.filter(c => c.createdBy === currentUserId.value);
  });

  // Active community object
  const activeCommunity = computed(() => {
    if (!activeCommunityId.value) {
      return null;
    }
    return communities.value.find(c => c.id === activeCommunityId.value) || null;
  });

  // Get members of a specific community
  function getCommunityMembers(communityId: string): CommunityMember[] {
    return members.value
      .filter(m => m.communityId === communityId && m.status === 'approved')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Get pending membership requests for a community
  function getPendingRequests(communityId: string): CommunityMember[] {
    return members.value
      .filter(m => m.communityId === communityId && m.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Check if user is admin of a community
  function isAdmin(communityId: string): boolean {
    const member = members.value.find(
      m => m.communityId === communityId && m.userId === currentUserId.value,
    );
    return member?.role === 'admin' || false;
  }

  // Check if user is a member of a community
  function isMember(communityId: string): boolean {
    return members.value.some(
      m => m.communityId === communityId && m.userId === currentUserId.value && m.status === 'approved',
    );
  }

  // Get session IDs linked to a community
  function getSessionIdsForCommunity(communityId: string): string[] {
    return sessionCommunities.value
      .filter(sc => sc.communityId === communityId)
      .map(sc => sc.sessionId);
  }

  // Get tournament IDs linked to a community
  function getTournamentIdsForCommunity(communityId: string): string[] {
    return tournamentCommunities.value
      .filter(tc => tc.communityId === communityId)
      .map(tc => tc.tournamentId);
  }

  // Get cached sessions for a community (from all members)
  function getCommunitySessions(communityId: string): CashSession[] {
    return communitySessionsCache.value.get(communityId) || [];
  }

  // Get cached tournaments for a community (from all members)
  function getCommunityTournaments(communityId: string): Tournament[] {
    return communityTournamentsCache.value.get(communityId) || [];
  }

  // Get community stats (aggregated from sessions/tournaments from ALL members)
  function getCommunityStats(communityId: string): CommunityStats {
    const communityMembersList = getCommunityMembers(communityId);

    // Use cached data from all members (fetched via fetchCommunityData)
    const communitySessions = getCommunitySessions(communityId);
    const communityTournaments = getCommunityTournaments(communityId);

    const sessionProfit = communitySessions.reduce((sum, s) => sum + s.result, 0);
    const totalDuration = communitySessions.reduce((sum, s) => sum + s.duration, 0);

    const tournamentProfit = communityTournaments.reduce((sum, t) => {
      const cost = (t.buyIn + t.fee) * (t.entries + 1);
      return sum + (t.winnings - cost);
    }, 0);

    const totalSessions = communitySessions.length;
    const totalTournaments = communityTournaments.length;
    const winningSessions = communitySessions.filter(s => s.result > 0).length;
    const winningTournaments = communityTournaments.filter(t => t.winnings > (t.buyIn + t.fee) * (t.entries + 1)).length;
    const totalEntries = totalSessions + totalTournaments;
    const winRate = totalEntries > 0 ? ((winningSessions + winningTournaments) / totalEntries) * 100 : 0;
    const totalHours = totalDuration / 60;
    const hourlyRate = totalHours > 0 ? sessionProfit / totalHours : 0;

    // Calculate best/worst results
    const sessionResults = communitySessions.map(s => s.result);
    const tournamentResults = communityTournaments.map((t) => {
      const cost = (t.buyIn + t.fee) * (t.entries + 1);
      return t.winnings - cost;
    });
    const allResults = [...sessionResults, ...tournamentResults];

    return {
      totalMembers: communityMembersList.length,
      totalProfit: sessionProfit + tournamentProfit,
      totalSessions,
      totalTournaments,
      winRate,
      hourlyRate,
      totalHours,
      bestResult: allResults.length > 0 ? Math.max(...allResults) : 0,
      worstResult: allResults.length > 0 ? Math.min(...allResults) : 0,
    };
  }

  // Get stats for a specific member in a community
  function getMemberStats(communityId: string, memberId: string): CommunityMemberStats {
    const member = members.value.find(m => m.id === memberId);

    if (!member) {
      return {
        memberId,
        userId: '',
        displayName: 'Unknown',
        totalProfit: 0,
        totalSessions: 0,
        totalTournaments: 0,
        winRate: 0,
        hourlyRate: 0,
        totalHours: 0,
        bestResult: 0,
        worstResult: 0,
      };
    }

    // Use cached community data and filter by member's userId
    const communitySessions = getCommunitySessions(communityId);
    const communityTournaments = getCommunityTournaments(communityId);

    const memberSessions = communitySessions.filter(s => s.userId === member.userId);
    const memberTournaments = communityTournaments.filter(t => t.userId === member.userId);

    const sessionResults = memberSessions.map(s => s.result);
    const tournamentResults = memberTournaments.map((t) => {
      const cost = (t.buyIn + t.fee) * (t.entries + 1);
      return t.winnings - cost;
    });
    const allResults = [...sessionResults, ...tournamentResults];

    const totalProfit = allResults.reduce((sum, r) => sum + r, 0);
    const totalDuration = memberSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalHours = totalDuration / 60;
    const winningEntries = allResults.filter(r => r > 0).length;
    const winRate = allResults.length > 0 ? (winningEntries / allResults.length) * 100 : 0;
    const sessionProfit = memberSessions.reduce((sum, s) => sum + s.result, 0);
    const hourlyRate = totalHours > 0 ? sessionProfit / totalHours : 0;

    return {
      memberId: member.id,
      userId: member.userId,
      displayName: member.displayName || member.userEmail?.split('@')[0] || 'Member',
      totalProfit,
      totalSessions: memberSessions.length,
      totalTournaments: memberTournaments.length,
      winRate,
      hourlyRate,
      totalHours,
      bestResult: allResults.length > 0 ? Math.max(...allResults) : 0,
      worstResult: allResults.length > 0 ? Math.min(...allResults) : 0,
    };
  }

  // Get cumulative profit data for chart (for a single member or all)
  function getCumulativeProfitData(communityId: string, memberId?: string) {
    // Use cached community data from all members
    const communitySessions = getCommunitySessions(communityId);
    const communityTournaments = getCommunityTournaments(communityId);

    let sessions = communitySessions;
    let tournaments = communityTournaments;

    if (memberId) {
      const member = members.value.find(m => m.id === memberId);
      if (member) {
        sessions = sessions.filter(s => s.userId === member.userId);
        tournaments = tournaments.filter(t => t.userId === member.userId);
      }
    }

    // Combine and sort by date
    const entries: Array<{ date: string; result: number }> = [
      ...sessions.map(s => ({ date: s.date, result: s.result })),
      ...tournaments.map((t) => {
        const cost = (t.buyIn + t.fee) * (t.entries + 1);
        return { date: t.date, result: t.winnings - cost };
      }),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let cumulative = 0;
    return entries.map((entry) => {
      cumulative += entry.result;
      return {
        date: entry.date,
        profit: cumulative,
        result: entry.result,
      };
    });
  }

  // Get per-member cumulative profit data for chart (separate line for each member)
  function getPerMemberCumulativeProfitData(communityId: string) {
    const communityMembersList = getCommunityMembers(communityId);
    const communitySessions = getCommunitySessions(communityId);
    const communityTournaments = getCommunityTournaments(communityId);

    // Collect all entries with member info
    interface EntryWithMember { date: string; result: number; userId: string }
    const allEntries: EntryWithMember[] = [
      ...communitySessions.map(s => ({
        date: s.date,
        result: s.result,
        userId: s.userId || '',
      })),
      ...communityTournaments.map((t) => {
        const cost = (t.buyIn + t.fee) * (t.entries + 1);
        return {
          date: t.date,
          result: t.winnings - cost,
          userId: t.userId || '',
        };
      }),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Get unique dates
    const allDates = [...new Set(allEntries.map(e => e.date))].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    // Calculate cumulative per member
    const memberCumulatives: Map<string, number> = new Map();
    const memberData: Map<string, Array<{ date: string; profit: number }>> = new Map();

    // Initialize
    for (const member of communityMembersList) {
      memberCumulatives.set(member.userId, 0);
      memberData.set(member.userId, []);
    }

    // Process entries by date
    for (const date of allDates) {
      const dateEntries = allEntries.filter(e => e.date === date);

      // Update each member's cumulative
      for (const entry of dateEntries) {
        const current = memberCumulatives.get(entry.userId) || 0;
        memberCumulatives.set(entry.userId, current + entry.result);
      }

      // Record each member's cumulative at this date
      for (const member of communityMembersList) {
        const data = memberData.get(member.userId) || [];
        data.push({
          date,
          profit: memberCumulatives.get(member.userId) || 0,
        });
        memberData.set(member.userId, data);
      }
    }

    // Return data grouped by member
    return communityMembersList.map((member) => {
      const data = memberData.get(member.userId) || [];
      return {
        memberId: member.id,
        userId: member.userId,
        displayName: member.displayName || member.userEmail?.split('@')[0] || 'Member',
        data,
      };
    });
  }

  // Helper to save state for localStorage adapter
  async function saveLocalStorageState() {
    const adapter = getAdapter();
    if (adapter instanceof LocalStorageCommunityAdapter) {
      await adapter.saveCommunities(communities.value);
      await adapter.saveMembers(members.value);
      await adapter.saveSessionCommunities(sessionCommunities.value);
      await adapter.saveTournamentCommunities(tournamentCommunities.value);
    }
  }

  // Actions
  async function initialize(): Promise<void> {
    if (initialized.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const authStore = getAuthStore();
      await authStore.waitForSettings();

      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        // Load all data from localStorage
        const [communitiesData, membersData, sessionCommunitiesData, tournamentCommunitiesData] = await Promise.all([
          adapter.getCommunities(),
          adapter.getMembers(),
          adapter.getSessionCommunities(),
          adapter.getTournamentCommunities(),
        ]);

        communities.value = communitiesData;
        members.value = membersData;
        sessionCommunities.value = sessionCommunitiesData;
        tournamentCommunities.value = tournamentCommunitiesData;
      }
      else {
        // SupabaseCommunityAdapter
        const [communitiesData, membersData, sessionCommunitiesData, tournamentCommunitiesData] = await Promise.all([
          adapter.getUserCommunities(),
          adapter.getUserMemberships(),
          adapter.getSessionCommunities(),
          adapter.getTournamentCommunities(),
        ]);

        communities.value = communitiesData;
        members.value = membersData;
        sessionCommunities.value = sessionCommunitiesData;
        tournamentCommunities.value = tournamentCommunitiesData;
      }

      // Set active community to first owned/member community
      const firstCommunity = myCommunities.value[0] || ownedCommunities.value[0];
      if (firstCommunity) {
        activeCommunityId.value = firstCommunity.id;
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load communities data';
      error.value = message;
      console.error('Failed to initialize communities:', e);
    }
    finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function reload(): Promise<void> {
    initialized.value = false;
    communities.value = [];
    members.value = [];
    sessionCommunities.value = [];
    tournamentCommunities.value = [];
    communitySessionsCache.value.clear();
    communityTournamentsCache.value.clear();
    error.value = null;
    await initialize();
  }

  // Fetch community data (sessions/tournaments from all members)
  async function fetchCommunityData(communityId: string): Promise<Result<void>> {
    try {
      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        // In demo mode, use local session/tournament stores
        const sessionsStore = useSessionsStore();
        const tournamentsStore = useTournamentsStore();

        const sessionIds = getSessionIdsForCommunity(communityId);
        const tournamentIds = getTournamentIdsForCommunity(communityId);

        // Filter from user's data (demo mode assumes single user)
        const sessions = sessionsStore.sessions.filter(s => sessionIds.includes(s.id));
        const tournaments = tournamentsStore.tournaments.filter(t => tournamentIds.includes(t.id));

        communitySessionsCache.value.set(communityId, sessions);
        communityTournamentsCache.value.set(communityId, tournaments);
      }
      else {
        // Fetch from Supabase (all members' sessions/tournaments)
        const [sessions, tournaments] = await Promise.all([
          adapter.getCommunitySessions(communityId),
          adapter.getCommunityTournaments(communityId),
        ]);

        communitySessionsCache.value.set(communityId, sessions);
        communityTournamentsCache.value.set(communityId, tournaments);
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch community data';
      return { success: false, error: new Error(message) };
    }
  }

  // Community CRUD
  async function createCommunity(data: Omit<NewCommunity, 'createdBy'>): Promise<Result<Community>> {
    try {
      const adapter = getAdapter();
      const authStore = getAuthStore();

      let createdCommunity: Community;

      if (adapter instanceof LocalStorageCommunityAdapter) {
        createdCommunity = {
          id: crypto.randomUUID(),
          ...data,
          createdBy: currentUserId.value,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        communities.value.push(createdCommunity);

        // Auto-add creator as admin member
        const newMember: CommunityMember = {
          id: crypto.randomUUID(),
          communityId: createdCommunity.id,
          userId: currentUserId.value,
          displayName: authStore.currentUser?.email?.split('@')[0] || 'Owner',
          userEmail: authStore.currentUser?.email,
          role: 'admin',
          status: 'approved',
          joinedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        members.value.push(newMember);

        await saveLocalStorageState();
      }
      else {
        createdCommunity = await adapter.createCommunity(data);
        communities.value.push(createdCommunity);

        // Add creator as admin member (uses upsert to handle duplicates)
        const memberResult = await adapter.addCreatorAsAdmin(createdCommunity.id, authStore.currentUser?.email?.split('@')[0]);
        members.value.push(memberResult);
      }

      // Set as active community
      activeCommunityId.value = createdCommunity.id;

      return { success: true, data: createdCommunity };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create community';
      return { success: false, error: new Error(message) };
    }
  }

  async function updateCommunity(id: string, updates: Partial<Omit<Community, 'id' | 'createdBy'>>): Promise<Result<Community>> {
    try {
      const index = communities.value.findIndex(c => c.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Community not found') };
      }

      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        const updated = {
          ...communities.value[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        communities.value[index] = updated;
        await saveLocalStorageState();
        return { success: true, data: updated };
      }
      else {
        const updated = await adapter.updateCommunity(id, updates);
        communities.value[index] = updated;
        return { success: true, data: updated };
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update community';
      return { success: false, error: new Error(message) };
    }
  }

  async function deleteCommunity(id: string): Promise<Result<void>> {
    try {
      const index = communities.value.findIndex(c => c.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Community not found') };
      }

      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        communities.value.splice(index, 1);
        members.value = members.value.filter(m => m.communityId !== id);
        sessionCommunities.value = sessionCommunities.value.filter(sc => sc.communityId !== id);
        tournamentCommunities.value = tournamentCommunities.value.filter(tc => tc.communityId !== id);
        await saveLocalStorageState();
      }
      else {
        await adapter.deleteCommunity(id);
        communities.value.splice(index, 1);
        members.value = members.value.filter(m => m.communityId !== id);
        sessionCommunities.value = sessionCommunities.value.filter(sc => sc.communityId !== id);
        tournamentCommunities.value = tournamentCommunities.value.filter(tc => tc.communityId !== id);
      }

      // Clear active if deleted
      if (activeCommunityId.value === id) {
        activeCommunityId.value = myCommunities.value[0]?.id || null;
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete community';
      return { success: false, error: new Error(message) };
    }
  }

  function getCommunityById(id: string): Community | undefined {
    return communities.value.find(c => c.id === id);
  }

  function setActiveCommunity(id: string | null) {
    activeCommunityId.value = id;
  }

  // Membership actions
  async function requestToJoin(communityId: string): Promise<Result<CommunityMember>> {
    try {
      // Check if already a member or has pending request
      const existing = members.value.find(
        m => m.communityId === communityId && m.userId === currentUserId.value,
      );
      if (existing) {
        return { success: false, error: new Error('Already requested or member') };
      }

      const adapter = getAdapter();
      const authStore = getAuthStore();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        const newMember: CommunityMember = {
          id: crypto.randomUUID(),
          communityId,
          userId: currentUserId.value,
          displayName: authStore.currentUser?.email?.split('@')[0] || 'User',
          userEmail: authStore.currentUser?.email,
          role: 'member',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        members.value.push(newMember);
        await saveLocalStorageState();
        return { success: true, data: newMember };
      }
      else {
        const member = await adapter.requestToJoin(communityId, authStore.currentUser?.email?.split('@')[0]);
        members.value.push(member);
        return { success: true, data: member };
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to request membership';
      return { success: false, error: new Error(message) };
    }
  }

  async function approveMember(memberId: string): Promise<Result<CommunityMember>> {
    try {
      const index = members.value.findIndex(m => m.id === memberId);
      if (index === -1) {
        return { success: false, error: new Error('Member not found') };
      }

      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        const updated = {
          ...members.value[index],
          status: 'approved' as const,
          joinedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        members.value[index] = updated;
        await saveLocalStorageState();
        return { success: true, data: updated };
      }
      else {
        const updated = await adapter.approveMember(memberId);
        members.value[index] = updated;
        return { success: true, data: updated };
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to approve member';
      return { success: false, error: new Error(message) };
    }
  }

  async function rejectMember(memberId: string): Promise<Result<void>> {
    try {
      const index = members.value.findIndex(m => m.id === memberId);
      if (index === -1) {
        return { success: false, error: new Error('Member not found') };
      }

      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        members.value.splice(index, 1);
        await saveLocalStorageState();
      }
      else {
        await adapter.rejectMember(memberId);
        members.value.splice(index, 1);
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to reject member';
      return { success: false, error: new Error(message) };
    }
  }

  async function removeMember(memberId: string): Promise<Result<void>> {
    try {
      const index = members.value.findIndex(m => m.id === memberId);
      if (index === -1) {
        return { success: false, error: new Error('Member not found') };
      }

      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        members.value.splice(index, 1);
        await saveLocalStorageState();
      }
      else {
        await adapter.removeMember(memberId);
        members.value.splice(index, 1);
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to remove member';
      return { success: false, error: new Error(message) };
    }
  }

  async function leaveCommunity(communityId: string): Promise<Result<void>> {
    try {
      const member = members.value.find(
        m => m.communityId === communityId && m.userId === currentUserId.value,
      );
      if (!member) {
        return { success: false, error: new Error('Not a member') };
      }

      // Can't leave if you're the only admin
      const admins = members.value.filter(
        m => m.communityId === communityId && m.role === 'admin' && m.status === 'approved',
      );
      if (admins.length === 1 && member.role === 'admin') {
        return { success: false, error: new Error('Cannot leave: you are the only admin') };
      }

      return await removeMember(member.id);
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to leave community';
      return { success: false, error: new Error(message) };
    }
  }

  // Session/Tournament linking
  async function linkSession(sessionId: string, communityId: string): Promise<Result<SessionCommunity>> {
    try {
      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        const link: SessionCommunity = {
          id: crypto.randomUUID(),
          sessionId,
          communityId,
          createdAt: new Date().toISOString(),
        };
        sessionCommunities.value.push(link);
        await saveLocalStorageState();
        return { success: true, data: link };
      }
      else {
        const link = await adapter.linkSession(sessionId, communityId);
        sessionCommunities.value.push(link);
        return { success: true, data: link };
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to link session';
      return { success: false, error: new Error(message) };
    }
  }

  async function unlinkSession(sessionId: string, communityId: string): Promise<Result<void>> {
    try {
      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        sessionCommunities.value = sessionCommunities.value.filter(
          sc => !(sc.sessionId === sessionId && sc.communityId === communityId),
        );
        await saveLocalStorageState();
      }
      else {
        await adapter.unlinkSession(sessionId, communityId);
        sessionCommunities.value = sessionCommunities.value.filter(
          sc => !(sc.sessionId === sessionId && sc.communityId === communityId),
        );
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to unlink session';
      return { success: false, error: new Error(message) };
    }
  }

  async function linkTournament(tournamentId: string, communityId: string): Promise<Result<TournamentCommunity>> {
    try {
      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        const link: TournamentCommunity = {
          id: crypto.randomUUID(),
          tournamentId,
          communityId,
          createdAt: new Date().toISOString(),
        };
        tournamentCommunities.value.push(link);
        await saveLocalStorageState();
        return { success: true, data: link };
      }
      else {
        const link = await adapter.linkTournament(tournamentId, communityId);
        tournamentCommunities.value.push(link);
        return { success: true, data: link };
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to link tournament';
      return { success: false, error: new Error(message) };
    }
  }

  async function unlinkTournament(tournamentId: string, communityId: string): Promise<Result<void>> {
    try {
      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        tournamentCommunities.value = tournamentCommunities.value.filter(
          tc => !(tc.tournamentId === tournamentId && tc.communityId === communityId),
        );
        await saveLocalStorageState();
      }
      else {
        await adapter.unlinkTournament(tournamentId, communityId);
        tournamentCommunities.value = tournamentCommunities.value.filter(
          tc => !(tc.tournamentId === tournamentId && tc.communityId === communityId),
        );
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to unlink tournament';
      return { success: false, error: new Error(message) };
    }
  }

  // Join by invite code
  async function joinByInviteCode(code: string, displayName?: string): Promise<Result<{ community: Community; membership: CommunityMember }>> {
    try {
      const adapter = getAdapter();
      const authStore = getAuthStore();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        // Demo mode: find community by invite code
        const community = communities.value.find(c => c.inviteCode === code);
        if (!community) {
          return { success: false, error: new Error('Invalid invite code') };
        }

        // Check if already a member
        const existing = members.value.find(
          m => m.communityId === community.id && m.userId === currentUserId.value,
        );
        if (existing) {
          return { success: false, error: new Error('Already a member of this community') };
        }

        const newMember: CommunityMember = {
          id: crypto.randomUUID(),
          communityId: community.id,
          userId: currentUserId.value,
          displayName: displayName || authStore.currentUser?.email?.split('@')[0] || 'User',
          userEmail: authStore.currentUser?.email,
          role: 'member',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        members.value.push(newMember);
        await saveLocalStorageState();

        return { success: true, data: { community, membership: newMember } };
      }
      else {
        // Production mode
        const community = await adapter.getCommunityByInviteCode(code);
        if (!community) {
          return { success: false, error: new Error('Invalid invite code') };
        }

        const membership = await adapter.requestToJoin(community.id, displayName || authStore.currentUser?.email?.split('@')[0]);
        members.value.push(membership);

        // Add community to local state if not already there
        if (!communities.value.find(c => c.id === community.id)) {
          communities.value.push(community);
        }

        return { success: true, data: { community, membership } };
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to join by invite code';
      return { success: false, error: new Error(message) };
    }
  }

  // Search public communities for discovery
  async function searchPublicCommunities(search?: string): Promise<Result<Community[]>> {
    try {
      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        // Demo mode: filter local communities
        let results = communities.value.filter(c => c.visibility === 'public');
        if (search) {
          const query = search.toLowerCase();
          results = results.filter(c => c.name.toLowerCase().includes(query));
        }
        return { success: true, data: results };
      }
      else {
        const results = await adapter.getPublicCommunities(search);
        return { success: true, data: results };
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to search communities';
      return { success: false, error: new Error(message) };
    }
  }

  // Get community by invite code
  async function getCommunityByInviteCode(code: string): Promise<Result<Community | null>> {
    try {
      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        const community = communities.value.find(c => c.inviteCode === code);
        return { success: true, data: community || null };
      }
      else {
        const community = await adapter.getCommunityByInviteCode(code);
        return { success: true, data: community };
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to find community';
      return { success: false, error: new Error(message) };
    }
  }

  // Batch update session communities
  async function updateSessionCommunities(sessionId: string, communityIds: string[]): Promise<Result<void>> {
    try {
      const currentIds = sessionCommunities.value
        .filter(sc => sc.sessionId === sessionId)
        .map(sc => sc.communityId);

      const toAdd = communityIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !communityIds.includes(id));

      for (const id of toRemove) {
        await unlinkSession(sessionId, id);
      }

      for (const id of toAdd) {
        await linkSession(sessionId, id);
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update session communities';
      return { success: false, error: new Error(message) };
    }
  }

  // Batch update tournament communities
  async function updateTournamentCommunities(tournamentId: string, communityIds: string[]): Promise<Result<void>> {
    try {
      const currentIds = tournamentCommunities.value
        .filter(tc => tc.tournamentId === tournamentId)
        .map(tc => tc.communityId);

      const toAdd = communityIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !communityIds.includes(id));

      for (const id of toRemove) {
        await unlinkTournament(tournamentId, id);
      }

      for (const id of toAdd) {
        await linkTournament(tournamentId, id);
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update tournament communities';
      return { success: false, error: new Error(message) };
    }
  }

  // Fetch community members from server
  async function fetchCommunityMembers(communityId: string): Promise<Result<CommunityMember[]>> {
    try {
      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        const communityMembers = members.value.filter(m => m.communityId === communityId);
        return { success: true, data: communityMembers };
      }
      else {
        const communityMembers = await adapter.getCommunityMembers(communityId);

        // Update local memberships with fetched data
        communityMembers.forEach((member) => {
          const index = members.value.findIndex(m => m.id === member.id);
          if (index >= 0) {
            members.value[index] = member;
          }
          else {
            members.value.push(member);
          }
        });

        return { success: true, data: communityMembers };
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch members';
      return { success: false, error: new Error(message) };
    }
  }

  // Get communities linked to a session
  function getCommunitiesForSession(sessionId: string): string[] {
    return sessionCommunities.value
      .filter(sc => sc.sessionId === sessionId)
      .map(sc => sc.communityId);
  }

  // Get communities linked to a tournament
  function getCommunitiesForTournament(tournamentId: string): string[] {
    return tournamentCommunities.value
      .filter(tc => tc.tournamentId === tournamentId)
      .map(tc => tc.communityId);
  }

  // Clear all data
  async function clearAll(): Promise<Result<void>> {
    try {
      const adapter = getAdapter();

      if (adapter instanceof LocalStorageCommunityAdapter) {
        adapter.clearAll();
      }
      // For Supabase, we'd need to delete all communities which cascades

      communities.value = [];
      members.value = [];
      sessionCommunities.value = [];
      tournamentCommunities.value = [];
      activeCommunityId.value = null;

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to clear data';
      return { success: false, error: new Error(message) };
    }
  }

  return {
    // State
    communities: readonly(communities),
    members: readonly(members),
    sessionCommunities: readonly(sessionCommunities),
    tournamentCommunities: readonly(tournamentCommunities),
    loading: readonly(loading),
    initialized: readonly(initialized),
    error: readonly(error),
    activeCommunityId: readonly(activeCommunityId),

    // Getters
    sortedCommunities,
    myCommunities,
    ownedCommunities,
    activeCommunity,
    currentUserId,
    getCommunityMembers,
    getPendingRequests,
    isAdmin,
    isMember,
    getSessionIdsForCommunity,
    getTournamentIdsForCommunity,
    getCommunityStats,
    getMemberStats,
    getCumulativeProfitData,
    getPerMemberCumulativeProfitData,
    getCommunitySessions,
    getCommunityTournaments,

    // Actions
    initialize,
    reload,
    fetchCommunityData,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    getCommunityById,
    setActiveCommunity,
    requestToJoin,
    approveMember,
    rejectMember,
    removeMember,
    leaveCommunity,
    linkSession,
    unlinkSession,
    linkTournament,
    unlinkTournament,
    joinByInviteCode,
    searchPublicCommunities,
    getCommunityByInviteCode,
    updateSessionCommunities,
    updateTournamentCommunities,
    fetchCommunityMembers,
    getCommunitiesForSession,
    getCommunitiesForTournament,
    clearAll,
  };
});
