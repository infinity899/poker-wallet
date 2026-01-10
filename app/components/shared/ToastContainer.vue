<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] backdrop-blur-sm"
          :class="{
            'bg-green-600/95 text-white': toast.type === 'success',
            'bg-red-600/95 text-white': toast.type === 'error',
            'bg-blue-600/95 text-white': toast.type === 'info',
            'bg-yellow-500/95 text-gray-900': toast.type === 'warning',
          }"
        >
          <!-- Icon -->
          <span class="text-lg flex-shrink-0">
            <template v-if="toast.type === 'success'">&#10003;</template>
            <template v-else-if="toast.type === 'error'">&#10007;</template>
            <template v-else-if="toast.type === 'info'">&#8505;</template>
            <template v-else-if="toast.type === 'warning'">&#9888;</template>
          </span>

          <!-- Message -->
          <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>

          <!-- Dismiss button -->
          <button
            class="opacity-70 hover:opacity-100 transition-opacity p-1 -mr-1"
            @click="dismiss(toast.id)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { toasts, dismiss } = useToast();
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
