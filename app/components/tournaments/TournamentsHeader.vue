<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
        Tournaments
      </h1>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
        {{ count }} tournaments
      </p>
    </div>
    <div class="flex gap-2">
      <button class="btn-secondary" @click="emit('logSession')">
        Log Session
      </button>
      <NuxtLink to="/tournaments/new" class="btn-primary">
        Add Tournament
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count: number;
}>();

const emit = defineEmits<{
  logSession: [];
}>();
</script>
