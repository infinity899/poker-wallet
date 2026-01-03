import { useThemeStore } from '~/stores/theme';

export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore();
  themeStore.initialize();
});
