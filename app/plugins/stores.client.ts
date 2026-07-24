import { useAuthStore } from '~/stores/auth';
import { useCommunitiesStore } from '~/stores/communities';
import { useCurrencyStore } from '~/stores/currency';
import { useReferenceStore } from '~/stores/reference';
import { useSessionsStore } from '~/stores/sessions';
import { useTournamentsStore } from '~/stores/tournaments';
import { useTripsStore } from '~/stores/trips';

export default defineNuxtPlugin(async () => {
  // Initialize auth store first to determine demo mode
  const authStore = useAuthStore();
  await authStore.initialize();

  // Initialize currency store early (needs rates for forms)
  const currencyStore = useCurrencyStore();
  await currencyStore.initialize();

  // Initialize data stores
  const sessionsStore = useSessionsStore();
  const tournamentsStore = useTournamentsStore();
  const referenceStore = useReferenceStore();
  const communitiesStore = useCommunitiesStore();
  const tripsStore = useTripsStore();

  // Initialize all stores in parallel
  await Promise.all([
    sessionsStore.initialize(),
    tournamentsStore.initialize(),
    referenceStore.initialize(),
    communitiesStore.initialize(),
    tripsStore.initialize(),
  ]);
});
