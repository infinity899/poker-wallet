<template>
  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-border dark:divide-border-dark">
        <thead class="bg-surface-secondary dark:bg-surface-dark-tertiary">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
              Date
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
              Type
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
              Game
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
              Stakes
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
              Venue/Site
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
              Duration
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
              Cash In
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
              Cash Out
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
              Result
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-surface dark:bg-surface-dark-secondary divide-y divide-border-subtle dark:divide-border-dark-subtle">
          <tr
            v-for="session in sessions"
            :key="session.id"
            class="transition-colors"
            :class="getRowClass(session)"
          >
            <td class="px-4 py-3 whitespace-nowrap text-sm text-foreground dark:text-foreground-dark">
              {{ formatDate(session.date) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
              <span
                class="badge"
                :class="session.type === 'live'
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'"
              >
                {{ session.type }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-foreground dark:text-foreground-dark">
              {{ session.game }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-foreground dark:text-foreground-dark font-mono">
              {{ session.stake }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-foreground-muted dark:text-foreground-dark-muted">
              {{ session.type === 'live' ? session.location : session.site }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-foreground-muted dark:text-foreground-dark-muted">
              {{ formatDuration(session.duration) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-foreground-muted dark:text-foreground-dark-muted">
              {{ session.buyInTotal ? formatCurrency(session.buyInTotal) : '-' }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-foreground-muted dark:text-foreground-dark-muted">
              {{ session.cashOutTotal ? formatCurrency(session.cashOutTotal) : '-' }}
            </td>
            <td
              class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold data-value"
              :class="session.status === 'in_progress'
                ? 'text-foreground-muted dark:text-foreground-dark-muted'
                : session.result >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ session.status === 'in_progress' ? '-' : formatProfit(session.result) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right text-sm">
              <div class="flex gap-2 justify-end">
                <NuxtLink
                  v-if="session.status === 'in_progress'"
                  :to="`/sessions/${session.id}`"
                  class="p-1 hover:bg-success-50 dark:hover:bg-success-900/30 rounded transition-colors"
                  title="Complete session"
                >
                  <CheckIcon class="w-4 h-4 text-success-600 dark:text-success-400" />
                </NuxtLink>
                <NuxtLink
                  :to="`/sessions/${session.id}`"
                  class="p-1 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded transition-colors"
                  title="Edit session"
                >
                  <PencilIcon class="w-4 h-4 text-foreground-muted dark:text-foreground-dark-muted" />
                </NuxtLink>
                <button
                  class="p-1 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded transition-colors"
                  title="Delete session"
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
import { CheckIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { formatCurrency, formatDate, formatDuration, formatProfit } from '~/utils/formatters';

defineProps<{
  sessions: CashSession[];
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();

function getRowClass(session: CashSession): string {
  if (session.status === 'in_progress') {
    return 'bg-amber-50/50 dark:bg-amber-900/10 border-l-2 border-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/20';
  }

  const hasCashData = session.buyInTotal && session.cashOutTotal;
  if (hasCashData) {
    if (session.cashOutTotal! > session.buyInTotal!) {
      return 'bg-success-50/50 dark:bg-success-900/10 hover:bg-success-50 dark:hover:bg-success-900/20';
    }
    if (session.cashOutTotal! < session.buyInTotal!) {
      return 'bg-danger-50/50 dark:bg-danger-900/10 hover:bg-danger-50 dark:hover:bg-danger-900/20';
    }
  }

  return 'hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary';
}
</script>
