import type { CashSession, DbSession, NewCashSession, SessionFilters, SessionStats } from '~/types';
import { defineStore } from 'pinia';
import { dbSessionToSession, sessionToDbSession } from '~/composables/useDatabase';
import { isDateInRange } from '~/composables/useFilters';
import { useTypedSupabaseClient } from '~/composables/useTypedSupabase';
import { DEFAULT_SESSION_FILTERS } from '~/types';
import { calculateSessionStats } from '~/utils/calculations';
import { parseStake } from '~/utils/formatters';

const STORAGE_KEY = 'poker-wallet-sessions';

export const useSessionsStore = defineStore('sessions', () => {
  const supabase = useTypedSupabaseClient();
  const user = useSupabaseUser();

  // State
  const sessions = ref<CashSession[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const filters = ref<SessionFilters>({ ...DEFAULT_SESSION_FILTERS });

  // Get auth store (lazy to avoid circular dependency)
  const getAuthStore = () => useAuthStore();

  // Check if we're in demo mode
  const isDemoMode = computed(() => getAuthStore().isDemoMode);

  // Getters
  const filteredSessions = computed(() => {
    return sessions.value.filter((session) => {
      const f = filters.value;

      // Date range filter
      if (!isDateInRange(session.date, f.dateRange)) {
        return false;
      }

      // Type filter
      if (f.type !== 'all' && session.type !== f.type) {
        return false;
      }

      // Game filter
      if (f.game !== 'all' && session.game !== f.game) {
        return false;
      }

      // Currency filter
      if (f.currency !== 'all' && session.currency !== f.currency) {
        return false;
      }

      // Stakes filter
      if (f.stakes.length > 0 && !f.stakes.includes(session.stake)) {
        return false;
      }

      // Venues filter (check both location and site)
      if (f.venues.length > 0) {
        const venueMatch = session.location
          ? f.venues.includes(session.location)
          : session.site
            ? f.venues.includes(session.site)
            : false;
        if (!venueMatch) {
          return false;
        }
      }

      // Tags filter
      if (f.tags.length > 0) {
        const hasTag = f.tags.some(tag => session.tags.includes(tag));
        if (!hasTag) {
          return false;
        }
      }

      // Profit range filter
      if (f.minProfit !== undefined && session.result < f.minProfit) {
        return false;
      }
      if (f.maxProfit !== undefined && session.result > f.maxProfit) {
        return false;
      }

      // Search query
      if (f.searchQuery && f.searchQuery.length > 0) {
        const query = f.searchQuery.toLowerCase();
        const searchableText = [
          session.location,
          session.site,
          session.notes,
          session.stake,
          session.game,
          ...session.tags,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  });

  const sortedSessions = computed(() => {
    return [...filteredSessions.value].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  });

  const stats = computed<SessionStats>(() => {
    return calculateSessionStats(filteredSessions.value);
  });

  const allStakes = computed(() => {
    const stakes = new Set<string>();
    sessions.value.forEach(s => stakes.add(s.stake));
    return Array.from(stakes).sort((a, b) => {
      const parsedA = parseStake(a);
      const parsedB = parseStake(b);
      if (!parsedA || !parsedB) {
        return 0;
      }
      return parsedA.bigBlind - parsedB.bigBlind;
    });
  });

  const allVenues = computed(() => {
    const venues = new Set<string>();
    sessions.value.forEach((s) => {
      if (s.location) {
        venues.add(s.location);
      }
      if (s.site) {
        venues.add(s.site);
      }
    });
    return Array.from(venues).sort();
  });

  const inProgressSessions = computed(() => {
    return sessions.value.filter(s => s.status === 'in_progress');
  });

  // Actions
  async function initialize() {
    if (initialized.value) {
      return;
    }

    loading.value = true;
    try {
      // Wait for auth store to load user settings before checking isDemoMode
      const authStore = getAuthStore();
      await authStore.waitForSettings();

      // Now isDemoMode will have the correct value
      const demoMode = authStore.isDemoMode;

      if (demoMode) {
        // Demo mode: load from localStorage or mock data
        await loadFromLocalStorage();
      }
      else {
        // Database mode: load from Supabase
        await loadFromDatabase();
      }
    }
    catch (error) {
      console.error('Failed to initialize sessions:', error);
    }
    finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function loadFromLocalStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all sessions have a status (default to 'completed' for existing data)
      sessions.value = parsed.map((s: CashSession) => ({
        ...s,
        status: s.status || 'completed',
      }));
    }
    else {
      // Load from mock data
      const response = await fetch('/data/sessions.json');
      if (response.ok) {
        const data = await response.json();
        // Ensure all sessions have a status
        sessions.value = data.map((s: CashSession) => ({
          ...s,
          status: s.status || 'completed',
        }));
        saveToStorage();
      }
    }
  }

  async function loadFromDatabase() {
    if (!user.value) {
      return;
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.value!.sub)
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to load sessions from database:', error);
      return;
    }

    sessions.value = (data || []).map((row: DbSession) => dbSessionToSession(row));
  }

  // Reload data (useful when switching modes)
  async function reload() {
    initialized.value = false;
    sessions.value = [];
    await initialize();
  }

  function saveToStorage() {
    if (isDemoMode.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.value));
    }
  }

  async function addSession(data: NewCashSession): Promise<CashSession> {
    const now = new Date().toISOString();
    const parsed = parseStake(data.stake);

    if (isDemoMode.value) {
      // Demo mode: save to localStorage
      const session: CashSession = {
        ...data,
        id: crypto.randomUUID(),
        smallBlind: parsed?.smallBlind ?? 0,
        bigBlind: parsed?.bigBlind ?? 0,
        createdAt: now,
        updatedAt: now,
      };

      sessions.value.push(session);
      saveToStorage();
      return session;
    }
    else {
      // Database mode: save to Supabase
      if (!user.value) {
        throw new Error('User not authenticated');
      }

      const dbSession = sessionToDbSession({
        ...data,
        smallBlind: parsed?.smallBlind ?? 0,
        bigBlind: parsed?.bigBlind ?? 0,
      }, user.value!.sub);

      const { data: inserted, error } = await supabase
        .from('sessions')
        .insert(dbSession as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const session = dbSessionToSession(inserted as DbSession);
      sessions.value.push(session);
      return session;
    }
  }

  async function updateSession(id: string, updates: Partial<Omit<CashSession, 'id'>>): Promise<boolean> {
    const index = sessions.value.findIndex(s => s.id === id);
    if (index === -1) {
      return false;
    }

    const current = sessions.value[index]!;
    const parsed = updates.stake ? parseStake(updates.stake) : null;

    if (isDemoMode.value) {
      // Demo mode: update localStorage
      sessions.value[index] = {
        ...current,
        ...updates,
        id: current.id,
        ...(parsed && { smallBlind: parsed.smallBlind, bigBlind: parsed.bigBlind }),
        updatedAt: new Date().toISOString(),
      };

      saveToStorage();
      return true;
    }
    else {
      // Database mode: update Supabase
      if (!user.value) {
        throw new Error('User not authenticated');
      }

      const dbUpdates: Record<string, any> = {};
      if (updates.date !== undefined) {
        dbUpdates.date = updates.date;
      }
      if (updates.startTime !== undefined) {
        dbUpdates.start_time = updates.startTime;
      }
      if (updates.endTime !== undefined) {
        dbUpdates.end_time = updates.endTime;
      }
      if (updates.type !== undefined) {
        dbUpdates.type = updates.type;
      }
      if (updates.currency !== undefined) {
        dbUpdates.currency = updates.currency;
      }
      if (updates.stake !== undefined) {
        dbUpdates.stake = updates.stake;
      }
      if (parsed) {
        dbUpdates.small_blind = parsed.smallBlind;
        dbUpdates.big_blind = parsed.bigBlind;
      }
      if (updates.game !== undefined) {
        dbUpdates.game = updates.game;
      }
      if (updates.result !== undefined) {
        dbUpdates.result = updates.result;
      }
      if (updates.duration !== undefined) {
        dbUpdates.duration = updates.duration;
      }
      if (updates.location !== undefined) {
        dbUpdates.location = updates.location;
      }
      if (updates.site !== undefined) {
        dbUpdates.site = updates.site;
      }
      if (updates.notes !== undefined) {
        dbUpdates.notes = updates.notes;
      }
      if (updates.tags !== undefined) {
        dbUpdates.tags = updates.tags;
      }
      if (updates.status !== undefined) {
        dbUpdates.status = updates.status;
      }
      if (updates.bankrollInitial !== undefined) {
        dbUpdates.bankroll_initial = updates.bankrollInitial;
      }
      if (updates.bankrollFinal !== undefined) {
        dbUpdates.bankroll_final = updates.bankrollFinal;
      }
      if (updates.buyInTotal !== undefined) {
        dbUpdates.buy_in_total = updates.buyInTotal;
      }
      if (updates.cashOutTotal !== undefined) {
        dbUpdates.cash_out_total = updates.cashOutTotal;
      }

      const { data: updated, error } = await supabase
        .from('sessions')
        .update(dbUpdates as any)
        .eq('id', id)
        .eq('user_id', user.value!.sub)
        .select()
        .single();

      if (error) {
        throw error;
      }

      sessions.value[index] = dbSessionToSession(updated as DbSession);
      return true;
    }
  }

  async function deleteSession(id: string): Promise<boolean> {
    const index = sessions.value.findIndex(s => s.id === id);
    if (index === -1) {
      return false;
    }

    if (isDemoMode.value) {
      // Demo mode: delete from localStorage
      sessions.value.splice(index, 1);
      saveToStorage();
      return true;
    }
    else {
      // Database mode: delete from Supabase
      if (!user.value) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.value!.sub);

      if (error) {
        throw error;
      }

      sessions.value.splice(index, 1);
      return true;
    }
  }

  async function deleteSessions(ids: string[]): Promise<number> {
    const initialLength = sessions.value.length;

    if (isDemoMode.value) {
      sessions.value = sessions.value.filter(s => !ids.includes(s.id));
      saveToStorage();
    }
    else {
      if (!user.value) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('sessions')
        .delete()
        .in('id', ids)
        .eq('user_id', user.value!.sub);

      if (error) {
        throw error;
      }

      sessions.value = sessions.value.filter(s => !ids.includes(s.id));
    }

    return initialLength - sessions.value.length;
  }

  function getSessionById(id: string): CashSession | undefined {
    return sessions.value.find(s => s.id === id);
  }

  function setFilters(newFilters: Partial<SessionFilters>) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = { ...DEFAULT_SESSION_FILTERS };
  }

  async function importSessions(importedSessions: CashSession[], replace: boolean = false) {
    if (isDemoMode.value) {
      if (replace) {
        sessions.value = importedSessions;
      }
      else {
        const existingIds = new Set(sessions.value.map(s => s.id));
        const newSessions = importedSessions.filter(s => !existingIds.has(s.id));
        sessions.value.push(...newSessions);
      }
      saveToStorage();
    }
    else {
      // For database mode, insert each session
      if (!user.value) {
        throw new Error('User not authenticated');
      }

      if (replace) {
        // Delete all existing sessions first
        await supabase
          .from('sessions')
          .delete()
          .eq('user_id', user.value!.sub);
        sessions.value = [];
      }

      // Insert new sessions
      for (const session of importedSessions) {
        const dbSession = sessionToDbSession(session, user.value!.sub);
        const { data, error } = await supabase
          .from('sessions')
          .insert(dbSession as any)
          .select()
          .single();

        if (!error && data) {
          sessions.value.push(dbSessionToSession(data as DbSession));
        }
      }
    }
  }

  async function clearAll() {
    if (isDemoMode.value) {
      sessions.value = [];
      saveToStorage();
    }
    else {
      if (!user.value) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('user_id', user.value!.sub);

      if (error) {
        throw error;
      }

      sessions.value = [];
    }
  }

  return {
    // State
    sessions: readonly(sessions),
    loading: readonly(loading),
    initialized: readonly(initialized),
    filters,

    // Getters
    filteredSessions,
    sortedSessions,
    inProgressSessions,
    stats,
    allStakes,
    allVenues,

    // Actions
    initialize,
    reload,
    addSession,
    updateSession,
    deleteSession,
    deleteSessions,
    getSessionById,
    setFilters,
    resetFilters,
    importSessions,
    clearAll,
  };
});
