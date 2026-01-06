<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
        Cash Sessions
      </h1>
      <p class="text-foreground-muted dark:text-foreground-dark-muted text-sm mt-0.5">
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
