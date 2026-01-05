import { useAuthStore } from '~/stores/auth';
import { useHorsesStore } from '~/stores/horses';
import { useReferenceStore } from '~/stores/reference';
import { useSessionsStore } from '~/stores/sessions';
import { useTournamentsStore } from '~/stores/tournaments';

export default defineNuxtPlugin(async () => {
  // Initialize auth store first to determine demo mode
  const authStore = useAuthStore();
  await authStore.initialize();

  // Initialize data stores
  const sessionsStore = useSessionsStore();
  const tournamentsStore = useTournamentsStore();
  const referenceStore = useReferenceStore();
  const horsesStore = useHorsesStore();

  // Initialize all stores in parallel
  await Promise.all([
    sessionsStore.initialize(),
    tournamentsStore.initialize(),
    referenceStore.initialize(),
    horsesStore.initialize(),
  ]);
});
