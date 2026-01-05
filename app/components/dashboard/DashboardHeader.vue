<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
        Dashboard
      </h1>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
        Your poker performance at a glance
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
        :class="showCash ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
        @click="emit('update:showCash', !showCash)"
      >
        Cash
      </button>
      <button
        class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
        :class="showTournaments ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
        @click="emit('update:showTournaments', !showTournaments)"
      >
        MTTs
      </button>
      <button
        class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
        :class="showHorses ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
        @click="emit('update:showHorses', !showHorses)"
      >
        Horses
      </button>
      <button
        class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
        :class="showLive ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
        @click="emit('update:showLive', !showLive)"
      >
        Live
      </button>
      <button
        class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
        :class="showOnline ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
        @click="emit('update:showOnline', !showOnline)"
      >
        Online
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showCash: boolean;
  showTournaments: boolean;
  showHorses: boolean;
  showLive: boolean;
  showOnline: boolean;
}>();

const emit = defineEmits<{
  'update:showCash': [value: boolean];
  'update:showTournaments': [value: boolean];
  'update:showHorses': [value: boolean];
  'update:showLive': [value: boolean];
  'update:showOnline': [value: boolean];
}>();
</script>
