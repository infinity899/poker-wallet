<template>
  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-border dark:divide-border-dark">
        <thead class="bg-surface-secondary dark:bg-surface-dark-tertiary">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider w-8" />
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
          <template v-for="session in sessions" :key="session.id">
            <!-- Main row -->
            <tr
              class="transition-colors"
              :class="[getRowClass(session), hasMultipleSites(session) ? 'cursor-pointer' : '']"
              @click="hasMultipleSites(session) ? toggleExpand(session.id) : undefined"
            >
              <!-- Expand button -->
              <td class="px-4 py-3 whitespace-nowrap">
                <button
                  v-if="hasMultipleSites(session)"
                  type="button"
                  class="p-1 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded transition-colors"
                  :title="expandedRows.has(session.id) ? 'Collapse' : 'Expand site breakdown'"
                  @click.stop="toggleExpand(session.id)"
                >
                  <ChevronDownIcon
                    class="w-4 h-4 text-foreground-muted dark:text-foreground-dark-muted transition-transform"
                    :class="{ 'rotate-180': expandedRows.has(session.id) }"
                  />
                </button>
              </td>
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
                <span v-if="getSiteCount(session) > 1" class="flex items-center gap-1">
                  {{ getSiteCount(session) }} {{ session.type === 'live' ? 'venues' : 'sites' }}
                </span>
                <span v-else-if="getSiteCount(session) === 1">
                  {{ session.sites![0]!.name || (session.type === 'live' ? session.location : session.site) }}
                </span>
                <span v-else>
                  {{ session.type === 'live' ? session.location : session.site }}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-foreground-muted dark:text-foreground-dark-muted">
                {{ formatDuration(session.duration) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-foreground-muted dark:text-foreground-dark-muted">
                {{ session.buyInTotal ? formatSessionCurrency(session.buyInTotal, session) : '-' }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-foreground-muted dark:text-foreground-dark-muted">
                {{ session.cashOutTotal ? formatSessionCurrency(session.cashOutTotal, session) : '-' }}
              </td>
              <td
                class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold data-value"
                :class="session.status === 'in_progress'
                  ? 'text-foreground-muted dark:text-foreground-dark-muted'
                  : (session.originalResult ?? session.result) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
              >
                {{ session.status === 'in_progress' ? '-' : formatSessionProfit(session) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right text-sm" @click.stop>
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

            <!-- Expanded detail row -->
            <tr
              v-if="expandedRows.has(session.id) && session.sites"
              class="bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50"
            >
              <td colspan="11" class="px-4 py-3">
                <div class="ml-8 space-y-1">
                  <div class="text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider mb-2">
                    Site Breakdown
                  </div>
                  <div
                    v-for="(site, index) in session.sites"
                    :key="index"
                    class="grid grid-cols-[1fr,auto,auto,auto] gap-4 py-1.5 text-sm"
                    :class="{ 'border-t border-border-subtle dark:border-border-dark-subtle': index > 0 }"
                  >
                    <div class="text-foreground dark:text-foreground-dark">
                      {{ site.name || 'Unknown' }}
                    </div>
                    <div class="w-24 text-right font-mono text-foreground-muted dark:text-foreground-dark-muted">
                      {{ site.cashIn ? formatSiteCurrency(site.cashIn, session) : '-' }}
                    </div>
                    <div class="w-24 text-right font-mono text-foreground-muted dark:text-foreground-dark-muted">
                      {{ site.cashOut ? formatSiteCurrency(site.cashOut, session) : '-' }}
                    </div>
                    <div
                      class="w-24 text-right font-mono font-medium"
                      :class="getSiteProfit(site) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
                    >
                      {{ site.cashIn && site.cashOut ? formatSiteProfit(site, session) : '-' }}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
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
import type { CashSession, SiteEntry } from '~/types';
import { CheckIcon, ChevronDownIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { formatCurrency as formatCurrencyUtil, formatDate, formatDuration, formatProfit as formatProfitUtil } from '~/utils/formatters';

defineProps<{
  sessions: CashSession[];
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();

// Format in the session's original currency
function formatSessionCurrency(amount: number, session: CashSession): string {
  const currency = session.originalCurrency || session.currency;
  return formatCurrencyUtil(amount, currency);
}

// Format profit in the session's original currency
function formatSessionProfit(session: CashSession): string {
  const currency = session.originalCurrency || session.currency;
  const amount = session.originalResult ?? session.result;
  return formatProfitUtil(amount, currency);
}

// Format site amounts in session's original currency
function formatSiteCurrency(amount: number, session: CashSession): string {
  const currency = session.originalCurrency || session.currency;
  return formatCurrencyUtil(amount, currency);
}

function formatSiteProfit(site: SiteEntry, session: CashSession): string {
  const currency = session.originalCurrency || session.currency;
  const profit = (site.cashOut || 0) - (site.cashIn || 0);
  return formatProfitUtil(profit, currency);
}

// Track expanded rows
const expandedRows = ref<Set<string>>(new Set());

function toggleExpand(sessionId: string) {
  if (expandedRows.value.has(sessionId)) {
    expandedRows.value.delete(sessionId);
  }
  else {
    expandedRows.value.add(sessionId);
  }
  // Trigger reactivity
  expandedRows.value = new Set(expandedRows.value);
}

function hasMultipleSites(session: CashSession): boolean {
  return !!session.sites && session.sites.length > 1;
}

function getSiteCount(session: CashSession): number {
  return session.sites?.length || 0;
}

function getSiteProfit(site: SiteEntry): number {
  return (site.cashOut || 0) - (site.cashIn || 0);
}

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
