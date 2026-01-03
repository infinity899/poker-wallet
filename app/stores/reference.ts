import type { Tag, Venue } from '~/types';
import { defineStore } from 'pinia';
import {
  DEFAULT_CURRENCIES,
  DEFAULT_GAME_TYPES,
  DEFAULT_TAGS,
  DEFAULT_VENUES,
} from '~/types';

const STORAGE_KEY = 'poker-wallet-reference';

interface ReferenceState {
  venues: Venue[];
  tags: Tag[];
}

export const useReferenceStore = defineStore('reference', () => {
  // State
  const venues = ref<Venue[]>([]);
  const tags = ref<Tag[]>([]);
  const initialized = ref(false);

  // Constants
  const currencies = DEFAULT_CURRENCIES;
  const gameTypes = DEFAULT_GAME_TYPES;

  // Getters
  const liveVenues = computed(() =>
    venues.value.filter(v => v.type === 'live'),
  );

  const onlineSites = computed(() =>
    venues.value.filter(v => v.type === 'online'),
  );

  // Actions
  async function initialize() {
    if (initialized.value) {
      return;
    }

    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: ReferenceState = JSON.parse(stored);
        venues.value = data.venues;
        tags.value = data.tags;
      }
      else {
        // Try to load from mock data, fall back to defaults
        try {
          const response = await fetch('/data/reference.json');
          if (response.ok) {
            const data = await response.json();
            venues.value = data.venues || DEFAULT_VENUES;
            tags.value = data.tags || DEFAULT_TAGS;
          }
          else {
            useDefaults();
          }
        }
        catch {
          useDefaults();
        }
        saveToStorage();
      }
    }
    catch (error) {
      console.error('Failed to initialize reference data:', error);
      useDefaults();
    }
    finally {
      initialized.value = true;
    }
  }

  function useDefaults() {
    venues.value = [...DEFAULT_VENUES];
    tags.value = [...DEFAULT_TAGS];
  }

  function saveToStorage() {
    const data: ReferenceState = {
      venues: venues.value,
      tags: tags.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // Venue actions
  function addVenue(venue: Omit<Venue, 'id'>): Venue {
    const newVenue: Venue = {
      ...venue,
      id: crypto.randomUUID(),
    };
    venues.value.push(newVenue);
    saveToStorage();
    return newVenue;
  }

  function updateVenue(id: string, updates: Partial<Omit<Venue, 'id'>>): boolean {
    const index = venues.value.findIndex(v => v.id === id);
    if (index === -1) {
      return false;
    }

    const current = venues.value[index]!;
    venues.value[index] = {
      id: current.id,
      name: updates.name ?? current.name,
      type: updates.type ?? current.type,
      location: updates.location !== undefined ? updates.location : current.location,
    };
    saveToStorage();
    return true;
  }

  function deleteVenue(id: string): boolean {
    const index = venues.value.findIndex(v => v.id === id);
    if (index === -1) {
      return false;
    }

    venues.value.splice(index, 1);
    saveToStorage();
    return true;
  }

  function getVenueById(id: string): Venue | undefined {
    return venues.value.find(v => v.id === id);
  }

  function getVenueByName(name: string): Venue | undefined {
    return venues.value.find(v => v.name.toLowerCase() === name.toLowerCase());
  }

  // Tag actions
  function addTag(tag: Omit<Tag, 'id'>): Tag {
    const newTag: Tag = {
      ...tag,
      id: crypto.randomUUID(),
    };
    tags.value.push(newTag);
    saveToStorage();
    return newTag;
  }

  function updateTag(id: string, updates: Partial<Omit<Tag, 'id'>>): boolean {
    const index = tags.value.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    const current = tags.value[index]!;
    tags.value[index] = {
      id: current.id,
      name: updates.name ?? current.name,
      color: updates.color ?? current.color,
    };
    saveToStorage();
    return true;
  }

  function deleteTag(id: string): boolean {
    const index = tags.value.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    tags.value.splice(index, 1);
    saveToStorage();
    return true;
  }

  function getTagById(id: string): Tag | undefined {
    return tags.value.find(t => t.id === id);
  }

  function getTagByName(name: string): Tag | undefined {
    return tags.value.find(t => t.name.toLowerCase() === name.toLowerCase());
  }

  // Reset to defaults
  function resetToDefaults() {
    useDefaults();
    saveToStorage();
  }

  return {
    // State
    venues: readonly(venues),
    tags: readonly(tags),
    currencies,
    gameTypes,
    initialized: readonly(initialized),

    // Getters
    liveVenues,
    onlineSites,

    // Actions
    initialize,
    addVenue,
    updateVenue,
    deleteVenue,
    getVenueById,
    getVenueByName,
    addTag,
    updateTag,
    deleteTag,
    getTagById,
    getTagByName,
    resetToDefaults,
  };
});
