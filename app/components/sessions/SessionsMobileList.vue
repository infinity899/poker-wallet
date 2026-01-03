<template>
  <div class="space-y-3">
    <NuxtLink
      v-for="session in sessions"
      :key="session.id"
      :to="`/sessions/${session.id}`"
      class="card p-4 block hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
    >
      <div class="flex justify-between items-start mb-2">
        <div>
          <p class="font-semibold text-gray-900 dark:text-gray-100">
            {{ session.game }} {{ session.stake }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(session.date) }}
          </p>
        </div>
        <p
          class="text-lg font-bold"
          :class="session.result >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
        >
          {{ formatProfit(session.result) }}
        </p>
      </div>
      <div class="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{{ session.type === 'live' ? session.location : session.site }}</span>
        <span>{{ formatDuration(session.duration) }}</span>
      </div>
      <div v-if="session.tags.length" class="mt-2 flex gap-1 flex-wrap">
        <span
          v-for="tag in session.tags"
          :key="tag"
          class="badge-gray"
        >
          {{ tag }}
        </span>
      </div>
    </NuxtLink>

    <div
      v-if="sessions.length === 0"
      class="card p-8 text-center text-gray-500 dark:text-gray-400"
    >
      No sessions yet. Add your first session!
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CashSession } from '~/types';
import { formatDate, formatDuration, formatProfit } from '~/utils/formatters';

defineProps<{
  sessions: CashSession[];
}>();
</script>
