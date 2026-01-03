import type { NewTournament, Tournament, TournamentFilters, TournamentStats } from '~/types';
import { defineStore } from 'pinia';
import { isDateInRange } from '~/composables/useFilters';
import { DEFAULT_TOURNAMENT_FILTERS } from '~/types';
import { calculateTournamentStats } from '~/utils/calculations';

const STORAGE_KEY = 'poker-wallet-tournaments';

export const useTournamentsStore = defineStore('tournaments', () => {
  // State
  const tournaments = ref<Tournament[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const filters = ref<TournamentFilters>({ ...DEFAULT_TOURNAMENT_FILTERS });

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
        tournaments.value = JSON.parse(stored);
      }
      else {
        // Load from mock data
        const response = await fetch('/data/tournaments.json');
        if (response.ok) {
          tournaments.value = await response.json();
          saveToStorage();
        }
      }
    }
    catch (error) {
      console.error('Failed to initialize tournaments:', error);
    }
    finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments.value));
  }

  function addTournament(data: NewTournament): Tournament {
    const now = new Date().toISOString();

    const tournament: Tournament = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    tournaments.value.push(tournament);
    saveToStorage();
    return tournament;
  }

  function updateTournament(id: string, updates: Partial<Omit<Tournament, 'id'>>): boolean {
    const index = tournaments.value.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    const current = tournaments.value[index]!;

    tournaments.value[index] = {
      ...current,
      ...updates,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };

    saveToStorage();
    return true;
  }

  function deleteTournament(id: string): boolean {
    const index = tournaments.value.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    tournaments.value.splice(index, 1);
    saveToStorage();
    return true;
  }

  function deleteTournaments(ids: string[]): number {
    const initialLength = tournaments.value.length;
    tournaments.value = tournaments.value.filter(t => !ids.includes(t.id));
    saveToStorage();
    return initialLength - tournaments.value.length;
  }

  function getTournamentById(id: string): Tournament | undefined {
    return tournaments.value.find(t => t.id === id);
  }

  function setFilters(newFilters: Partial<TournamentFilters>) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = { ...DEFAULT_TOURNAMENT_FILTERS };
  }

  function importTournaments(importedTournaments: Tournament[], replace: boolean = false) {
    if (replace) {
      tournaments.value = importedTournaments;
    }
    else {
      const existingIds = new Set(tournaments.value.map(t => t.id));
      const newTournaments = importedTournaments.filter(t => !existingIds.has(t.id));
      tournaments.value.push(...newTournaments);
    }
    saveToStorage();
  }

  function clearAll() {
    tournaments.value = [];
    saveToStorage();
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

    // Getters
    filteredTournaments,
    sortedTournaments,
    stats,
    allBuyIns,
    allVenues,

    // Actions
    initialize,
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
