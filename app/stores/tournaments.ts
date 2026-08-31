import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { LocalStorageAdapter } from '~/adapters/LocalStorageAdapter';
import type { StorageAdapter } from '~/adapters/types';
import type { Currency, DbTournament, NewTournament, Result, SessionType, Tournament, TournamentFilters, TournamentStats } from '~/types';
import { defineStore } from 'pinia';
import { createTournamentAdapter } from '~/adapters/tournamentAdapter';
import { dbTournamentToTournament } from '~/composables/useDatabase';
import { matchesTournamentFilters } from '~/composables/useFilters';
import { useTypedSupabaseClient } from '~/composables/useTypedSupabase';
import { DEFAULT_TOURNAMENT_FILTERS } from '~/types';
import { calculateTournamentStats, getTournamentNetProfit } from '~/utils/calculations';
import { getTournamentVenueNames } from '~/utils/tournamentGrouping';

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

  /**
   * The live-updates channel, or null when there is none - demo mode, signed out, or a
   * subscription that has been torn down. Deliberately a plain variable: it is a handle to
   * a socket, nothing renders from it, and making it reactive would only invite watchers.
   */
  let channel: RealtimeChannel | null = null;

  // Get the appropriate adapter based on mode
  function getAdapter(): StorageAdapter<Tournament> {
    return createTournamentAdapter(
      isDemoMode.value,
      supabase,
      user.value?.sub,
    );
  }

  // Getters
  const filteredTournaments = computed(() =>
    tournaments.value.filter(tournament => matchesTournamentFilters(tournament, filters.value)));

  const sortedTournaments = computed(() => {
    return [...filteredTournaments.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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

  /**
   * Venues and sites that actually appear in the data, with the play type they
   * were used for, so the filter UI can group live venues apart from online
   * sites. Sorted by usage so the places played most often come first.
   */
  const venueOptions = computed<{ name: string; type: SessionType; count: number }[]>(() => {
    const seen = new Map<string, { name: string; type: SessionType; count: number }>();

    tournaments.value.forEach((t) => {
      for (const name of getTournamentVenueNames(t)) {
        const entry = seen.get(name);
        if (entry) {
          entry.count++;
        }
        else {
          seen.set(name, { name, type: t.type, count: 1 });
        }
      }
    });

    return Array.from(seen.values()).sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    );
  });

  const tagOptions = computed<string[]>(() => {
    const tags = new Set<string>();
    tournaments.value.forEach(t => t.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  });

  const currencyOptions = computed<Currency[]>(() => {
    const currencies = new Set<Currency>();
    tournaments.value.forEach(t => currencies.add(t.originalCurrency ?? t.currency));
    return Array.from(currencies).sort();
  });

  const inProgressTournaments = computed(() => {
    return tournaments.value.filter(t => t.status === 'in_progress');
  });

  /**
   * Merge a row that changed somewhere other than here: the desktop companion registering a
   * table, a phone, a second browser tab.
   *
   * Keyed on id and idempotent, so the echo of this tab's own insert - every write here comes
   * back over the socket too - lands on the row it already has instead of duplicating it.
   */
  function applyRemoteChange(payload: RealtimePostgresChangesPayload<DbTournament>): void {
    if (payload.eventType === 'DELETE') {
      // Postgres sends only the replica identity for a delete, so `old` carries the id.
      const deletedId = (payload.old as Partial<DbTournament>).id;
      if (deletedId) {
        tournaments.value = tournaments.value.filter(t => t.id !== deletedId);
      }
      return;
    }

    const row = payload.new as DbTournament;
    if (!row?.id) {
      return;
    }

    const incoming = dbTournamentToTournament(row);
    const index = tournaments.value.findIndex(t => t.id === incoming.id);
    if (index === -1) {
      tournaments.value.push(incoming);
    }
    else {
      tournaments.value[index] = incoming;
    }
  }

  /**
   * Subscribe to this user's tournament rows, so one registered elsewhere shows up here
   * without a refresh - the point of the desktop companion is that capturing a table is the
   * whole interaction, and an open phone or browser that still needs a reload undoes that.
   *
   * Supabase mode only: demo mode has no server to hear from. The filter is server-side, and
   * RLS applies on top of it, so the socket only ever carries rows this user may read.
   */
  function subscribeToChanges(): void {
    const userId = user.value?.sub;
    if (channel || isDemoMode.value || !userId) {
      return;
    }

    channel = supabase
      .channel(`tournaments:${userId}`)
      .on<DbTournament>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments', filter: `user_id=eq.${userId}` },
        applyRemoteChange,
      )
      .subscribe();
  }

  function unsubscribeFromChanges(): void {
    if (channel) {
      void supabase.removeChannel(channel);
      channel = null;
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

    // After the fetch, because the fetch REPLACES the array wholesale: an event applied while
    // it was still in flight would be thrown away by that assignment anyway.
    subscribeToChanges();
  }

  async function reload(): Promise<void> {
    initialized.value = false;
    tournaments.value = [];
    error.value = null;
    // Demo mode is the reason `reload()` is usually called, and the channel belongs to the
    // other mode; dropping it here lets `initialize()` decide whether there should be one.
    unsubscribeFromChanges();
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
  function getTournamentProfit(t: Tournament): number {
    return getTournamentNetProfit(t);
  }

  // The channel is filtered by user id, so it cannot outlive the user it was opened for.
  // Signing in from an already-loaded page opens the replacement here; on sign-out there is
  // nothing to listen for and the socket goes with it.
  watch(() => user.value?.sub, () => {
    unsubscribeFromChanges();
    if (initialized.value) {
      subscribeToChanges();
    }
  });

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
    venueOptions,
    tagOptions,
    currencyOptions,

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
    subscribeToChanges,
    unsubscribeFromChanges,
  };
});
