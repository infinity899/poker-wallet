<template>
  <div class="card overflow-hidden">
    <table class="min-w-full divide-y divide-border dark:divide-border-dark">
      <thead class="bg-surface-secondary dark:bg-surface-dark-tertiary">
        <tr>
          <th class="w-8 px-2 py-3" />
          <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
            Date
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
            Name
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
            Type
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
            Site/Venue
          </th>
          <th class="px-4 py-3 text-right text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
            Buy-in
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
            Finish
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
        <template v-for="tournament in tournaments" :key="tournament.id">
          <tr
            class="transition-colors"
            :class="[getRowClass(tournament), hasMultipleSites(tournament) ? 'cursor-pointer' : '']"
            @click="hasMultipleSites(tournament) ? toggleExpand(tournament.id) : undefined"
          >
            <!-- Expand button -->
            <td
              class="px-2 py-3 whitespace-nowrap"
              :class="tournament.status === 'in_progress' ? 'border-l-4 border-l-amber-400' : ''"
            >
              <button
                v-if="hasMultipleSites(tournament)"
                type="button"
                class="p-1 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded transition-colors"
                :title="expandedRows.has(tournament.id) ? 'Collapse' : 'Expand site breakdown'"
                @click.stop="toggleExpand(tournament.id)"
              >
                <ChevronDownIcon
                  class="w-4 h-4 text-foreground-muted dark:text-foreground-dark-muted transition-transform"
                  :class="{ 'rotate-180': expandedRows.has(tournament.id) }"
                />
              </button>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-foreground dark:text-foreground-dark">
              {{ formatDate(tournament.date) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-foreground dark:text-foreground-dark">
              {{ tournament.name }}
              <span v-if="tournament.source === 'desktop'" class="ml-2 badge-neutral badge-pill text-2xs">
                Added from desktop
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
              <span
                class="badge"
                :class="tournament.type === 'live'
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'"
              >
                {{ tournament.type }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-foreground-muted dark:text-foreground-dark-muted">
              <span v-if="getSiteCount(tournament) > 1" class="flex items-center gap-1">
                {{ getSiteCount(tournament) }} {{ tournament.type === 'live' ? 'venues' : 'sites' }}
              </span>
              <span v-else>
                {{ tournament.type === 'live' ? tournament.venue : tournament.site }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-foreground-muted dark:text-foreground-dark-muted">
              <template v-if="tournament.isSession">
                -
              </template>
              <template v-else>
                <span class="inline-flex items-center justify-end gap-1.5">
                  {{ formatTournamentCurrency((tournament.originalBuyIn ?? tournament.buyIn) + (tournament.originalFee ?? tournament.fee), tournament) }}
                  <span
                    v-if="tournament.entries > 0"
                    class="badge-warning font-mono font-semibold"
                    :title="getEntriesTitle(tournament)"
                  >
                    &times;{{ getTournamentEntryCount(tournament) }}
                  </span>
                </span>
              </template>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
              <template v-if="tournament.isSession || tournament.status === 'in_progress'">
                <span class="text-foreground-muted dark:text-foreground-dark-muted">-</span>
              </template>
              <template v-else>
                <span v-if="tournament.finishPosition" class="text-foreground dark:text-foreground-dark">
                  {{ formatPosition(tournament.finishPosition) }}
                  <span v-if="tournament.fieldSize" class="text-foreground-muted dark:text-foreground-dark-muted">
                    / {{ tournament.fieldSize }}
                  </span>
                </span>
                <span
                  class="ml-2 badge"
                  :class="tournament.cashed
                    ? 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                    : 'bg-surface-tertiary text-foreground-muted dark:bg-surface-dark-tertiary dark:text-foreground-dark-muted'"
                >
                  {{ tournament.cashed ? 'ITM' : 'Bust' }}
                </span>
              </template>
            </td>
            <td
              class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold font-mono"
              :class="tournament.status === 'in_progress'
                ? 'text-foreground-muted dark:text-foreground-dark-muted'
                : getTournamentProfit(tournament) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ tournament.status === 'in_progress' ? '-' : formatTournamentProfit(getOriginalTournamentProfit(tournament), tournament) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right text-sm">
              <div class="flex gap-2 justify-end">
                <NuxtLink
                  v-if="tournament.status === 'in_progress'"
                  :to="`/tournaments/${tournament.id}`"
                  class="p-1 hover:bg-success-50 dark:hover:bg-success-900/30 rounded transition-colors"
                  title="Complete tournament"
                >
                  <CheckIcon class="w-4 h-4 text-success-600 dark:text-success-400" />
                </NuxtLink>
                <NuxtLink
                  :to="`/tournaments/${tournament.id}`"
                  class="p-1 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded transition-colors"
                  title="Edit tournament"
                >
                  <PencilIcon class="w-4 h-4 text-foreground-muted dark:text-foreground-dark-muted" />
                </NuxtLink>
                <button
                  class="p-1 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded transition-colors"
                  title="Delete tournament"
                  @click.stop="emit('delete', tournament.id)"
                >
                  <TrashIcon class="w-4 h-4 text-danger-500 dark:text-danger-400" />
                </button>
              </div>
            </td>
          </tr>

          <!-- Expanded detail row -->
          <tr
            v-if="expandedRows.has(tournament.id) && tournament.sites"
            class="bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50"
          >
            <td colspan="9" class="px-4 py-3">
              <div class="ml-8 space-y-1">
                <div class="text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider mb-2">
                  Site Breakdown
                </div>
                <!-- Session breakdown (bankroll) -->
                <template v-if="tournament.isSession">
                  <div class="grid grid-cols-[1fr,auto,auto,auto] gap-4 text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider mb-1">
                    <div />
                    <div class="w-24 text-right">
                      Initial
                    </div>
                    <div class="w-24 text-right">
                      Final
                    </div>
                    <div class="w-24 text-right">
                      Profit
                    </div>
                  </div>
                  <div
                    v-for="(site, index) in tournament.sites"
                    :key="index"
                    class="grid grid-cols-[1fr,auto,auto,auto] gap-4 py-1.5 text-sm"
                    :class="{ 'border-t border-border-subtle dark:border-border-dark-subtle': index > 0 }"
                  >
                    <div class="text-foreground dark:text-foreground-dark">
                      {{ site.name || 'Unknown' }}
                    </div>
                    <div class="w-24 text-right font-mono text-foreground-muted dark:text-foreground-dark-muted">
                      {{ site.bankrollInitial ? formatSiteCurrency(site.bankrollInitial, tournament) : '-' }}
                    </div>
                    <div class="w-24 text-right font-mono text-foreground-muted dark:text-foreground-dark-muted">
                      {{ site.bankrollFinal ? formatSiteCurrency(site.bankrollFinal, tournament) : '-' }}
                    </div>
                    <div
                      class="w-24 text-right font-mono font-medium"
                      :class="getSiteProfitAmount(site) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
                    >
                      {{ formatSiteProfit(getSiteProfitAmount(site), tournament) }}
                    </div>
                  </div>
                </template>
                <!-- Tournament breakdown (buy-in/fee) -->
                <template v-else>
                  <div
                    v-for="(site, index) in tournament.sites"
                    :key="index"
                    class="grid grid-cols-[1fr,auto,auto] gap-4 py-1.5 text-sm"
                    :class="{ 'border-t border-border-subtle dark:border-border-dark-subtle': index > 0 }"
                  >
                    <div class="text-foreground dark:text-foreground-dark">
                      {{ site.name || 'Unknown' }}
                    </div>
                    <div class="w-24 text-right font-mono text-foreground-muted dark:text-foreground-dark-muted">
                      {{ site.buyIn ? formatSiteCurrency(site.buyIn, tournament) : '-' }}
                    </div>
                    <div class="w-24 text-right font-mono text-foreground-muted dark:text-foreground-dark-muted">
                      {{ site.fee ? formatSiteCurrency(site.fee, tournament) : '-' }}
                    </div>
                  </div>
                </template>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <div
      v-if="tournaments.length === 0"
      class="p-8 text-center text-foreground-muted dark:text-foreground-dark-muted"
    >
      No tournaments yet. Add your first tournament!
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tournament } from '~/types';
import type { TournamentSiteEntry } from '~/types/tournament';
import { CheckIcon, ChevronDownIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { getTournamentEntryCount } from '~/utils/calculations';
import { formatCurrency as formatCurrencyUtil, formatDate, formatPosition, formatProfit as formatProfitUtil } from '~/utils/formatters';

defineProps<{
  tournaments: Tournament[];
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();

// Format in the tournament's original currency
function formatTournamentCurrency(amount: number, tournament: Tournament): string {
  const currency = tournament.originalCurrency || tournament.currency;
  return formatCurrencyUtil(amount, currency);
}

function formatTournamentProfit(amount: number, tournament: Tournament): string {
  const currency = tournament.originalCurrency || tournament.currency;
  return formatProfitUtil(amount, currency);
}

function formatSiteCurrency(amount: number, tournament: Tournament): string {
  const currency = tournament.originalCurrency || tournament.currency;
  return formatCurrencyUtil(amount, currency);
}

function formatSiteProfit(amount: number, tournament: Tournament): string {
  const currency = tournament.originalCurrency || tournament.currency;
  return formatProfitUtil(amount, currency);
}

// Get profit in original currency for display
function getOriginalTournamentProfit(tournament: Tournament): number {
  if (tournament.isSession) {
    // For session-style tournaments, use bankroll profit
    if (tournament.sites) {
      return tournament.sites.reduce((sum, site) => {
        return sum + ((site.bankrollFinal || 0) - (site.bankrollInitial || 0));
      }, 0);
    }
    return 0;
  }

  // For regular tournaments, calculate from original values
  const buyIn = tournament.originalBuyIn ?? tournament.buyIn;
  const fee = tournament.originalFee ?? tournament.fee;
  const winnings = tournament.originalWinnings ?? tournament.winnings;
  const totalBuyIn = (buyIn + fee) * getTournamentEntryCount(tournament);
  return winnings - totalBuyIn;
}

// Tooltip for the re-entry multiplier: "2 re-entries · $327 total"
function getEntriesTitle(tournament: Tournament): string {
  const buyIn = tournament.originalBuyIn ?? tournament.buyIn;
  const fee = tournament.originalFee ?? tournament.fee;
  const total = (buyIn + fee) * getTournamentEntryCount(tournament);
  const label = tournament.entries === 1 ? '1 re-entry' : `${tournament.entries} re-entries`;
  return `${label} · ${formatTournamentCurrency(total, tournament)} total`;
}

const tournamentsStore = useTournamentsStore();

// Track expanded rows
const expandedRows = ref<Set<string>>(new Set());

function toggleExpand(tournamentId: string) {
  if (expandedRows.value.has(tournamentId)) {
    expandedRows.value.delete(tournamentId);
  }
  else {
    expandedRows.value.add(tournamentId);
  }
  // Trigger reactivity
  expandedRows.value = new Set(expandedRows.value);
}

function getRowClass(tournament: Tournament): string {
  if (tournament.status === 'in_progress') {
    return 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200/50 dark:hover:bg-amber-900/40';
  }
  return 'hover:bg-surface-tertiary/50 dark:hover:bg-surface-dark-tertiary/50';
}

function hasMultipleSites(tournament: Tournament): boolean {
  return !!tournament.sites && tournament.sites.length > 1;
}

function getSiteCount(tournament: Tournament): number {
  return tournament.sites?.length || 0;
}

// Use store's getTournamentProfit for consistency
const { getTournamentProfit } = tournamentsStore;

function getSiteProfitAmount(site: TournamentSiteEntry): number {
  return (site.bankrollFinal || 0) - (site.bankrollInitial || 0);
}
</script>
