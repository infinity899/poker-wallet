<template>
  <div class="p-4 lg:p-0 max-w-2xl mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/trips"
        class="p-2 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded-md transition-colors"
      >
        <ArrowLeftIcon class="w-5 h-5 text-foreground-muted dark:text-foreground-dark-muted" />
      </NuxtLink>
      <h1 class="text-xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
        New Trip
      </h1>
    </div>

    <TripsForm submit-label="Create Trip" @submit="handleSubmit" @cancel="router.push('/trips')" />
  </div>
</template>

<script setup lang="ts">
import type { TripFormPayload } from '~/components/trips/TripsForm.vue';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const tripsStore = useTripsStore();
const router = useRouter();
const toast = useToast();

async function handleSubmit(payload: TripFormPayload) {
  const result = await tripsStore.addTrip({
    ...payload,
    tournamentIds: [],
    tags: [],
  });

  if (result.success) {
    toast.success('Trip created');
    // Land on the detail page so the next step (linking tournaments) is obvious.
    router.push(`/trips/${result.data.id}`);
  }
  else {
    toast.error(result.error.message);
  }
}
</script>
