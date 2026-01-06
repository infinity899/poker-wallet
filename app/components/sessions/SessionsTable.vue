<template>
  <div class="card overflow-hidden">
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Game</th>
            <th>Stakes</th>
            <th>Venue/Site</th>
            <th>Duration</th>
            <th class="text-right">
              Result
            </th>
            <th class="text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="session in sessions"
            :key="session.id"
          >
            <td class="whitespace-nowrap text-foreground dark:text-foreground-dark">
              {{ formatDate(session.date) }}
            </td>
            <td class="whitespace-nowrap">
              <span
                class="badge"
                :class="session.type === 'live'
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'"
              >
                {{ session.type }}
              </span>
            </td>
            <td class="whitespace-nowrap text-foreground dark:text-foreground-dark">
              {{ session.game }}
            </td>
            <td class="whitespace-nowrap text-foreground dark:text-foreground-dark font-mono text-xs">
              {{ session.stake }}
            </td>
            <td class="whitespace-nowrap text-foreground-muted dark:text-foreground-dark-muted">
              {{ session.type === 'live' ? session.location : session.site }}
            </td>
            <td class="whitespace-nowrap text-foreground-muted dark:text-foreground-dark-muted">
              {{ formatDuration(session.duration) }}
            </td>
            <td
              class="whitespace-nowrap text-right font-semibold data-value"
              :class="session.result >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ formatProfit(session.result) }}
            </td>
            <td class="whitespace-nowrap text-right">
              <div class="flex gap-1 justify-end">
                <NuxtLink
                  :to="`/sessions/${session.id}`"
                  class="p-1.5 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded-md transition-colors"
                >
                  <PencilIcon class="w-4 h-4 text-foreground-muted dark:text-foreground-dark-muted" />
                </NuxtLink>
                <button
                  class="p-1.5 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded-md transition-colors"
                  @click.prevent="emit('delete', session.id)"
                >
                  <TrashIcon class="w-4 h-4 text-danger-500 dark:text-danger-400" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="sessions.length === 0"
      class="empty-state"
    >
      <p class="empty-state-description">
        No sessions yet. Add your first session!
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CashSession } from '~/types';
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { formatDate, formatDuration, formatProfit } from '~/utils/formatters';

defineProps<{
  sessions: CashSession[];
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();
</script>
