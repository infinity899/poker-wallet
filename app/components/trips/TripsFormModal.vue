<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="overlay flex items-center justify-center z-50 p-4"
        @click.self="emit('close')"
      >
        <div class="modal p-5 max-h-[90vh] overflow-y-auto">
          <h3 class="text-base font-semibold text-foreground dark:text-foreground-dark mb-4">
            Edit Trip
          </h3>
          <TripsForm
            :key="formKey"
            :trip="trip"
            submit-label="Save Changes"
            @submit="emit('save', $event)"
            @cancel="emit('close')"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { TripFormPayload } from './TripsForm.vue';
import type { Trip } from '~/types';

const props = defineProps<{
  isOpen: boolean;
  trip: Trip | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [payload: TripFormPayload];
}>();

// TripsForm seeds its reactive() form once at setup, so force a remount on open
// to re-read the current trip values.
const formKey = ref(0);
watch(() => props.isOpen, (open) => {
  if (open) {
    formKey.value++;
  }
}, { immediate: true });
</script>
