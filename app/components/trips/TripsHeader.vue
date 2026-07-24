<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
        Trips
      </h1>
      <p class="text-foreground-muted dark:text-foreground-dark-muted text-sm mt-0.5">
        {{ count }} {{ count === 1 ? 'trip' : 'trips' }}
      </p>
    </div>
    <div class="flex gap-2">
      <div class="relative flex-1 sm:flex-none sm:w-56">
        <MagnifyingGlassIcon
          class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-faint dark:text-foreground-dark-faint pointer-events-none"
        />
        <input
          :value="search"
          type="search"
          placeholder="Search trips..."
          class="input pl-8"
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <NuxtLink to="/trips/new" class="btn-primary shrink-0">
        <PlusIcon class="w-4 h-4" />
        <span class="hidden sm:inline ml-1.5">New Trip</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/vue/24/outline';

defineProps<{
  count: number;
  search: string;
}>();

const emit = defineEmits<{
  'update:search': [value: string];
}>();
</script>
