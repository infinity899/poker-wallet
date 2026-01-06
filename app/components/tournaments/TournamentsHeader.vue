<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
        Tournaments
      </h1>
      <p class="text-foreground-muted dark:text-foreground-dark-muted text-sm mt-0.5">
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
