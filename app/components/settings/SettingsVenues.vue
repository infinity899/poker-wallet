<template>
  <div class="card p-6">
    <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Venues & Sites
    </h2>

    <div class="flex flex-col sm:flex-row gap-2 mb-4">
      <input
        v-model="newVenue.name"
        type="text"
        placeholder="Venue name"
        class="input flex-1"
      >
      <select v-model="newVenue.type" class="input sm:w-32">
        <option value="live">
          Live
        </option>
        <option value="online">
          Online
        </option>
      </select>
      <input
        v-if="newVenue.type === 'live'"
        v-model="newVenue.location"
        type="text"
        placeholder="Location"
        class="input sm:w-40"
      >
      <button class="btn-primary" @click="addVenue">
        <PlusIcon class="w-5 h-5" />
      </button>
    </div>

    <div class="space-y-2">
      <div
        v-for="venue in referenceStore.venues"
        :key="venue.id"
        class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
      >
        <div>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{ venue.name }}</span>
          <span
            class="ml-2 badge"
            :class="venue.type === 'live' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'"
          >
            {{ venue.type }}
          </span>
          <span v-if="venue.location" class="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {{ venue.location }}
          </span>
        </div>
        <button class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" @click="referenceStore.deleteVenue(venue.id)">
          <TrashIcon class="w-4 h-4 text-danger-500" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline';

const referenceStore = useReferenceStore();

const newVenue = reactive({
  name: '',
  type: 'live' as 'live' | 'online',
  location: '',
});

function addVenue() {
  if (!newVenue.name.trim()) {
    return;
  }

  referenceStore.addVenue({
    name: newVenue.name.trim(),
    type: newVenue.type,
    location: newVenue.type === 'live' ? newVenue.location.trim() : undefined,
  });

  newVenue.name = '';
  newVenue.location = '';
}
</script>
