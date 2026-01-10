import type { LocalStorageAdapter } from '~/adapters/LocalStorageAdapter';
import type { StorageAdapter } from '~/adapters/types';
import type { NewTournament, Result, Tournament, TournamentFilters, TournamentStats } from '~/types';
import { defineStore } from 'pinia';
import { createTournamentAdapter } from '~/adapters/tournamentAdapter';
import { isDateInRange } from '~/composables/useFilters';
import { useTypedSupabaseClient } from '~/composables/useTypedSupabase';
import { DEFAULT_TOURNAMENT_FILTERS } from '~/types';
import { calculateTournamentStats } from '~/utils/calculations';

export const useTournamentsStore = defineStore('tournaments', () => {
  const supabase = useTypedSupabaseClient();
  const user = useSupabaseUser();

  // State
  const tournaments = ref<Tournament[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const filters = ref<TournamentFilters>({ ...DEFAULT_TOURNAMENT_FILTERS });
  const error = ref<string | null>(null);

  // Get auth store (lazy to avoid circular dependency)
  const getAuthStore = () => useAuthStore();

  // Check if we're in demo mode
  const isDemoMode = computed(() => getAuthStore().isDemoMode);

  // Get the appropriate adapter based on mode
  function getAdapter(): StorageAdapter<Tournament> {
    return createTournamentAdapter(
      isDemoMode.value,
      supabase,
      user.value?.sub,
    );
  }

  // Getters
  const filteredTournaments = computed(() => {
    return tournaments.value.filter((tournament) => {
      const f = filters.value;

      // Date range filter
      if (!isDateInRange(tournament.date, f.dateRange)) {
        return false;
      }

      // Type filter
      if (f.type !== 'all' && tournament.type !== f.type) {
        return false;
      }

      // Currency filter
      if (f.currency !== 'all' && tournament.currency !== f.currency) {
        return false;
      }

      // Buy-in range filter
      if (f.buyInMin !== undefined && tournament.buyIn < f.buyInMin) {
        return false;
      }
      if (f.buyInMax !== undefined && tournament.buyIn > f.buyInMax) {
        return false;
      }

      // Venues filter
      if (f.venues.length > 0) {
        const venueMatch = tournament.venue
          ? f.venues.includes(tournament.venue)
          : tournament.site
            ? f.venues.includes(tournament.site)
            : false;
        if (!venueMatch) {
          return false;
        }
      }

      // Tags filter
      if (f.tags.length > 0) {
        const hasTag = f.tags.some(tag => tournament.tags.includes(tag));
        if (!hasTag) {
          return false;
        }
      }

      // ITM only filter
      if (f.itmOnly) {
        const isItm = tournament.cashed === true
          || (tournament.cashed === undefined && tournament.winnings > 0);
        if (!isItm) {
          return false;
        }
      }

      // Search query
      if (f.searchQuery && f.searchQuery.length > 0) {
        const query = f.searchQuery.toLowerCase();
        const searchableText = [
          tournament.name,
          tournament.venue,
          tournament.site,
          tournament.notes,
          ...tournament.tags,
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

  const sortedTournaments = computed(() => {
    return [...filteredTournaments.value].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  });

  const stats = computed<TournamentStats>(() => {
    return calculateTournamentStats(filteredTournaments.value);
  });

  const allBuyIns = computed(() => {
    const buyIns = new Set<number>();
    tournaments.value.forEach(t => buyIns.add(t.buyIn));
    return Array.from(buyIns).sort((a, b) => a - b);
  });

  const allVenues = computed(() => {
    const venues = new Set<string>();
    tournaments.value.forEach((t) => {
      if (t.venue) {
        venues.add(t.venue);
      }
      if (t.site) {
        venues.add(t.site);
      }
    });
    return Array.from(venues).sort();
  });

  const inProgressTournaments = computed(() => {
    return tournaments.value.filter(t => t.status === 'in_progress');
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

      // Ensure all tournaments have a status (default to 'completed' for existing data)
      tournaments.value = data.map(t => ({
        ...t,
        status: t.status || 'completed',
      }));
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load tournaments';
      error.value = message;
      console.error('Failed to initialize tournaments:', e);
    }
    finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function reload(): Promise<void> {
    initialized.value = false;
    tournaments.value = [];
    error.value = null;
    await initialize();
  }

  async function addTournament(data: NewTournament): Promise<Result<Tournament>> {
    try {
      const adapter = getAdapter();
      const tournament = await adapter.create(data);
      tournaments.value.push(tournament);

      return { success: true, data: tournament };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add tournament';
      return { success: false, error: new Error(message) };
    }
  }

  async function updateTournament(id: string, updates: Partial<Omit<Tournament, 'id'>>): Promise<Result<Tournament>> {
    try {
      const index = tournaments.value.findIndex(t => t.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Tournament not found') };
      }

      const adapter = getAdapter();
      const updated = await adapter.update(id, updates);
      tournaments.value[index] = updated;

      return { success: true, data: updated };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update tournament';
      return { success: false, error: new Error(message) };
    }
  }

  async function deleteTournament(id: string): Promise<Result<void>> {
    try {
      const index = tournaments.value.findIndex(t => t.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Tournament not found') };
      }

      const adapter = getAdapter();
      await adapter.delete(id);
      tournaments.value.splice(index, 1);

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete tournament';
      return { success: false, error: new Error(message) };
    }
  }

  async function deleteTournaments(ids: string[]): Promise<Result<number>> {
    try {
      const adapter = getAdapter();
      await adapter.deleteMany(ids);

      const initialLength = tournaments.value.length;
      tournaments.value = tournaments.value.filter(t => !ids.includes(t.id));
      const deletedCount = initialLength - tournaments.value.length;

      return { success: true, data: deletedCount };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete tournaments';
      return { success: false, error: new Error(message) };
    }
  }

  function getTournamentById(id: string): Tournament | undefined {
    return tournaments.value.find(t => t.id === id);
  }

  function setFilters(newFilters: Partial<TournamentFilters>): void {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters(): void {
    filters.value = { ...DEFAULT_TOURNAMENT_FILTERS };
  }

  async function importTournaments(importedTournaments: Tournament[], replace: boolean = false): Promise<Result<void>> {
    try {
      if (isDemoMode.value) {
        const adapter = getAdapter() as LocalStorageAdapter<Tournament>;

        if (replace) {
          adapter.importData(importedTournaments);
          tournaments.value = importedTournaments;
        }
        else {
          await adapter.mergeData(importedTournaments);
          const existingIds = new Set(tournaments.value.map(t => t.id));
          const newTournaments = importedTournaments.filter(t => !existingIds.has(t.id));
          tournaments.value.push(...newTournaments);
        }
      }
      else {
        const adapter = getAdapter();

        if (replace) {
          const ids = tournaments.value.map(t => t.id);
          if (ids.length > 0) {
            await adapter.deleteMany(ids);
          }
          tournaments.value = [];
        }

        for (const tournament of importedTournaments) {
          const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...tournamentData } = tournament;
          const created = await adapter.create(tournamentData);
          tournaments.value.push(created);
        }
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to import tournaments';
      return { success: false, error: new Error(message) };
    }
  }

  async function clearAll(): Promise<Result<void>> {
    try {
      if (isDemoMode.value) {
        const adapter = getAdapter() as LocalStorageAdapter<Tournament>;
        adapter.clearAll();
      }
      else {
        const adapter = getAdapter();
        const ids = tournaments.value.map(t => t.id);
        if (ids.length > 0) {
          await adapter.deleteMany(ids);
        }
      }

      tournaments.value = [];
      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to clear tournaments';
      return { success: false, error: new Error(message) };
    }
  }

  // Helper to calculate profit for a tournament
  function getTournamentProfit(tournament: Tournament): number {
    const totalCost = (tournament.buyIn + tournament.fee) * (tournament.entries + 1);
    return tournament.winnings - totalCost;
  }

  return {
    // State
    tournaments: readonly(tournaments),
    loading: readonly(loading),
    initialized: readonly(initialized),
    filters,
    error: readonly(error),

    // Getters
    filteredTournaments,
    sortedTournaments,
    inProgressTournaments,
    stats,
    allBuyIns,
    allVenues,

    // Actions
    initialize,
    reload,
    addTournament,
    updateTournament,
    deleteTournament,
    deleteTournaments,
    getTournamentById,
    setFilters,
    resetFilters,
    importTournaments,
    clearAll,
    getTournamentProfit,
  };
});
