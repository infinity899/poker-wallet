<template>
  <div class="card overflow-hidden">
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Trip</th>
            <th>Dates</th>
            <th>Venue</th>
            <th class="text-right">
              MTTs
            </th>
            <th class="text-right">
              Gross
            </th>
            <th class="text-right">
              Expenses
            </th>
            <th class="text-right">
              Net
            </th>
            <th class="text-right">
              ROI
            </th>
            <th class="text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="trip in trips"
            :key="trip.id"
            class="cursor-pointer"
            @click="router.push(`/trips/${trip.id}`)"
          >
            <td>
              <p class="font-medium text-foreground dark:text-foreground-dark">
                {{ trip.name }}
              </p>
              <p v-if="trip.location" class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
                {{ trip.location }}
              </p>
            </td>
            <td class="whitespace-nowrap text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              {{ formatDateRange(trip.date, trip.endDate) }}
            </td>
            <td class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              {{ trip.venue || '-' }}
            </td>
            <td class="text-right text-sm data-value">
              {{ pnl(trip.id).tournamentCount }}
            </td>
            <td
              class="text-right text-sm data-value"
              :class="pnl(trip.id).grossProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ formatDisplayProfit(pnl(trip.id).grossProfit) }}
            </td>
            <td class="text-right text-sm data-value text-danger-600 dark:text-danger-400">
              -{{ formatAmount(pnl(trip.id).totalExpenses) }}
            </td>
            <td
              class="text-right text-sm data-value font-semibold"
              :class="pnl(trip.id).netProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ formatDisplayProfit(pnl(trip.id).netProfit) }}
            </td>
            <td class="text-right text-sm data-value text-foreground-secondary dark:text-foreground-dark-secondary">
              {{ roiLabel(trip.id) }}
            </td>
            <td class="text-right" @click.stop>
              <div class="flex items-center justify-end gap-1">
                <NuxtLink
                  :to="`/trips/${trip.id}`"
                  class="p-1.5 rounded hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary transition-colors inline-flex"
                  title="Open trip"
                >
                  <PencilIcon class="w-4 h-4 text-foreground-muted dark:text-foreground-dark-muted" />
                </NuxtLink>
                <button
                  class="p-1.5 rounded hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors"
                  title="Delete trip"
                  @click="emit('delete', trip.id)"
                >
                  <TrashIcon class="w-4 h-4 text-danger-500 dark:text-danger-400" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trip, TripPnL } from '~/types';
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { formatDateRange, formatPercentage } from '~/utils/formatters';

const props = defineProps<{
  trips: Trip[];
  pnlById: Map<string, TripPnL>;
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();

const router = useRouter();
const { formatAmount, formatDisplayProfit } = useCurrency();

const EMPTY_PNL: TripPnL = {
  buyIns: 0,
  cashes: 0,
  grossProfit: 0,
  totalExpenses: 0,
  expensesByCategory: [],
  netProfit: 0,
  roi: 0,
  netRoi: 0,
  tournamentCount: 0,
  expenseCount: 0,
};

function pnl(tripId: string): TripPnL {
  return props.pnlById.get(tripId) ?? EMPTY_PNL;
}

// ROI is meaningless with no invested capital - show an em dash, not "0.0%".
function roiLabel(tripId: string): string {
  const p = pnl(tripId);
  return p.buyIns + p.totalExpenses === 0 ? '—' : formatPercentage(p.netRoi);
}
</script>
