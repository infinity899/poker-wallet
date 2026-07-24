import type { LocalStorageAdapter } from '~/adapters/LocalStorageAdapter';
import type { StorageAdapter } from '~/adapters/types';
import type {
  Expense,
  ExpenseFilters,
  ExpenseStats,
  NewExpense,
  NewTrip,
  Result,
  Tournament,
  Trip,
  TripPnL,
  TripStats,
} from '~/types';
import { defineStore } from 'pinia';
import { createExpenseAdapter } from '~/adapters/expenseAdapter';
import { createTripAdapter } from '~/adapters/tripAdapter';
import { isDateInRange } from '~/composables/useFilters';
import { useTypedSupabaseClient } from '~/composables/useTypedSupabase';
import { DEFAULT_EXPENSE_FILTERS } from '~/types';
import { calculateExpenseStats, calculateTripPnL, calculateTripsStats } from '~/utils/calculations';

export const useTripsStore = defineStore('trips', () => {
  const supabase = useTypedSupabaseClient();
  const user = useSupabaseUser();

  // State
  const trips = ref<Trip[]>([]);
  const expenses = ref<Expense[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const expenseFilters = ref<ExpenseFilters>({ ...DEFAULT_EXPENSE_FILTERS });
  const error = ref<string | null>(null);

  // Get auth store (lazy to avoid circular dependency)
  const getAuthStore = () => useAuthStore();

  // Check if we're in demo mode
  const isDemoMode = computed(() => getAuthStore().isDemoMode);

  // Adapters
  function getTripAdapter(): StorageAdapter<Trip> {
    return createTripAdapter(isDemoMode.value, supabase, user.value?.sub);
  }

  function getExpenseAdapter(): StorageAdapter<Expense> {
    return createExpenseAdapter(isDemoMode.value, supabase, user.value?.sub);
  }

  // ==========================================
  // Getters
  // ==========================================

  /** Trips newest first, by START date. */
  const sortedTrips = computed(() => {
    return [...trips.value].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  });

  const filteredExpenses = computed(() => {
    return expenses.value.filter((expense) => {
      const f = expenseFilters.value;

      if (!isDateInRange(expense.date, f.dateRange)) {
        return false;
      }

      if (f.categories.length > 0 && !f.categories.includes(expense.category)) {
        return false;
      }

      if (f.tripId === 'none' && expense.tripId) {
        return false;
      }

      if (f.tripId !== 'all' && f.tripId !== 'none' && expense.tripId !== f.tripId) {
        return false;
      }

      if (f.searchQuery && f.searchQuery.length > 0) {
        const query = f.searchQuery.toLowerCase();
        const searchableText = [expense.description, expense.notes, ...expense.tags]
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

  const sortedExpenses = computed(() => {
    return [...filteredExpenses.value].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  });

  /** Expenses not attached to any trip. */
  const standaloneExpenses = computed(() => {
    return expenses.value.filter(e => !e.tripId);
  });

  const allExpensesStats = computed<ExpenseStats>(() => {
    return calculateExpenseStats(expenses.value);
  });

  /**
   * Expenses of one trip, newest first.
   * Parameterised getters are plain functions in setup stores.
   */
  function getTripExpenses(tripId: string): Expense[] {
    return expenses.value
      .filter(e => e.tripId === tripId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Tournaments linked to a trip, newest first.
   * Reads through the tournaments store and DROPS ids that no longer resolve
   * (tournament deleted elsewhere) - this is the single place stale ids are handled.
   * Call this inside a computed() from components so Vue tracks the dependency.
   */
  function getTripTournaments(tripId: string): Tournament[] {
    const trip = trips.value.find(t => t.id === tripId);
    if (!trip) {
      return [];
    }

    const tournamentsStore = useTournamentsStore();
    const linkedIds = new Set(trip.tournamentIds);

    return (tournamentsStore.tournaments as Tournament[])
      .filter(t => linkedIds.has(t.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /** Gross + net P&L for a trip. Safe for trips with 0 tournaments and/or 0 expenses. */
  function getTripPnL(tripId: string): TripPnL {
    return calculateTripPnL(getTripTournaments(tripId), getTripExpenses(tripId));
  }

  const allTripsStats = computed<TripStats>(() => {
    return calculateTripsStats(trips.value.map(t => getTripPnL(t.id)));
  });

  function getTripById(id: string): Trip | undefined {
    return trips.value.find(t => t.id === id);
  }

  function getExpenseById(id: string): Expense | undefined {
    return expenses.value.find(e => e.id === id);
  }

  // ==========================================
  // Actions
  // ==========================================

  async function initialize(): Promise<void> {
    if (initialized.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const authStore = getAuthStore();
      await authStore.waitForSettings();

      const tripAdapter = getTripAdapter();
      const expenseAdapter = getExpenseAdapter();

      const [tripsData, expensesData] = await Promise.all([
        tripAdapter.getAll(),
        expenseAdapter.getAll(),
      ]);

      // Defensive: seed/legacy rows may miss the array fields
      trips.value = tripsData.map(t => ({
        ...t,
        tournamentIds: t.tournamentIds ?? [],
        tags: t.tags ?? [],
      }));
      expenses.value = expensesData.map(e => ({
        ...e,
        tags: e.tags ?? [],
      }));
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load trips data';
      error.value = message;
      console.error('Failed to initialize trips:', e);
    }
    finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function reload(): Promise<void> {
    initialized.value = false;
    trips.value = [];
    expenses.value = [];
    error.value = null;
    await initialize();
  }

  // ---------- Trip CRUD ----------

  async function addTrip(data: NewTrip): Promise<Result<Trip>> {
    try {
      const adapter = getTripAdapter();
      const trip = await adapter.create(data);
      trips.value.push(trip);

      return { success: true, data: trip };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add trip';
      return { success: false, error: new Error(message) };
    }
  }

  async function updateTrip(id: string, updates: Partial<Omit<Trip, 'id'>>): Promise<Result<Trip>> {
    try {
      const index = trips.value.findIndex(t => t.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Trip not found') };
      }

      const adapter = getTripAdapter();
      const updated = await adapter.update(id, updates);
      trips.value[index] = updated;

      return { success: true, data: updated };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update trip';
      return { success: false, error: new Error(message) };
    }
  }

  /**
   * Deletes a trip AND all of its expenses (cascade).
   * Children are deleted first for FK safety and so demo mode (no FK) behaves
   * identically to Supabase (where expenses.trip_id is ON DELETE CASCADE).
   */
  async function deleteTrip(id: string): Promise<Result<void>> {
    try {
      const index = trips.value.findIndex(t => t.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Trip not found') };
      }

      // Delete expenses first (FK constraint)
      const tripExpenseIds = expenses.value
        .filter(e => e.tripId === id)
        .map(e => e.id);

      if (tripExpenseIds.length > 0) {
        const expenseAdapter = getExpenseAdapter();
        await expenseAdapter.deleteMany(tripExpenseIds);
      }

      const tripAdapter = getTripAdapter();
      await tripAdapter.delete(id);

      trips.value.splice(index, 1);
      expenses.value = expenses.value.filter(e => e.tripId !== id);

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete trip';
      return { success: false, error: new Error(message) };
    }
  }

  // ---------- Trip <-> tournament linking ----------

  /** Replace the whole link list (used by the tournament picker). */
  async function setTripTournaments(tripId: string, tournamentIds: string[]): Promise<Result<Trip>> {
    const unique = Array.from(new Set(tournamentIds));
    return updateTrip(tripId, { tournamentIds: unique });
  }

  async function addTournamentToTrip(tripId: string, tournamentId: string): Promise<Result<Trip>> {
    const trip = trips.value.find(t => t.id === tripId);
    if (!trip) {
      return { success: false, error: new Error('Trip not found') };
    }
    if (trip.tournamentIds.includes(tournamentId)) {
      return { success: true, data: trip };
    }
    return setTripTournaments(tripId, [...trip.tournamentIds, tournamentId]);
  }

  async function removeTournamentFromTrip(tripId: string, tournamentId: string): Promise<Result<Trip>> {
    const trip = trips.value.find(t => t.id === tripId);
    if (!trip) {
      return { success: false, error: new Error('Trip not found') };
    }
    return setTripTournaments(tripId, trip.tournamentIds.filter(id => id !== tournamentId));
  }

  /**
   * Drop a tournament id from every trip that references it.
   * Optional housekeeping after a tournament is deleted - reads already tolerate
   * stale ids, this just keeps the arrays from accumulating junk.
   */
  async function removeTournamentFromAllTrips(tournamentId: string): Promise<Result<number>> {
    try {
      const affected = trips.value.filter(t => t.tournamentIds.includes(tournamentId));

      for (const trip of affected) {
        await setTripTournaments(trip.id, trip.tournamentIds.filter(id => id !== tournamentId));
      }

      return { success: true, data: affected.length };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to unlink tournament';
      return { success: false, error: new Error(message) };
    }
  }

  // ---------- Expense CRUD ----------

  async function addExpense(data: NewExpense): Promise<Result<Expense>> {
    try {
      const adapter = getExpenseAdapter();
      const expense = await adapter.create(data);
      expenses.value.push(expense);

      return { success: true, data: expense };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add expense';
      return { success: false, error: new Error(message) };
    }
  }

  async function updateExpense(id: string, updates: Partial<Omit<Expense, 'id'>>): Promise<Result<Expense>> {
    try {
      const index = expenses.value.findIndex(e => e.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Expense not found') };
      }

      const adapter = getExpenseAdapter();
      const updated = await adapter.update(id, updates);
      expenses.value[index] = updated;

      return { success: true, data: updated };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update expense';
      return { success: false, error: new Error(message) };
    }
  }

  /**
   * Attach an expense to a trip, or detach it (pass undefined).
   * Passing an explicit `{ tripId: undefined }` is what makes expenseAdapter write
   * SQL NULL - do not "optimise" this into a conditional spread.
   */
  async function setExpenseTrip(id: string, tripId: string | undefined): Promise<Result<Expense>> {
    return updateExpense(id, { tripId });
  }

  async function deleteExpense(id: string): Promise<Result<void>> {
    try {
      const index = expenses.value.findIndex(e => e.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Expense not found') };
      }

      const adapter = getExpenseAdapter();
      await adapter.delete(id);
      expenses.value.splice(index, 1);

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete expense';
      return { success: false, error: new Error(message) };
    }
  }

  async function deleteExpenses(ids: string[]): Promise<Result<number>> {
    try {
      const adapter = getExpenseAdapter();
      await adapter.deleteMany(ids);

      const initialLength = expenses.value.length;
      expenses.value = expenses.value.filter(e => !ids.includes(e.id));

      return { success: true, data: initialLength - expenses.value.length };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete expenses';
      return { success: false, error: new Error(message) };
    }
  }

  // ---------- Filters ----------

  function setExpenseFilters(newFilters: Partial<ExpenseFilters>): void {
    expenseFilters.value = { ...expenseFilters.value, ...newFilters };
  }

  function resetExpenseFilters(): void {
    expenseFilters.value = { ...DEFAULT_EXPENSE_FILTERS };
  }

  // ---------- Import / clear ----------

  async function importData(
    data: { trips: Trip[]; expenses: Expense[] },
    replace: boolean = false,
  ): Promise<Result<void>> {
    try {
      if (isDemoMode.value) {
        if (replace) {
          trips.value = data.trips;
          expenses.value = data.expenses;
        }
        else {
          const existingTripIds = new Set(trips.value.map(t => t.id));
          const existingExpenseIds = new Set(expenses.value.map(e => e.id));

          trips.value.push(...data.trips.filter(t => !existingTripIds.has(t.id)));
          expenses.value.push(...data.expenses.filter(e => !existingExpenseIds.has(e.id)));
        }

        const tripAdapter = getTripAdapter() as LocalStorageAdapter<Trip>;
        const expenseAdapter = getExpenseAdapter() as LocalStorageAdapter<Expense>;
        tripAdapter.importData(trips.value);
        expenseAdapter.importData(expenses.value);
      }
      else {
        const tripAdapter = getTripAdapter();
        const expenseAdapter = getExpenseAdapter();

        if (replace) {
          // Delete expenses first (FK constraint)
          const expenseIds = expenses.value.map(e => e.id);
          if (expenseIds.length > 0) {
            await expenseAdapter.deleteMany(expenseIds);
          }
          const tripIds = trips.value.map(t => t.id);
          if (tripIds.length > 0) {
            await tripAdapter.deleteMany(tripIds);
          }

          trips.value = [];
          expenses.value = [];
        }

        // Insert trips first, remembering old id -> new id so expenses stay attached.
        // NOTE: trip.tournamentIds CANNOT be remapped here (tournaments are imported
        // by a different store and get fresh ids too) - those links become stale and
        // are filtered on read. Known, accepted v1 limitation.
        const tripIdMap = new Map<string, string>();

        for (const trip of data.trips) {
          const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...tripData } = trip;
          const created = await tripAdapter.create(tripData);
          tripIdMap.set(trip.id, created.id);
          trips.value.push(created);
        }

        for (const expense of data.expenses) {
          const { id: _eId, createdAt: _eCreatedAt, updatedAt: _eUpdatedAt, ...expenseData } = expense;
          const remappedTripId = expense.tripId ? tripIdMap.get(expense.tripId) : undefined;
          const created = await expenseAdapter.create({ ...expenseData, tripId: remappedTripId });
          expenses.value.push(created);
        }
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to import trips data';
      return { success: false, error: new Error(message) };
    }
  }

  async function clearAll(): Promise<Result<void>> {
    try {
      if (isDemoMode.value) {
        const tripAdapter = getTripAdapter() as LocalStorageAdapter<Trip>;
        const expenseAdapter = getExpenseAdapter() as LocalStorageAdapter<Expense>;
        tripAdapter.clearAll();
        expenseAdapter.clearAll();
      }
      else {
        const tripAdapter = getTripAdapter();
        const expenseAdapter = getExpenseAdapter();

        // Delete expenses first (FK constraint)
        const expenseIds = expenses.value.map(e => e.id);
        if (expenseIds.length > 0) {
          await expenseAdapter.deleteMany(expenseIds);
        }

        const tripIds = trips.value.map(t => t.id);
        if (tripIds.length > 0) {
          await tripAdapter.deleteMany(tripIds);
        }
      }

      trips.value = [];
      expenses.value = [];
      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to clear trips data';
      return { success: false, error: new Error(message) };
    }
  }

  return {
    // State
    trips: readonly(trips),
    expenses: readonly(expenses),
    loading: readonly(loading),
    initialized: readonly(initialized),
    expenseFilters, // NOT readonly - filters are mutable, same as tournaments store
    error: readonly(error),

    // Getters
    sortedTrips,
    filteredExpenses,
    sortedExpenses,
    standaloneExpenses,
    allExpensesStats,
    allTripsStats,
    getTripExpenses,
    getTripTournaments,
    getTripPnL,
    getTripById,
    getExpenseById,

    // Actions
    initialize,
    reload,
    addTrip,
    updateTrip,
    deleteTrip,
    setTripTournaments,
    addTournamentToTrip,
    removeTournamentFromTrip,
    removeTournamentFromAllTrips,
    addExpense,
    updateExpense,
    setExpenseTrip,
    deleteExpense,
    deleteExpenses,
    setExpenseFilters,
    resetExpenseFilters,
    importData,
    clearAll,
  };
});
