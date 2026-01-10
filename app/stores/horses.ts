import type { LocalStorageAdapter } from '~/adapters/LocalStorageAdapter';
import type { StorageAdapter } from '~/adapters/types';
import type { Horse, HorseStats, HorseTransaction, NewHorse, NewHorseTransaction, Result } from '~/types';
import { defineStore } from 'pinia';
import { createHorseAdapter, createHorseTransactionAdapter } from '~/adapters/horseAdapter';
import { useTypedSupabaseClient } from '~/composables/useTypedSupabase';

export const useHorsesStore = defineStore('horses', () => {
  const supabase = useTypedSupabaseClient();
  const user = useSupabaseUser();

  // State
  const horses = ref<Horse[]>([]);
  const transactions = ref<HorseTransaction[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const error = ref<string | null>(null);

  // Get auth store (lazy to avoid circular dependency)
  const getAuthStore = () => useAuthStore();

  // Check if we're in demo mode
  const isDemoMode = computed(() => getAuthStore().isDemoMode);

  // Get adapters
  function getHorseAdapter(): StorageAdapter<Horse> {
    return createHorseAdapter(isDemoMode.value, supabase, user.value?.sub);
  }

  function getTransactionAdapter(): StorageAdapter<HorseTransaction> {
    return createHorseTransactionAdapter(isDemoMode.value, supabase, user.value?.sub);
  }

  // Getters
  const sortedHorses = computed(() => {
    return [...horses.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

  // Get transactions for a specific horse
  function getHorseTransactions(horseId: string): HorseTransaction[] {
    return transactions.value
      .filter(t => t.horseId === horseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get stats for a specific horse
  function getHorseStats(horseId: string): HorseStats {
    const horseTransactions = transactions.value.filter(t => t.horseId === horseId);

    const totalTransactions = horseTransactions.length;
    const totalProfit = horseTransactions.reduce((sum, t) => sum + t.result, 0);
    const winningTransactions = horseTransactions.filter(t => t.result > 0).length;
    const losingTransactions = horseTransactions.filter(t => t.result < 0).length;
    const winRate = totalTransactions > 0 ? (winningTransactions / totalTransactions) * 100 : 0;
    const bestResult = horseTransactions.length > 0 ? Math.max(...horseTransactions.map(t => t.result)) : 0;
    const worstResult = horseTransactions.length > 0 ? Math.min(...horseTransactions.map(t => t.result)) : 0;

    return {
      totalTransactions,
      totalProfit,
      winRate,
      bestResult,
      worstResult,
      winningTransactions,
      losingTransactions,
    };
  }

  // Get all horses stats combined
  const allHorsesStats = computed<HorseStats>(() => {
    const totalTransactions = transactions.value.length;
    const totalProfit = transactions.value.reduce((sum, t) => sum + t.result, 0);
    const winningTransactions = transactions.value.filter(t => t.result > 0).length;
    const losingTransactions = transactions.value.filter(t => t.result < 0).length;
    const winRate = totalTransactions > 0 ? (winningTransactions / totalTransactions) * 100 : 0;
    const bestResult = transactions.value.length > 0 ? Math.max(...transactions.value.map(t => t.result)) : 0;
    const worstResult = transactions.value.length > 0 ? Math.min(...transactions.value.map(t => t.result)) : 0;

    return {
      totalTransactions,
      totalProfit,
      winRate,
      bestResult,
      worstResult,
      winningTransactions,
      losingTransactions,
    };
  });

  // Get cumulative profit data for chart
  function getCumulativeProfitData(horseId?: string) {
    const relevantTransactions = horseId
      ? transactions.value.filter(t => t.horseId === horseId)
      : transactions.value;

    // Sort by date ascending
    const sorted = [...relevantTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let cumulative = 0;
    return sorted.map((t) => {
      cumulative += t.result;
      return {
        date: t.date,
        profit: cumulative,
        result: t.result,
      };
    });
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

      const horseAdapter = getHorseAdapter();
      const transactionAdapter = getTransactionAdapter();

      // Load both in parallel
      const [horsesData, transactionsData] = await Promise.all([
        horseAdapter.getAll(),
        transactionAdapter.getAll(),
      ]);

      horses.value = horsesData;
      transactions.value = transactionsData;
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load horses data';
      error.value = message;
      console.error('Failed to initialize horses:', e);
    }
    finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function reload(): Promise<void> {
    initialized.value = false;
    horses.value = [];
    transactions.value = [];
    error.value = null;
    await initialize();
  }

  // Horse CRUD
  async function addHorse(data: NewHorse): Promise<Result<Horse>> {
    try {
      const adapter = getHorseAdapter();
      const horse = await adapter.create(data);
      horses.value.push(horse);

      return { success: true, data: horse };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add horse';
      return { success: false, error: new Error(message) };
    }
  }

  async function updateHorse(id: string, updates: Partial<Omit<Horse, 'id'>>): Promise<Result<Horse>> {
    try {
      const index = horses.value.findIndex(h => h.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Horse not found') };
      }

      const adapter = getHorseAdapter();
      const updated = await adapter.update(id, updates);
      horses.value[index] = updated;

      return { success: true, data: updated };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update horse';
      return { success: false, error: new Error(message) };
    }
  }

  async function deleteHorse(id: string): Promise<Result<void>> {
    try {
      const index = horses.value.findIndex(h => h.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Horse not found') };
      }

      // Delete all transactions for this horse first
      const horseTransactionIds = transactions.value
        .filter(t => t.horseId === id)
        .map(t => t.id);

      if (horseTransactionIds.length > 0) {
        const transactionAdapter = getTransactionAdapter();
        await transactionAdapter.deleteMany(horseTransactionIds);
      }

      // Delete the horse
      const horseAdapter = getHorseAdapter();
      await horseAdapter.delete(id);

      horses.value.splice(index, 1);
      transactions.value = transactions.value.filter(t => t.horseId !== id);

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete horse';
      return { success: false, error: new Error(message) };
    }
  }

  function getHorseById(id: string): Horse | undefined {
    return horses.value.find(h => h.id === id);
  }

  // Transaction CRUD
  async function addTransaction(data: NewHorseTransaction): Promise<Result<HorseTransaction>> {
    try {
      const adapter = getTransactionAdapter();
      const transaction = await adapter.create(data);
      transactions.value.push(transaction);

      return { success: true, data: transaction };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add transaction';
      return { success: false, error: new Error(message) };
    }
  }

  async function updateTransaction(id: string, updates: Partial<Omit<HorseTransaction, 'id'>>): Promise<Result<HorseTransaction>> {
    try {
      const index = transactions.value.findIndex(t => t.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Transaction not found') };
      }

      const adapter = getTransactionAdapter();
      const updated = await adapter.update(id, updates);
      transactions.value[index] = updated;

      return { success: true, data: updated };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update transaction';
      return { success: false, error: new Error(message) };
    }
  }

  async function deleteTransaction(id: string): Promise<Result<void>> {
    try {
      const index = transactions.value.findIndex(t => t.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Transaction not found') };
      }

      const adapter = getTransactionAdapter();
      await adapter.delete(id);
      transactions.value.splice(index, 1);

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete transaction';
      return { success: false, error: new Error(message) };
    }
  }

  function getTransactionById(id: string): HorseTransaction | undefined {
    return transactions.value.find(t => t.id === id);
  }

  // Import/Export
  async function importData(
    data: { horses: Horse[]; transactions: HorseTransaction[] },
    replace: boolean = false,
  ): Promise<Result<void>> {
    try {
      if (isDemoMode.value) {
        if (replace) {
          horses.value = data.horses;
          transactions.value = data.transactions;
        }
        else {
          const existingHorseIds = new Set(horses.value.map(h => h.id));
          const existingTransactionIds = new Set(transactions.value.map(t => t.id));

          const newHorses = data.horses.filter(h => !existingHorseIds.has(h.id));
          const newTransactions = data.transactions.filter(t => !existingTransactionIds.has(t.id));

          horses.value.push(...newHorses);
          transactions.value.push(...newTransactions);
        }

        // Save to localStorage
        const horseAdapter = getHorseAdapter() as LocalStorageAdapter<Horse>;
        const transactionAdapter = getTransactionAdapter() as LocalStorageAdapter<HorseTransaction>;
        horseAdapter.importData(horses.value);
        transactionAdapter.importData(transactions.value);
      }
      else {
        const horseAdapter = getHorseAdapter();
        const transactionAdapter = getTransactionAdapter();

        if (replace) {
          // Delete all existing data
          const horseIds = horses.value.map(h => h.id);
          const transactionIds = transactions.value.map(t => t.id);

          if (transactionIds.length > 0) {
            await transactionAdapter.deleteMany(transactionIds);
          }
          if (horseIds.length > 0) {
            await horseAdapter.deleteMany(horseIds);
          }

          horses.value = [];
          transactions.value = [];
        }

        // Insert horses first, then transactions
        for (const horse of data.horses) {
          const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...horseData } = horse;
          const created = await horseAdapter.create(horseData);
          horses.value.push(created);
        }

        for (const tx of data.transactions) {
          const { id: _txId, createdAt: _txCreatedAt, ...txData } = tx;
          const created = await transactionAdapter.create(txData);
          transactions.value.push(created);
        }
      }

      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to import data';
      return { success: false, error: new Error(message) };
    }
  }

  async function clearAll(): Promise<Result<void>> {
    try {
      if (isDemoMode.value) {
        const horseAdapter = getHorseAdapter() as LocalStorageAdapter<Horse>;
        const transactionAdapter = getTransactionAdapter() as LocalStorageAdapter<HorseTransaction>;
        horseAdapter.clearAll();
        transactionAdapter.clearAll();
      }
      else {
        const horseAdapter = getHorseAdapter();
        const transactionAdapter = getTransactionAdapter();

        // Delete transactions first (FK constraint)
        const transactionIds = transactions.value.map(t => t.id);
        if (transactionIds.length > 0) {
          await transactionAdapter.deleteMany(transactionIds);
        }

        const horseIds = horses.value.map(h => h.id);
        if (horseIds.length > 0) {
          await horseAdapter.deleteMany(horseIds);
        }
      }

      horses.value = [];
      transactions.value = [];
      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to clear data';
      return { success: false, error: new Error(message) };
    }
  }

  return {
    // State
    horses: readonly(horses),
    transactions: readonly(transactions),
    loading: readonly(loading),
    initialized: readonly(initialized),
    error: readonly(error),

    // Getters
    sortedHorses,
    allHorsesStats,
    getHorseTransactions,
    getHorseStats,
    getCumulativeProfitData,

    // Actions
    initialize,
    reload,
    addHorse,
    updateHorse,
    deleteHorse,
    getHorseById,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    importData,
    clearAll,
  };
});
