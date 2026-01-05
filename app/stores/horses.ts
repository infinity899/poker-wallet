import type { Horse, HorseStats, HorseTransaction, NewHorse, NewHorseTransaction } from '~/types';
import { defineStore } from 'pinia';

const STORAGE_KEY_HORSES = 'poker-wallet-horses';
const STORAGE_KEY_TRANSACTIONS = 'poker-wallet-horse-transactions';

export const useHorsesStore = defineStore('horses', () => {
  // State
  const horses = ref<Horse[]>([]);
  const transactions = ref<HorseTransaction[]>([]);
  const loading = ref(false);
  const initialized = ref(false);

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
      // Try to load from localStorage first
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
    catch (error) {
      console.error('Failed to initialize horses:', error);
    }
    finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY_HORSES, JSON.stringify(horses.value));
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions.value));
  }

  // Horse CRUD
  function addHorse(data: NewHorse): Horse {
    const now = new Date().toISOString();
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

  function updateHorse(id: string, updates: Partial<Omit<Horse, 'id'>>): boolean {
    const index = horses.value.findIndex(h => h.id === id);
    if (index === -1) {
      return false;
    }

    const current = horses.value[index]!;
    horses.value[index] = {
      ...current,
      ...updates,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };

    saveToStorage();
    return true;
  }

  function deleteHorse(id: string): boolean {
    const index = horses.value.findIndex(h => h.id === id);
    if (index === -1) {
      return false;
    }

    // Remove horse
    horses.value.splice(index, 1);

    // Remove all transactions for this horse
    transactions.value = transactions.value.filter(t => t.horseId !== id);

    saveToStorage();
    return true;
  }

  function getHorseById(id: string): Horse | undefined {
    return horses.value.find(h => h.id === id);
  }

  // Transaction CRUD
  function addTransaction(data: NewHorseTransaction): HorseTransaction {
    const now = new Date().toISOString();
    const transaction: HorseTransaction = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
    };

    transactions.value.push(transaction);
    saveToStorage();
    return transaction;
  }

  function updateTransaction(id: string, updates: Partial<Omit<HorseTransaction, 'id'>>): boolean {
    const index = transactions.value.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    const current = transactions.value[index]!;
    transactions.value[index] = {
      ...current,
      ...updates,
      id: current.id,
    };

    saveToStorage();
    return true;
  }

  function deleteTransaction(id: string): boolean {
    const index = transactions.value.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    transactions.value.splice(index, 1);
    saveToStorage();
    return true;
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

  function clearAll() {
    horses.value = [];
    transactions.value = [];
    saveToStorage();
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
