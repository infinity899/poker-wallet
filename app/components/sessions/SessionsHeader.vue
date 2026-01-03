<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
        Cash Sessions
      </h1>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
        {{ count }} sessions
      </p>
    </div>
    <NuxtLink to="/sessions/new" class="btn-primary">
      Add Session
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count: number;
}>();
</script>
