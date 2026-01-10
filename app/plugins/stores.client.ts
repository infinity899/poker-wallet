import { useAuthStore } from '~/stores/auth';
import { useCommunitiesStore } from '~/stores/communities';
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
  const communitiesStore = useCommunitiesStore();

  // Initialize all stores in parallel
  await Promise.all([
    sessionsStore.initialize(),
    tournamentsStore.initialize(),
    referenceStore.initialize(),
    communitiesStore.initialize(),
  ]);
});
