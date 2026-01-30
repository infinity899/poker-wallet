<template>
  <div class="space-y-2">
    <div
      v-for="session in sessions"
      :key="session.id"
      class="card overflow-hidden"
      :class="getCardClass(session)"
    >
      <!-- Multi-site: clickable div that expands -->
      <div
        v-if="hasMultipleSites(session)"
        class="p-4 cursor-pointer"
        @click="toggleExpand(session.id)"
      >
        <div class="flex justify-between items-start mb-2">
          <div class="min-w-0">
            <p class="font-medium text-foreground dark:text-foreground-dark truncate">
              {{ session.game }} {{ session.stake }}
            </p>
            <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
              {{ formatDate(session.date) }}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0 ml-3">
            <p
              class="text-base font-semibold data-value"
              :class="session.status === 'in_progress'
                ? 'text-foreground-muted dark:text-foreground-dark-muted'
                : (session.originalResult ?? session.result) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ session.status === 'in_progress' ? 'In Progress' : formatSessionProfit(session) }}
            </p>
            <ChevronDownIcon
              class="w-4 h-4 text-foreground-muted dark:text-foreground-dark-muted transition-transform"
              :class="{ 'rotate-180': expandedRows.has(session.id) }"
            />
          </div>
        </div>
        <div class="flex gap-3 text-xs text-foreground-muted dark:text-foreground-dark-muted">
          <span>
            {{ getSiteCount(session) }} {{ session.type === 'live' ? 'venues' : 'sites' }}
          </span>
          <span>{{ formatDuration(session.duration) }}</span>
        </div>
        <div v-if="session.tags.length" class="mt-2 flex gap-1 flex-wrap">
          <span
            v-for="tag in session.tags"
            :key="tag"
            class="badge-neutral badge-pill text-2xs"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- Single-site: link to edit -->
      <NuxtLink
        v-else
        :to="`/sessions/${session.id}`"
        class="p-4 block"
      >
        <div class="flex justify-between items-start mb-2">
          <div class="min-w-0">
            <p class="font-medium text-foreground dark:text-foreground-dark truncate">
              {{ session.game }} {{ session.stake }}
            </p>
            <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
              {{ formatDate(session.date) }}
            </p>
          </div>
          <p
            class="text-base font-semibold data-value shrink-0 ml-3"
            :class="session.status === 'in_progress'
              ? 'text-foreground-muted dark:text-foreground-dark-muted'
              : (session.originalResult ?? session.result) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
          >
            {{ session.status === 'in_progress' ? 'In Progress' : formatSessionProfit(session) }}
          </p>
        </div>
        <div class="flex gap-3 text-xs text-foreground-muted dark:text-foreground-dark-muted">
          <span>{{ session.type === 'live' ? session.location : session.site }}</span>
          <span>{{ formatDuration(session.duration) }}</span>
        </div>
        <div v-if="session.tags.length" class="mt-2 flex gap-1 flex-wrap">
          <span
            v-for="tag in session.tags"
            :key="tag"
            class="badge-neutral badge-pill text-2xs"
          >
            {{ tag }}
          </span>
        </div>
      </NuxtLink>

      <!-- Expanded site breakdown -->
      <div
        v-if="expandedRows.has(session.id) && session.sites"
        class="border-t border-border-subtle dark:border-border-dark-subtle"
      >
        <div class="px-4 py-3 bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
          <div
            v-for="(site, index) in session.sites"
            :key="index"
            class="flex justify-between items-center py-1.5 text-sm"
            :class="{ 'border-t border-border-subtle dark:border-border-dark-subtle': index > 0 }"
          >
            <span class="text-foreground dark:text-foreground-dark">{{ site.name || 'Unknown' }}</span>
            <div class="flex gap-4 text-xs font-mono">
              <span class="text-foreground-muted dark:text-foreground-dark-muted">
                {{ site.cashIn ? formatSiteCurrency(site.cashIn, session) : '-' }}
              </span>
              <span class="text-foreground-muted dark:text-foreground-dark-muted">
                {{ site.cashOut ? formatSiteCurrency(site.cashOut, session) : '-' }}
              </span>
              <span
                class="font-medium w-16 text-right"
                :class="getSiteProfit(site) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
              >
                {{ site.cashIn && site.cashOut ? formatSiteProfit(site, session) : '-' }}
              </span>
            </div>
          </div>
        </div>
        <!-- Edit link -->
        <NuxtLink
          :to="`/sessions/${session.id}`"
          class="block w-full px-4 py-2 text-center text-xs text-primary-600 dark:text-primary-400 bg-surface-secondary/30 dark:bg-surface-dark-tertiary/30 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
        >
          Edit session
        </NuxtLink>
      </div>
    </div>

    <div
      v-if="sessions.length === 0"
      class="card empty-state"
    >
      <p class="empty-state-description">
        No sessions yet. Add your first session!
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CashSession, SiteEntry } from '~/types';
import { ChevronDownIcon } from '@heroicons/vue/24/outline';
import { formatCurrency as formatCurrencyUtil, formatDate, formatDuration, formatProfit as formatProfitUtil } from '~/utils/formatters';

defineProps<{
  sessions: CashSession[];
}>();

// Format in the session's original currency
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

const expandedRows = ref<Set<string>>(new Set());

function toggleExpand(sessionId: string) {
  if (expandedRows.value.has(sessionId)) {
    expandedRows.value.delete(sessionId);
  }
  else {
    expandedRows.value.add(sessionId);
  }
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

function getCardClass(session: CashSession): string {
  if (session.status === 'in_progress') {
    return 'bg-amber-50/50 dark:bg-amber-900/10 border-l-2 border-amber-400';
  }
  return '';
}
</script>
