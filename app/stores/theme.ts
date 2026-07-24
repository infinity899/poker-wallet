import { defineStore } from 'pinia';

const STORAGE_KEY = 'poker-wallet-theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useThemeStore = defineStore('theme', () => {
  // State
  const mode = ref<ThemeMode>('system');
  const isDark = ref(false);

  // Initialize theme from localStorage and system preference
  function initialize() {
    if (typeof window === 'undefined') {
      return;
    }

    // Load saved preference
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      mode.value = saved;
    }

    // Apply theme
    applyTheme();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (mode.value === 'system') {
        applyTheme();
      }
    });
  }

  function setMode(newMode: ThemeMode) {
    mode.value = newMode;
    localStorage.setItem(STORAGE_KEY, newMode);
    applyTheme();
  }

  function applyTheme() {
    if (typeof window === 'undefined') {
      return;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = mode.value === 'dark' || (mode.value === 'system' && prefersDark);

    // Swap the class BEFORE publishing `isDark`, so anything that re-reads the
    // CSS token layer off that ref (useThemeTokens -> Chart.js colors) sees the
    // new custom-property values rather than the outgoing theme's.
    document.documentElement.classList.toggle('dark', shouldBeDark);

    isDark.value = shouldBeDark;
  }

  function toggle() {
    if (mode.value === 'light') {
      setMode('dark');
    }
    else if (mode.value === 'dark') {
      setMode('light');
    }
    else {
      // System mode: toggle to opposite of current
      setMode(isDark.value ? 'light' : 'dark');
    }
  }

  return {
    // State
    mode: readonly(mode),
    isDark: readonly(isDark),

    // Actions
    initialize,
    setMode,
    toggle,
  };
});
