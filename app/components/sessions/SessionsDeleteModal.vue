<template>
  <Teleport to="body">
    <div
      v-if="sessionId"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="emit('cancel')"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Delete Session?
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button class="btn-secondary flex-1" @click="emit('cancel')">
            Cancel
          </button>
          <button class="btn-danger flex-1" @click="emit('confirm')">
            Delete
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  sessionId: string | null;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>
