import { useHorsesStore } from '~/stores/horses';
import { useReferenceStore } from '~/stores/reference';
import { useSessionsStore } from '~/stores/sessions';
import { useTournamentsStore } from '~/stores/tournaments';

export default defineNuxtPlugin(async () => {
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
