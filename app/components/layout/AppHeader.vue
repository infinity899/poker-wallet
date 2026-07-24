<template>
  <header class="bg-surface dark:bg-surface-dark-secondary border-b border-border dark:border-border-dark h-14 px-4 flex items-center justify-between pt-safe">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-accent-600 dark:bg-accent-500 rounded-lg flex items-center justify-center">
        <span class="text-white font-semibold text-sm">P</span>
      </div>
      <h1 class="text-base font-semibold text-foreground dark:text-foreground-dark tracking-tight">
        {{ pageTitle }}
      </h1>
    </div>

    <NuxtLink
      to="/settings"
      class="p-2 rounded-md hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary transition-colors"
    >
      <Cog6ToothIcon class="w-5 h-5 text-foreground-muted dark:text-foreground-dark-muted" />
    </NuxtLink>
  </header>
</template>

<script setup lang="ts">
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';

const route = useRoute();

const pageTitle = computed(() => {
  const path = route.path;

  if (path === '/') {
    return 'Dashboard';
  }
  if (path.startsWith('/sessions/new')) {
    return 'New Session';
  }
  if (path.startsWith('/sessions/')) {
    return 'Edit Session';
  }
  if (path.startsWith('/sessions')) {
    return 'Cash Sessions';
  }
  if (path.startsWith('/tournaments/new')) {
    return 'New Tournament';
  }
  if (path.startsWith('/tournaments/')) {
    return 'Edit Tournament';
  }
  if (path.startsWith('/tournaments')) {
    return 'Tournaments';
  }
  if (path.startsWith('/trips/new')) {
    return 'New Trip';
  }
  if (path.startsWith('/trips/')) {
    return 'Trip';
  }
  if (path.startsWith('/trips')) {
    return 'Trips';
  }
  if (path.startsWith('/analytics')) {
    return 'Analytics';
  }
  if (path.startsWith('/settings')) {
    return 'Settings';
  }

  return 'Poker Wallet';
});
</script>
