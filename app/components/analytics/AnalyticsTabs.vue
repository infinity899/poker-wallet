<template>
  <div class="inline-flex gap-1 p-1 rounded-lg bg-surface-secondary border border-border dark:bg-surface-dark-secondary dark:border-border-dark">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      :class="modelValue === tab.value
        ? 'bg-accent-600 text-white shadow-sm dark:bg-accent-500'
        : 'text-foreground-secondary hover:text-foreground hover:bg-surface-tertiary dark:text-foreground-dark-secondary dark:hover:text-foreground-dark dark:hover:bg-surface-dark-tertiary'"
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
type TabValue = 'cash' | 'tournaments';

defineProps<{
  modelValue: TabValue;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: TabValue];
}>();

const tabs: { value: TabValue; label: string }[] = [
  { value: 'tournaments', label: 'Tournaments' },
  { value: 'cash', label: 'Cash Games' },
];
</script>
