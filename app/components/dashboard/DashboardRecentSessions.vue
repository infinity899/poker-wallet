<template>
  <div class="card">
    <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
      <h2 class="font-semibold text-gray-900 dark:text-gray-100">
        Recent Sessions
      </h2>
      <NuxtLink
        to="/sessions"
        class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        View all
      </NuxtLink>
    </div>
    <div class="divide-y divide-gray-100 dark:divide-gray-700">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ session.game }} {{ session.stake }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ session.type === 'live' ? session.location : session.site }}
            </p>
          </div>
          <div class="text-right">
            <p
              class="font-semibold"
              :class="session.result >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ formatProfit(session.result) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDuration(session.duration) }}
            </p>
          </div>
        </div>
      </div>
      <div
        v-if="sessions.length === 0"
        class="p-8 text-center text-gray-500 dark:text-gray-400"
      >
        No sessions yet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CashSession } from '~/types';
import { formatDuration, formatProfit } from '~/utils/formatters';

defineProps<{
  sessions: CashSession[];
}>();
</script>
