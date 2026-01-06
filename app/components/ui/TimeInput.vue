<template>
  <div
    class="time-input-wrapper"
    :class="{ 'time-input-error': error }"
    @click="openPicker"
  >
    <ClockIcon class="time-input-icon" />
    <input
      ref="inputRef"
      type="time"
      :value="modelValue"
      class="time-input-native"
      @input="handleInput"
      @change="handleChange"
    >
    <span v-if="modelValue" class="time-input-display font-mono">
      {{ formattedTime }}
    </span>
    <span v-else class="time-input-placeholder">
      {{ placeholder }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ClockIcon } from '@heroicons/vue/24/outline';

const props = withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
  error?: boolean;
}>(), {
  placeholder: 'Select time',
  error: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'change': [value: string];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const formattedTime = computed(() => {
  if (!props.modelValue) {
    return '';
  }
  const [hours, minutes] = props.modelValue.split(':');
  const h = Number.parseInt(hours || '0', 10);
  const m = minutes || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
});

function openPicker() {
  inputRef.value?.showPicker?.();
  inputRef.value?.focus();
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('change', target.value);
}
</script>

<style scoped>
.time-input-wrapper {
  @apply relative flex items-center gap-2 w-full px-3 py-2
         bg-surface text-foreground
         border border-border-strong rounded-md
         cursor-pointer transition-colors duration-150
         hover:border-foreground-faint
         focus-within:border-accent-500 focus-within:ring-1 focus-within:ring-accent-500;
  @apply dark:bg-surface-dark-secondary dark:text-foreground-dark
         dark:border-border-dark-strong
         dark:hover:border-foreground-dark-faint
         dark:focus-within:border-accent-400 dark:focus-within:ring-accent-400;
}

.time-input-wrapper.time-input-error {
  @apply border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500;
  @apply dark:border-danger-400 dark:focus-within:border-danger-400 dark:focus-within:ring-danger-400;
}

.time-input-icon {
  @apply w-4 h-4 text-foreground-muted shrink-0;
  @apply dark:text-foreground-dark-muted;
}

.time-input-native {
  @apply absolute inset-0 opacity-0 cursor-pointer w-full;
  /* Ensure the native picker is still accessible */
}

.time-input-display {
  @apply text-sm text-foreground tabular-nums;
  @apply dark:text-foreground-dark;
}

.time-input-placeholder {
  @apply text-sm text-foreground-faint;
  @apply dark:text-foreground-dark-faint;
}
</style>
