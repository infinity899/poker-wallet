<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
        Dashboard
      </h1>
      <p class="text-foreground-muted dark:text-foreground-dark-muted text-sm mt-0.5">
        Your poker performance at a glance
      </p>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <button
        class="filter-chip"
        :class="{ 'filter-chip-active': showCash }"
        @click="emit('update:showCash', !showCash)"
      >
        Cash
      </button>
      <button
        class="filter-chip"
        :class="showTournaments ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700/50' : ''"
        @click="emit('update:showTournaments', !showTournaments)"
      >
        MTTs
      </button>
      <button
        class="filter-chip"
        :class="showLive ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/50' : ''"
        @click="emit('update:showLive', !showLive)"
      >
        Live
      </button>
      <button
        class="filter-chip"
        :class="showOnline ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50' : ''"
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
  showLive: boolean;
  showOnline: boolean;
}>();

const emit = defineEmits<{
  'update:showCash': [value: boolean];
  'update:showTournaments': [value: boolean];
  'update:showLive': [value: boolean];
  'update:showOnline': [value: boolean];
}>();
</script>
