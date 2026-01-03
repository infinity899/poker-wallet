import type { CashSession, NewCashSession, SessionFilters, SessionStats } from '~/types';
import { defineStore } from 'pinia';
import { isDateInRange } from '~/composables/useFilters';
import { DEFAULT_SESSION_FILTERS } from '~/types';
import { calculateSessionStats } from '~/utils/calculations';
import { parseStake } from '~/utils/formatters';

const STORAGE_KEY = 'poker-wallet-sessions';

export const useSessionsStore = defineStore('sessions', () => {
  // State
  const sessions = ref<CashSession[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const filters = ref<SessionFilters>({ ...DEFAULT_SESSION_FILTERS });

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

  // Actions
  async function initialize() {
    if (initialized.value) {
      return;
    }

    loading.value = true;
    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        sessions.value = JSON.parse(stored);
      }
      else {
        // Load from mock data
        const response = await fetch('/data/sessions.json');
        if (response.ok) {
          sessions.value = await response.json();
          saveToStorage();
        }
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

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.value));
  }

  function addSession(data: NewCashSession): CashSession {
    const now = new Date().toISOString();
    const parsed = parseStake(data.stake);

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

  function updateSession(id: string, updates: Partial<Omit<CashSession, 'id'>>): boolean {
    const index = sessions.value.findIndex(s => s.id === id);
    if (index === -1) {
      return false;
    }

    const current = sessions.value[index]!;
    const parsed = updates.stake ? parseStake(updates.stake) : null;

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

  function deleteSession(id: string): boolean {
    const index = sessions.value.findIndex(s => s.id === id);
    if (index === -1) {
      return false;
    }

    sessions.value.splice(index, 1);
    saveToStorage();
    return true;
  }

  function deleteSessions(ids: string[]): number {
    const initialLength = sessions.value.length;
    sessions.value = sessions.value.filter(s => !ids.includes(s.id));
    saveToStorage();
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

  function importSessions(importedSessions: CashSession[], replace: boolean = false) {
    if (replace) {
      sessions.value = importedSessions;
    }
    else {
      // Merge: add sessions that don't exist
      const existingIds = new Set(sessions.value.map(s => s.id));
      const newSessions = importedSessions.filter(s => !existingIds.has(s.id));
      sessions.value.push(...newSessions);
    }
    saveToStorage();
  }

  function clearAll() {
    sessions.value = [];
    saveToStorage();
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
    stats,
    allStakes,
    allVenues,

    // Actions
    initialize,
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
