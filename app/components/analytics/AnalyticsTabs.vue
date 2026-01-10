<template>
  <div class="flex gap-2">
    <button
      class="px-4 py-2 rounded-lg font-medium transition-colors"
      :class="modelValue === 'cash' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
      @click="emit('update:modelValue', 'cash')"
    >
      Cash Games
    </button>
    <button
      class="px-4 py-2 rounded-lg font-medium transition-colors"
      :class="modelValue === 'tournaments' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
      @click="emit('update:modelValue', 'tournaments')"
    >
      Tournaments
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: 'cash' | 'tournaments';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: 'cash' | 'tournaments'];
}>();
</script>
