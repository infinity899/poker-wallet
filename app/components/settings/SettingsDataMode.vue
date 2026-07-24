<template>
  <div class="card p-6">
    <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Data Storage
    </h2>

    <div v-if="!authStore.isAuthenticated" class="text-gray-500 dark:text-gray-400">
      <p>Sign in to sync your data to the cloud.</p>
      <NuxtLink
        to="/auth/login"
        class="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block"
      >
        Sign in
      </NuxtLink>
    </div>

    <div v-else class="space-y-3">
      <button
        v-for="option in dataOptions"
        :key="option.value"
        class="w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors"
        :class="[
          authStore.isDemoMode === option.isDemo
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        ]"
        :disabled="loading"
        @click="setDataMode(option.isDemo)"
      >
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center"
          :class="option.iconBg"
        >
          <component :is="option.icon" class="w-5 h-5" :class="option.iconColor" />
        </div>
        <div class="flex-1 text-left">
          <p class="font-medium text-gray-900 dark:text-gray-100">
            {{ option.label }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ option.description }}
          </p>
        </div>
        <div
          v-if="authStore.isDemoMode === option.isDemo"
          class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
        >
          <CheckIcon class="w-3 h-3 text-white" />
        </div>
      </button>

      <p v-if="authStore.isDemoMode" class="text-sm text-amber-600 dark:text-amber-400 mt-4">
        Demo mode uses sample data stored locally. Switch to Cloud Storage to save your real data.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, CloudIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline';

const authStore = useAuthStore();
const sessionsStore = useSessionsStore();
const tournamentsStore = useTournamentsStore();
const communitiesStore = useCommunitiesStore();
const tripsStore = useTripsStore();

const loading = ref(false);

const dataOptions = [
  {
    value: 'cloud',
    isDemo: false,
    label: 'Cloud Storage',
    description: 'Sync your data to Supabase (recommended)',
    icon: CloudIcon,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'demo',
    isDemo: true,
    label: 'Demo Mode',
    description: 'Use sample data stored locally in your browser',
    icon: ComputerDesktopIcon,
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-gray-400',
  },
];

async function setDataMode(isDemo: boolean) {
  if (loading.value) {
    return;
  }

  loading.value = true;
  try {
    await authStore.setDemoMode(isDemo);
    // Reload stores to fetch data from correct source
    await Promise.all([
      sessionsStore.reload(),
      tournamentsStore.reload(),
      communitiesStore.reload(),
      tripsStore.reload(),
    ]);
  }
  finally {
    loading.value = false;
  }
}
</script>
