import type { LocalStorageReferenceAdapter, SupabaseReferenceAdapter } from '~/adapters/referenceAdapter';
import type { Result, Tag, Venue } from '~/types';
import { defineStore } from 'pinia';
import { createReferenceAdapter } from '~/adapters/referenceAdapter';
import { useTypedSupabaseClient } from '~/composables/useTypedSupabase';
import {
  DEFAULT_CURRENCIES,
  DEFAULT_GAME_TYPES,
  DEFAULT_TAGS,
  DEFAULT_VENUES,
} from '~/types';

export const useReferenceStore = defineStore('reference', () => {
  const supabase = useTypedSupabaseClient();
  const user = useSupabaseUser();

  // State
  const venues = ref<Venue[]>([]);
  const tags = ref<Tag[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const error = ref<string | null>(null);

  // Constants
  const currencies = DEFAULT_CURRENCIES;
  const gameTypes = DEFAULT_GAME_TYPES;

  // Get auth store (lazy to avoid circular dependency)
  const getAuthStore = () => useAuthStore();

  // Check if we're in demo mode
  const isDemoMode = computed(() => getAuthStore().isDemoMode);

  // Get the appropriate adapter based on mode
  function getAdapter(): LocalStorageReferenceAdapter | SupabaseReferenceAdapter {
    return createReferenceAdapter(
      isDemoMode.value,
      supabase,
      user.value?.sub,
    );
  }

  // Getters
  const liveVenues = computed(() =>
    venues.value.filter(v => v.type === 'live'),
  );

  const onlineSites = computed(() =>
    venues.value.filter(v => v.type === 'online'),
  );

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

      venues.value = data.venues;
      tags.value = data.tags;
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load reference data';
      error.value = message;
      console.error('Failed to initialize reference data:', e);

      // Fall back to defaults on error
      venues.value = [...DEFAULT_VENUES];
      tags.value = [...DEFAULT_TAGS];
    }
    finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function reload(): Promise<void> {
    initialized.value = false;
    venues.value = [];
    tags.value = [];
    error.value = null;
    await initialize();
  }

  async function saveToAdapter(): Promise<void> {
    try {
      const adapter = getAdapter();
      await adapter.saveAll({ venues: venues.value, tags: tags.value });
    }
    catch (e) {
      console.error('Failed to save reference data:', e);
      throw e;
    }
  }

  // Venue actions
  async function addVenue(venue: Omit<Venue, 'id'>): Promise<Result<Venue>> {
    try {
      const newVenue: Venue = {
        ...venue,
        id: crypto.randomUUID(),
      };
      venues.value.push(newVenue);
      await saveToAdapter();
      return { success: true, data: newVenue };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add venue';
      return { success: false, error: new Error(message) };
    }
  }

  async function updateVenue(id: string, updates: Partial<Omit<Venue, 'id'>>): Promise<Result<Venue>> {
    try {
      const index = venues.value.findIndex(v => v.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Venue not found') };
      }

      const current = venues.value[index]!;
      const updated: Venue = {
        id: current.id,
        name: updates.name ?? current.name,
        type: updates.type ?? current.type,
        location: updates.location !== undefined ? updates.location : current.location,
      };
      venues.value[index] = updated;
      await saveToAdapter();
      return { success: true, data: updated };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update venue';
      return { success: false, error: new Error(message) };
    }
  }

  async function deleteVenue(id: string): Promise<Result<void>> {
    try {
      const index = venues.value.findIndex(v => v.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Venue not found') };
      }

      venues.value.splice(index, 1);
      await saveToAdapter();
      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete venue';
      return { success: false, error: new Error(message) };
    }
  }

  function getVenueById(id: string): Venue | undefined {
    return venues.value.find(v => v.id === id);
  }

  function getVenueByName(name: string): Venue | undefined {
    return venues.value.find(v => v.name.toLowerCase() === name.toLowerCase());
  }

  // Tag actions
  async function addTag(tag: Omit<Tag, 'id'>): Promise<Result<Tag>> {
    try {
      const newTag: Tag = {
        ...tag,
        id: crypto.randomUUID(),
      };
      tags.value.push(newTag);
      await saveToAdapter();
      return { success: true, data: newTag };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add tag';
      return { success: false, error: new Error(message) };
    }
  }

  async function updateTag(id: string, updates: Partial<Omit<Tag, 'id'>>): Promise<Result<Tag>> {
    try {
      const index = tags.value.findIndex(t => t.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Tag not found') };
      }

      const current = tags.value[index]!;
      const updated: Tag = {
        id: current.id,
        name: updates.name ?? current.name,
        color: updates.color ?? current.color,
      };
      tags.value[index] = updated;
      await saveToAdapter();
      return { success: true, data: updated };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update tag';
      return { success: false, error: new Error(message) };
    }
  }

  async function deleteTag(id: string): Promise<Result<void>> {
    try {
      const index = tags.value.findIndex(t => t.id === id);
      if (index === -1) {
        return { success: false, error: new Error('Tag not found') };
      }

      tags.value.splice(index, 1);
      await saveToAdapter();
      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete tag';
      return { success: false, error: new Error(message) };
    }
  }

  function getTagById(id: string): Tag | undefined {
    return tags.value.find(t => t.id === id);
  }

  function getTagByName(name: string): Tag | undefined {
    return tags.value.find(t => t.name.toLowerCase() === name.toLowerCase());
  }

  // Reset to defaults
  async function resetToDefaults(): Promise<Result<void>> {
    try {
      venues.value = [...DEFAULT_VENUES];
      tags.value = [...DEFAULT_TAGS];
      await saveToAdapter();
      return { success: true, data: undefined };
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to reset to defaults';
      return { success: false, error: new Error(message) };
    }
  }

  return {
    // State
    venues: readonly(venues),
    tags: readonly(tags),
    currencies,
    gameTypes,
    loading: readonly(loading),
    initialized: readonly(initialized),
    error: readonly(error),

    // Getters
    liveVenues,
    onlineSites,

    // Actions
    initialize,
    reload,
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
