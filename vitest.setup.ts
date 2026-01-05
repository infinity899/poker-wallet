import { vi } from 'vitest';
import { computed, readonly, ref } from 'vue';

// Provide Vue globals that Nuxt auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('computed', computed);
vi.stubGlobal('readonly', readonly);

// Mock Supabase composables
vi.stubGlobal('useSupabaseClient', () => ({
  from: () => ({
    select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
    insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }) }),
    delete: () => ({ eq: () => ({ eq: () => ({ error: null }) }) }),
  }),
  auth: {
    signOut: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
  },
}));

vi.stubGlobal('useSupabaseUser', () => ref(null));

// Mock auth store for tests that need it
vi.stubGlobal('useAuthStore', () => ({
  isDemoMode: true,
  isAuthenticated: false,
  currentUser: null,
  settings: null,
  loading: false,
  initialized: true,
  initialize: () => Promise.resolve(),
  setDemoMode: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
}));

// Mock navigateTo
vi.stubGlobal('navigateTo', () => Promise.resolve());
