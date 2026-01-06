<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
        My Horses
      </h1>
      <p class="text-foreground-muted dark:text-foreground-dark-muted text-sm mt-0.5">
        {{ count }} horses tracked
      </p>
    </div>
    <button class="btn-primary" @click="handleAdd">
      Add Horse
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count: number;
}>();

const emit = defineEmits<{
  add: [];
}>();

function handleAdd() {
  emit('add');
}
</script>
