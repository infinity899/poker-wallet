import type { Horse, HorseStats, HorseTransaction, NewHorse, NewHorseTransaction } from '~/types';
import { defineStore } from 'pinia';
import { useTypedSupabaseClient } from '~/composables/useTypedSupabase';

const STORAGE_KEY_HORSES = 'poker-wallet-horses';
const STORAGE_KEY_TRANSACTIONS = 'poker-wallet-horse-transactions';

export const useHorsesStore = defineStore('horses', () => {
  const supabase = useTypedSupabaseClient();
  const user = useSupabaseUser();

  // State
  const horses = ref<Horse[]>([]);
  const transactions = ref<HorseTransaction[]>([]);
  const loading = ref(false);
  const initialized = ref(false);

  // Get auth store (lazy to avoid circular dependency)
  const getAuthStore = () => useAuthStore();

  // Check if we're in demo mode
  const isDemoMode = computed(() => getAuthStore().isDemoMode);

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
      console.error('Failed to initialize horses:', error);
    }
    finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function loadFromLocalStorage() {
    const storedHorses = localStorage.getItem(STORAGE_KEY_HORSES);
    const storedTransactions = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);

    let loadedFromStorage = false;
    if (storedHorses && storedTransactions) {
      const parsedHorses = JSON.parse(storedHorses);
      const parsedTransactions = JSON.parse(storedTransactions);
      // Only use localStorage if there's actual data
      if (parsedHorses.length > 0 || parsedTransactions.length > 0) {
        horses.value = parsedHorses;
        transactions.value = parsedTransactions;
        loadedFromStorage = true;
      }
    }

    if (!loadedFromStorage) {
      // Load from mock data
      const response = await fetch('/data/horses.json');
      if (response.ok) {
        const data = await response.json();
        horses.value = data.horses || [];
        transactions.value = data.transactions || [];
        saveToStorage();
      }
    }
  }

  async function loadFromDatabase() {
    if (!user.value) {
      return;
    }

    // Load horses
    const { data: horsesData, error: horsesError } = await supabase
      .from('horses')
      .select('*')
      .eq('user_id', user.value!.sub)
      .order('created_at', { ascending: false });

    if (horsesError) {
      console.error('Failed to load horses from database:', horsesError);
      return;
    }

    // Load horse transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('horse_transactions')
      .select('*')
      .eq('user_id', user.value!.sub)
      .order('date', { ascending: false });

    if (transactionsError) {
      console.error('Failed to load horse transactions from database:', transactionsError);
      return;
    }

    // Map database records to frontend types
    horses.value = (horsesData || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar ?? undefined,
      currency: row.currency,
      notes: row.notes ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    transactions.value = (transactionsData || []).map((row: any) => ({
      id: row.id,
      horseId: row.horse_id,
      date: row.date,
      type: row.type,
      result: row.result,
      description: row.description ?? undefined,
      isSession: row.is_session ?? undefined,
      sessionCount: row.session_count ?? undefined,
      createdAt: row.created_at,
    }));
  }

  // Reload data (useful when switching modes)
  async function reload() {
    initialized.value = false;
    horses.value = [];
    transactions.value = [];
    await initialize();
  }

  function saveToStorage() {
    if (isDemoMode.value) {
      localStorage.setItem(STORAGE_KEY_HORSES, JSON.stringify(horses.value));
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions.value));
    }
  }

  // Horse CRUD
  async function addHorse(data: NewHorse): Promise<Horse> {
    const now = new Date().toISOString();

    if (isDemoMode.value) {
      // Demo mode: save to localStorage
      const horse: Horse = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      horses.value.push(horse);
      saveToStorage();
      return horse;
    }
    else {
      // Database mode: save to Supabase
      if (!user.value) {
        throw new Error('User not authenticated');
      }

      const { data: inserted, error } = await supabase
        .from('horses')
        .insert({
          user_id: user.value!.sub,
          name: data.name,
          avatar: data.avatar ?? null,
          currency: data.currency,
          notes: data.notes ?? null,
        } as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const horse: Horse = {
        id: inserted.id,
        name: inserted.name,
        avatar: inserted.avatar ?? undefined,
        currency: inserted.currency,
        notes: inserted.notes ?? undefined,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
      };

      horses.value.push(horse);
      return horse;
    }
  }

  async function updateHorse(id: string, updates: Partial<Omit<Horse, 'id'>>): Promise<boolean> {
    const index = horses.value.findIndex(h => h.id === id);
    if (index === -1) {
      return false;
    }

    const current = horses.value[index]!;

    if (isDemoMode.value) {
      // Demo mode: update localStorage
      horses.value[index] = {
        ...current,
        ...updates,
        id: current.id,
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
      if (updates.name !== undefined) {
        dbUpdates.name = updates.name;
      }
      if (updates.avatar !== undefined) {
        dbUpdates.avatar = updates.avatar;
      }
      if (updates.currency !== undefined) {
        dbUpdates.currency = updates.currency;
      }
      if (updates.notes !== undefined) {
        dbUpdates.notes = updates.notes;
      }

      const { data: updated, error } = await supabase
        .from('horses')
        .update(dbUpdates as any)
        .eq('id', id)
        .eq('user_id', user.value!.sub)
        .select()
        .single();

      if (error) {
        throw error;
      }

      horses.value[index] = {
        id: updated.id,
        name: updated.name,
        avatar: updated.avatar ?? undefined,
        currency: updated.currency,
        notes: updated.notes ?? undefined,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };

      return true;
    }
  }

  async function deleteHorse(id: string): Promise<boolean> {
    const index = horses.value.findIndex(h => h.id === id);
    if (index === -1) {
      return false;
    }

    if (isDemoMode.value) {
      // Demo mode: delete from localStorage
      horses.value.splice(index, 1);
      transactions.value = transactions.value.filter(t => t.horseId !== id);
      saveToStorage();
      return true;
    }
    else {
      // Database mode: delete from Supabase
      if (!user.value) {
        throw new Error('User not authenticated');
      }

      // Delete all transactions for this horse first
      await supabase
        .from('horse_transactions')
        .delete()
        .eq('horse_id', id)
        .eq('user_id', user.value!.sub);

      // Delete the horse
      const { error } = await supabase
        .from('horses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.value!.sub);

      if (error) {
        throw error;
      }

      horses.value.splice(index, 1);
      transactions.value = transactions.value.filter(t => t.horseId !== id);
      return true;
    }
  }

  function getHorseById(id: string): Horse | undefined {
    return horses.value.find(h => h.id === id);
  }

  // Transaction CRUD
  async function addTransaction(data: NewHorseTransaction): Promise<HorseTransaction> {
    const now = new Date().toISOString();

    if (isDemoMode.value) {
      // Demo mode: save to localStorage
      const transaction: HorseTransaction = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
      };

      transactions.value.push(transaction);
      saveToStorage();
      return transaction;
    }
    else {
      // Database mode: save to Supabase
      if (!user.value) {
        throw new Error('User not authenticated');
      }

      const { data: inserted, error } = await supabase
        .from('horse_transactions')
        .insert({
          user_id: user.value!.sub,
          horse_id: data.horseId,
          date: data.date,
          type: data.type,
          result: data.result,
          description: data.description ?? null,
          is_session: data.isSession ?? null,
          session_count: data.sessionCount ?? null,
        } as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const transaction: HorseTransaction = {
        id: inserted.id,
        horseId: inserted.horse_id,
        date: inserted.date,
        type: inserted.type,
        result: inserted.result,
        description: inserted.description ?? undefined,
        isSession: inserted.is_session ?? undefined,
        sessionCount: inserted.session_count ?? undefined,
        createdAt: inserted.created_at,
      };

      transactions.value.push(transaction);
      return transaction;
    }
  }

  async function updateTransaction(id: string, updates: Partial<Omit<HorseTransaction, 'id'>>): Promise<boolean> {
    const index = transactions.value.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    const current = transactions.value[index]!;

    if (isDemoMode.value) {
      // Demo mode: update localStorage
      transactions.value[index] = {
        ...current,
        ...updates,
        id: current.id,
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
      if (updates.horseId !== undefined) {
        dbUpdates.horse_id = updates.horseId;
      }
      if (updates.date !== undefined) {
        dbUpdates.date = updates.date;
      }
      if (updates.type !== undefined) {
        dbUpdates.type = updates.type;
      }
      if (updates.result !== undefined) {
        dbUpdates.result = updates.result;
      }
      if (updates.description !== undefined) {
        dbUpdates.description = updates.description;
      }
      if (updates.isSession !== undefined) {
        dbUpdates.is_session = updates.isSession;
      }
      if (updates.sessionCount !== undefined) {
        dbUpdates.session_count = updates.sessionCount;
      }

      const { data: updated, error } = await supabase
        .from('horse_transactions')
        .update(dbUpdates as any)
        .eq('id', id)
        .eq('user_id', user.value!.sub)
        .select()
        .single();

      if (error) {
        throw error;
      }

      transactions.value[index] = {
        id: updated.id,
        horseId: updated.horse_id,
        date: updated.date,
        type: updated.type,
        result: updated.result,
        description: updated.description ?? undefined,
        isSession: updated.is_session ?? undefined,
        sessionCount: updated.session_count ?? undefined,
        createdAt: updated.created_at,
      };

      return true;
    }
  }

  async function deleteTransaction(id: string): Promise<boolean> {
    const index = transactions.value.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    if (isDemoMode.value) {
      // Demo mode: delete from localStorage
      transactions.value.splice(index, 1);
      saveToStorage();
      return true;
    }
    else {
      // Database mode: delete from Supabase
      if (!user.value) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('horse_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.value!.sub);

      if (error) {
        throw error;
      }

      transactions.value.splice(index, 1);
      return true;
    }
  }

  function getTransactionById(id: string): HorseTransaction | undefined {
    return transactions.value.find(t => t.id === id);
  }

  // Import/Export
  function importData(data: { horses: Horse[]; transactions: HorseTransaction[] }, replace: boolean = false) {
    if (replace) {
      horses.value = data.horses;
      transactions.value = data.transactions;
    }
    else {
      // Merge: add items that don't exist
      const existingHorseIds = new Set(horses.value.map(h => h.id));
      const existingTransactionIds = new Set(transactions.value.map(t => t.id));

      const newHorses = data.horses.filter(h => !existingHorseIds.has(h.id));
      const newTransactions = data.transactions.filter(t => !existingTransactionIds.has(t.id));

      horses.value.push(...newHorses);
      transactions.value.push(...newTransactions);
    }
    saveToStorage();
  }

  async function clearAll() {
    if (isDemoMode.value) {
      horses.value = [];
      transactions.value = [];
      saveToStorage();
    }
    else {
      if (!user.value) {
        throw new Error('User not authenticated');
      }

      // Delete all horse transactions first
      await supabase
        .from('horse_transactions')
        .delete()
        .eq('user_id', user.value!.sub);

      // Delete all horses
      await supabase
        .from('horses')
        .delete()
        .eq('user_id', user.value!.sub);

      horses.value = [];
      transactions.value = [];
    }
  }

  return {
    // State
    horses: readonly(horses),
    transactions: readonly(transactions),
    loading: readonly(loading),
    initialized: readonly(initialized),

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
