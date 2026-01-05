import type { User } from '@supabase/supabase-js';
import type { DbUserSettings } from '~/types';
import { defineStore } from 'pinia';
import { useTypedSupabaseClient } from '~/composables/useTypedSupabase';

export const useAuthStore = defineStore('auth', () => {
  const supabase = useTypedSupabaseClient();
  const user = useSupabaseUser();

  // State
  const settings = ref<DbUserSettings | null>(null);
  const loading = ref(false);
  const initialized = ref(false);

  // Promise that resolves when settings are loaded (for other stores to await)
  let settingsLoadedResolve: (() => void) | null = null;
  const settingsLoaded = new Promise<void>((resolve) => {
    settingsLoadedResolve = resolve;
  });

  // Demo mode: true = show mock data, false = use database only
  const isDemoMode = computed(() => {
    // If not logged in, always demo mode
    if (!user.value) {
      return true;
    }
    // If logged in, check user settings
    return settings.value?.is_demo_mode ?? true;
  });

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!user.value);

  // Get current user (cast needed due to Supabase types)
  const currentUser = computed<User | null>(() => user.value as User | null);

  // Initialize auth state
  async function initialize() {
    if (initialized.value) {
      return;
    }

    loading.value = true;
    try {
      // Note: useSupabaseUser returns JWT payload where user ID is in 'sub' field
      if (user.value?.sub) {
        await loadUserSettings();
      }
    }
    catch (error) {
      console.error('Failed to initialize auth:', error);
    }
    finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  // Load user settings from database (create if not exists)
  async function loadUserSettings() {
    // Wait for user to be fully hydrated - useSupabaseUser returns JWT payload where ID is 'sub'
    const userId = user.value?.sub;
    if (!userId) {
      return;
    }

    try {
      // Try to get existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No settings found - create default settings
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            is_demo_mode: true,
            default_currency: 'USD',
            theme: 'dark',
          } as any)
          .select()
          .single();

        if (insertError) {
          console.error('Failed to create user settings:', insertError);
          return;
        }

        settings.value = newSettings as DbUserSettings;

        // Also create default reference data
        await supabase.from('reference_data').insert({
          user_id: userId,
          venues: ['Bellagio', 'Aria', 'Venetian', 'Commerce Casino', 'Wynn'],
          sites: ['PokerStars', 'GGPoker', 'partypoker', 'WPT Global', '888poker'],
          tags: ['Good Run', 'Bad Beat', 'Deepstack', 'Turbo', 'Bounty'],
        } as any);

        return;
      }

      if (error) {
        throw error;
      }

      if (data) {
        settings.value = data as DbUserSettings;
      }
    }
    catch (error) {
      console.error('Failed to load user settings:', error);
    }
  }

  // Toggle demo mode (only when authenticated)
  async function setDemoMode(enabled: boolean) {
    // useSupabaseUser returns JWT payload where ID is 'sub'
    const userId = user.value?.sub;
    if (!userId) {
      console.error('Cannot set demo mode: user not authenticated');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ is_demo_mode: enabled } as any)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      if (settings.value) {
        settings.value.is_demo_mode = enabled;
      }

      // If disabling demo mode, clear localStorage mock data
      if (!enabled) {
        clearMockData();
      }
    }
    catch (error) {
      console.error('Failed to update demo mode:', error);
    }
  }

  // Clear mock data from localStorage
  function clearMockData() {
    localStorage.removeItem('poker-wallet-sessions');
    localStorage.removeItem('poker-wallet-tournaments');
    localStorage.removeItem('poker-wallet-horses');
    localStorage.removeItem('poker-wallet-horse-transactions');
    localStorage.removeItem('poker-wallet-reference');
  }

  // Sign out
  async function signOut() {
    try {
      await supabase.auth.signOut();
      settings.value = null;
      // Redirect to login
      navigateTo('/auth/login');
    }
    catch (error) {
      console.error('Failed to sign out:', error);
    }
  }

  // Watch for auth state changes - use immediate to catch initial hydration
  // Note: useSupabaseUser returns JWT payload where user ID is in 'sub' field
  watch(
    () => user.value?.sub,
    async (newUserId) => {
      if (newUserId) {
        await loadUserSettings();
        // Resolve the promise so other stores know settings are ready
        if (settingsLoadedResolve) {
          settingsLoadedResolve();
          settingsLoadedResolve = null;
        }
      }
      else {
        settings.value = null;
      }
    },
    { immediate: true },
  );

  // Helper function for other stores to wait for settings to be loaded
  async function waitForSettings(): Promise<void> {
    // Wait for user to be populated (may be null briefly during hydration)
    let waitAttempts = 0;
    while (!user.value?.sub && waitAttempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitAttempts++;
    }

    // If still no user after waiting, we're in demo mode
    if (!user.value?.sub) {
      return;
    }

    // If settings already loaded, resolve immediately
    if (settings.value) {
      return;
    }

    // Otherwise wait for the promise
    await settingsLoaded;
  }

  return {
    // State
    settings: readonly(settings),
    loading: readonly(loading),
    initialized: readonly(initialized),

    // Getters
    isDemoMode,
    isAuthenticated,
    currentUser,

    // Actions
    initialize,
    loadUserSettings,
    setDemoMode,
    clearMockData,
    signOut,
    waitForSettings,
  };
});
