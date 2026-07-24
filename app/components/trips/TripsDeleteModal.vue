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
        v-if="trip"
        class="overlay flex items-center justify-center z-50 p-4"
        @click.self="emit('cancel')"
      >
        <div class="modal max-w-sm p-5">
          <h3 class="text-base font-semibold text-foreground dark:text-foreground-dark mb-2">
            Delete trip?
          </h3>
          <p class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-5">
            "{{ trip.name }}" and its {{ expenseCount }}
            {{ expenseCount === 1 ? 'expense' : 'expenses' }} will be permanently removed.
            Linked tournaments are <strong class="font-medium">not</strong> deleted &mdash; they stay
            in your tournament history. This cannot be undone.
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
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Trip } from '~/types';

const props = defineProps<{
  trip: Trip | null;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const tripsStore = useTripsStore();

const expenseCount = computed(() =>
  props.trip ? tripsStore.getTripExpenses(props.trip.id).length : 0);
</script>
