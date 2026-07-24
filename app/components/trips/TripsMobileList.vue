<template>
  <div class="space-y-3">
    <TripsCard
      v-for="trip in trips"
      :key="trip.id"
      :trip="trip"
      :pnl="pnlById.get(trip.id)!"
      @delete="emit('delete', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Trip, TripPnL } from '~/types';

defineProps<{
  trips: Trip[];
  pnlById: Map<string, TripPnL>;
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();
</script>
