<template>
  <div class="space-y-3">
    <div
      v-for="tournament in tournaments"
      :key="tournament.id"
      class="card overflow-hidden"
      :class="getCardClass(tournament)"
    >
      <NuxtLink
        :to="`/tournaments/${tournament.id}`"
        class="p-4 block hover:bg-surface-tertiary/50 dark:hover:bg-surface-dark-tertiary/50 transition-colors"
      >
        <div class="flex justify-between items-start mb-2">
          <div>
            <p class="font-semibold text-foreground dark:text-foreground-dark">
              {{ tournament.name }}
            </p>
            <p class="text-sm text-foreground-muted dark:text-foreground-dark-muted">
              {{ formatDate(tournament.date) }}<template v-if="!tournament.isSession">
                &middot; {{ formatTournamentCurrency((tournament.originalBuyIn ?? tournament.buyIn) + (tournament.originalFee ?? tournament.fee), tournament) }}
              </template>
            </p>
          </div>
          <div class="text-right">
            <p
              class="text-lg font-bold font-mono"
              :class="tournament.status === 'in_progress'
                ? 'text-foreground-muted dark:text-foreground-dark-muted'
                : getTournamentProfit(tournament) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ tournament.status === 'in_progress' ? '-' : formatTournamentProfit(getOriginalTournamentProfit(tournament), tournament) }}
            </p>
            <p v-if="tournament.status === 'in_progress'" class="text-xs text-amber-600 dark:text-amber-400">
              In Progress
            </p>
          </div>
        </div>
        <div class="flex gap-4 text-sm text-foreground-muted dark:text-foreground-dark-muted">
          <span v-if="getSiteCount(tournament) > 1">
            {{ getSiteCount(tournament) }} {{ tournament.type === 'live' ? 'venues' : 'sites' }}
          </span>
          <span v-else>
            {{ tournament.type === 'live' ? tournament.venue : tournament.site }}
          </span>
          <template v-if="!tournament.isSession && tournament.status !== 'in_progress'">
            <span v-if="tournament.finishPosition">{{ formatPosition(tournament.finishPosition) }}</span>
            <span :class="tournament.cashed ? 'text-success-600 dark:text-success-400' : ''">
              {{ tournament.cashed ? 'ITM' : 'Bust' }}
            </span>
          </template>
        </div>
      </NuxtLink>

      <!-- Complete button for in-progress -->
      <div v-if="tournament.status === 'in_progress'" class="px-4 pb-3">
        <NuxtLink
          :to="`/tournaments/${tournament.id}`"
          class="flex items-center justify-center gap-2 w-full py-2 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-lg text-sm font-medium hover:bg-success-100 dark:hover:bg-success-900/30 transition-colors"
        >
          <CheckIcon class="w-4 h-4" />
          Complete Tournament
        </NuxtLink>
      </div>

      <!-- Expand button for multiple sites -->
      <div v-if="hasMultipleSites(tournament)" class="border-t border-border dark:border-border-dark">
        <button
          type="button"
          class="w-full px-4 py-2 flex items-center justify-center gap-2 text-sm text-foreground-muted dark:text-foreground-dark-muted hover:bg-surface-tertiary/50 dark:hover:bg-surface-dark-tertiary/50 transition-colors"
          @click="toggleExpand(tournament.id)"
        >
          <ChevronDownIcon
            class="w-4 h-4 transition-transform"
            :class="{ 'rotate-180': expandedRows.has(tournament.id) }"
          />
          {{ expandedRows.has(tournament.id) ? 'Hide' : 'Show' }} site breakdown
        </button>

        <!-- Expanded site breakdown -->
        <div
          v-if="expandedRows.has(tournament.id) && tournament.sites"
          class="px-4 pb-4 space-y-2"
        >
          <div class="text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">
            Site Breakdown
          </div>
          <!-- Session breakdown (bankroll) -->
          <template v-if="tournament.isSession">
            <div
              v-for="(site, index) in tournament.sites"
              :key="index"
              class="flex justify-between items-center py-2 text-sm"
              :class="{ 'border-t border-border-subtle dark:border-border-dark-subtle': index > 0 }"
            >
              <span class="text-foreground dark:text-foreground-dark">
                {{ site.name || 'Unknown' }}
              </span>
              <div class="flex gap-3 items-center font-mono text-sm">
                <span class="text-foreground-muted dark:text-foreground-dark-muted">
                  {{ site.bankrollInitial ? formatTournamentCurrency(site.bankrollInitial, tournament) : '-' }} → {{ site.bankrollFinal ? formatTournamentCurrency(site.bankrollFinal, tournament) : '-' }}
                </span>
                <span
                  class="font-medium"
                  :class="getSiteProfit(site) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
                >
                  {{ formatTournamentProfit(getSiteProfit(site), tournament) }}
                </span>
              </div>
            </div>
          </template>
          <!-- Tournament breakdown (buy-in/fee) -->
          <template v-else>
            <div
              v-for="(site, index) in tournament.sites"
              :key="index"
              class="flex justify-between items-center py-2 text-sm"
              :class="{ 'border-t border-border-subtle dark:border-border-dark-subtle': index > 0 }"
            >
              <span class="text-foreground dark:text-foreground-dark">
                {{ site.name || 'Unknown' }}
              </span>
              <div class="flex gap-4 text-foreground-muted dark:text-foreground-dark-muted font-mono">
                <span>{{ site.buyIn ? formatTournamentCurrency(site.buyIn, tournament) : '-' }}</span>
                <span class="text-foreground-muted/50 dark:text-foreground-dark-muted/50">+{{ site.fee ? formatTournamentCurrency(site.fee, tournament) : '-' }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div
      v-if="tournaments.length === 0"
      class="card p-8 text-center text-foreground-muted dark:text-foreground-dark-muted"
    >
      No tournaments yet. Add your first tournament!
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tournament } from '~/types';
import type { TournamentSiteEntry } from '~/types/tournament';
import { CheckIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
import { formatCurrency as formatCurrencyUtil, formatDate, formatPosition, formatProfit as formatProfitUtil } from '~/utils/formatters';

defineProps<{
  tournaments: Tournament[];
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

// Get profit in original currency for display
function getOriginalTournamentProfit(tournament: Tournament): number {
  if (tournament.isSession) {
    if (tournament.sites) {
      return tournament.sites.reduce((sum, site) => {
        return sum + ((site.bankrollFinal || 0) - (site.bankrollInitial || 0));
      }, 0);
    }
    return 0;
  }

  const buyIn = tournament.originalBuyIn ?? tournament.buyIn;
  const fee = tournament.originalFee ?? tournament.fee;
  const winnings = tournament.originalWinnings ?? tournament.winnings;
  const totalBuyIn = (buyIn + fee) * (tournament.entries + 1);
  return winnings - totalBuyIn;
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

function getCardClass(tournament: Tournament): string {
  if (tournament.status === 'in_progress') {
    return 'bg-amber-100 dark:bg-amber-900/30 border-l-4 border-l-amber-400';
  }
  return '';
}

function hasMultipleSites(tournament: Tournament): boolean {
  return !!tournament.sites && tournament.sites.length > 1;
}

function getSiteCount(tournament: Tournament): number {
  return tournament.sites?.length || 0;
}

// Use store's getTournamentProfit for consistency
const { getTournamentProfit } = tournamentsStore;

function getSiteProfit(site: TournamentSiteEntry): number {
  return (site.bankrollFinal || 0) - (site.bankrollInitial || 0);
}
</script>
