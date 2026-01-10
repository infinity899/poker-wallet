import type { LocalStorageAdapter } from '~/adapters/LocalStorageAdapter';
import type { StorageAdapter } from '~/adapters/types';
import type { CashSession, NewCashSession, Result, SessionFilters, SessionStats } from '~/types';
import { defineStore } from 'pinia';
import { createSessionAdapter } from '~/adapters/sessionAdapter';
import { isDateInRange } from '~/composables/useFilters';
import { useTypedSupabaseClient } from '~/composables/useTypedSupabase';
import { DEFAULT_SESSION_FILTERS } from '~/types';
import { calculateSessionStats } from '~/utils/calculations';
import { parseStake } from '~/utils/formatters';

export const useSessionsStore = defineStore('sessions', () => {
  const supabase = useTypedSupabaseClient();
  const user = useSupabaseUser();

  // State
  const sessions = ref<CashSession[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const filters = ref<SessionFilters>({ ...DEFAULT_SESSION_FILTERS });
  const error = ref<string | null>(null);

  // Get auth store (lazy to avoid circular dependency)
  const getAuthStore = () => useAuthStore();

  // Check if we're in demo mode
  const isDemoMode = computed(() => getAuthStore().isDemoMode);

  // Get the appropriate adapter based on mode
  function getAdapter(): StorageAdapter<CashSession> {
    return createSessionAdapter(
      isDemoMode.value,
      supabase,
      user.value?.sub,
    );
  }

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
    return [...filteredSessions.value].sort((a, b) => {
      // Combine date and startTime for sorting
      const getDateTime = (session: CashSession): number => {
        const dateStr = session.date;
        const timeStr = session.startTime || '00:00';
        // Parse time string (handles both "HH:mm" and "h:mm AM/PM" formats)
        let hours = 0;
        let minutes = 0;
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (match) {
            hours = Number.parseInt(match[1]!, 10);
            minutes = Number.parseInt(match[2]!, 10);
            if (match[3]!.toUpperCase() === 'PM' && hours !== 12) {
              hours += 12;
            }
            if (match[3]!.toUpperCase() === 'AM' && hours === 12) {
              hours = 0;
            }
          }
        }
        else {
          const [h, m] = timeStr.split(':');
          hours = Number.parseInt(h || '0', 10);
          minutes = Number.parseInt(m || '0', 10);
        }
        const date = new Date(dateStr);
        date.setHours(hours, minutes, 0, 0);
        return date.getTime();
      };
      return getDateTime(b) - getDateTime(a);
    });
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
      const data = await adapter.getAll();

      // Ensure all sessions have a status (default to 'completed' for existing data)
      sessions.value = data.map(s => ({
        ...s,
        status: s.status || 'completed',
      }));
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load sessions';
      error.value = message;
      console.error('Failed to initialize sessions:', e);
    }
    finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function reload(): Promise<void> {
    initialized.value = false;
    sessions.value = [];
    error.value = null;
    await initialize();
  }

  async function addSession(data: NewCashSession): Promise<Result<CashSession>> {
    try {
      const parsed = parseStake(data.stake);
      const adapter = getAdapter();

      const sessionData = {
        ...data,
        smallBlind: parsed?.smallBlind ?? 0,
        bigBlind: parsed?.bigBlind ?? 0,
      };

      const session = await adapter.create(sessionData);
      sessions.value.push(session);

      return { success: true, data: session };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add session';
      return { success: false, error: new Error(message) };
    }
  }

  async function updateSession(id: string, updates: Partial<Omit<CashSession, 'id'>>): Promise<Result<CashSession>> {
    try {
      const index = sessions.value.findIndex(s => s.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Session not found') };
      }

      const parsed = updates.stake ? parseStake(updates.stake) : null;
      const adapter = getAdapter();

      const updateData = {
        ...updates,
        ...(parsed && { smallBlind: parsed.smallBlind, bigBlind: parsed.bigBlind }),
      };

      const updated = await adapter.update(id, updateData);
      sessions.value[index] = updated;

      return { success: true, data: updated };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update session';
      return { success: false, error: new Error(message) };
    }
  }

  async function deleteSession(id: string): Promise<Result<void>> {
    try {
      const index = sessions.value.findIndex(s => s.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Session not found') };
      }

      const adapter = getAdapter();
      await adapter.delete(id);
      sessions.value.splice(index, 1);

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete session';
      return { success: false, error: new Error(message) };
    }
  }

  async function deleteSessions(ids: string[]): Promise<Result<number>> {
    try {
      const adapter = getAdapter();
      await adapter.deleteMany(ids);

      const initialLength = sessions.value.length;
      sessions.value = sessions.value.filter(s => !ids.includes(s.id));
      const deletedCount = initialLength - sessions.value.length;

      return { success: true, data: deletedCount };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete sessions';
      return { success: false, error: new Error(message) };
    }
  }

  function getSessionById(id: string): CashSession | undefined {
    return sessions.value.find(s => s.id === id);
  }

  function setFilters(newFilters: Partial<SessionFilters>): void {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters(): void {
    filters.value = { ...DEFAULT_SESSION_FILTERS };
  }

  async function importSessions(importedSessions: CashSession[], replace: boolean = false): Promise<Result<void>> {
    try {
      if (isDemoMode.value) {
        const adapter = getAdapter() as LocalStorageAdapter<CashSession>;

        if (replace) {
          adapter.importData(importedSessions);
          sessions.value = importedSessions;
        }
        else {
          await adapter.mergeData(importedSessions);
          const existingIds = new Set(sessions.value.map(s => s.id));
          const newSessions = importedSessions.filter(s => !existingIds.has(s.id));
          sessions.value.push(...newSessions);
        }
      }
      else {
        // For database mode, use adapter for each session
        const adapter = getAdapter();

        if (replace) {
          // Delete all existing sessions first
          const ids = sessions.value.map(s => s.id);
          if (ids.length > 0) {
            await adapter.deleteMany(ids);
          }
          sessions.value = [];
        }

        // Insert new sessions
        for (const session of importedSessions) {
          const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...sessionData } = session;
          const created = await adapter.create(sessionData);
          sessions.value.push(created);
        }
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to import sessions';
      return { success: false, error: new Error(message) };
    }
  }

  async function clearAll(): Promise<Result<void>> {
    try {
      if (isDemoMode.value) {
        const adapter = getAdapter() as LocalStorageAdapter<CashSession>;
        adapter.clearAll();
      }
      else {
        const adapter = getAdapter();
        const ids = sessions.value.map(s => s.id);
        if (ids.length > 0) {
          await adapter.deleteMany(ids);
        }
      }

      sessions.value = [];
      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to clear sessions';
      return { success: false, error: new Error(message) };
    }
  }

  return {
    // State
    sessions: readonly(sessions),
    loading: readonly(loading),
    initialized: readonly(initialized),
    filters,
    error: readonly(error),

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
