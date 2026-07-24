<template>
  <div class="card overflow-hidden">
    <NuxtLink
      :to="`/trips/${trip.id}`"
      class="p-4 block hover:bg-surface-tertiary/50 dark:hover:bg-surface-dark-tertiary/50 transition-colors"
    >
      <div class="flex justify-between items-start gap-3 mb-2">
        <div class="min-w-0">
          <p class="font-semibold text-foreground dark:text-foreground-dark truncate">
            {{ trip.name }}
          </p>
          <p class="text-sm text-foreground-muted dark:text-foreground-dark-muted truncate">
            {{ formatDateRange(trip.date, trip.endDate) }}
            <template v-if="trip.venue">
              &middot; {{ trip.venue }}
            </template>
          </p>
        </div>
        <div class="text-right shrink-0">
          <p
            class="text-lg font-bold data-value"
            :class="pnl.netProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
          >
            {{ formatDisplayProfit(pnl.netProfit) }}
          </p>
          <p class="text-2xs text-foreground-muted dark:text-foreground-dark-muted">
            net
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-muted dark:text-foreground-dark-muted">
        <span>{{ pnl.tournamentCount }} {{ pnl.tournamentCount === 1 ? 'MTT' : 'MTTs' }}</span>
        <span>Gross {{ formatDisplayProfit(pnl.grossProfit) }}</span>
        <span>Exp -{{ formatAmount(pnl.totalExpenses) }}</span>
      </div>
    </NuxtLink>

    <div class="flex border-t border-border-subtle dark:border-border-dark-subtle">
      <NuxtLink
        :to="`/trips/${trip.id}`"
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
      >
        <ArrowTopRightOnSquareIcon class="w-4 h-4" />
        Open
      </NuxtLink>
      <button
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-danger-500 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors border-l border-border-subtle dark:border-border-dark-subtle"
        @click="emit('delete', trip.id)"
      >
        <TrashIcon class="w-4 h-4" />
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trip, TripPnL } from '~/types';
import { ArrowTopRightOnSquareIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { formatDateRange } from '~/utils/formatters';

defineProps<{
  trip: Trip;
  pnl: TripPnL;
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();

const { formatAmount, formatDisplayProfit } = useCurrency();
</script>
