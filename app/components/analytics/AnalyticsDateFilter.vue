<template>
  <div class="inline-flex max-w-full gap-1 p-1 rounded-lg bg-surface-secondary border border-border overflow-x-auto dark:bg-surface-dark-secondary dark:border-border-dark">
    <button
      v-for="preset in presets"
      :key="preset.value"
      type="button"
      class="px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      :class="modelValue === preset.value
        ? 'bg-accent-600 text-white shadow-sm dark:bg-accent-500'
        : 'text-foreground-muted hover:text-foreground hover:bg-surface-tertiary dark:text-foreground-dark-muted dark:hover:text-foreground-dark dark:hover:bg-surface-dark-tertiary'"
      @click="emit('update:modelValue', preset.value)"
    >
      {{ preset.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DateRangePreset } from '~/types';

type AnalyticsPreset = Exclude<DateRangePreset, 'custom'>;

defineProps<{
  modelValue: AnalyticsPreset;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: AnalyticsPreset];
}>();

const presets: { value: AnalyticsPreset; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'ytd', label: 'YTD' },
  { value: '12m', label: '12M' },
  { value: 'lifetime', label: 'All' },
];
</script>
