<template>
  <div class="space-y-2">
    <NuxtLink
      v-for="session in sessions"
      :key="session.id"
      :to="`/sessions/${session.id}`"
      class="card-interactive p-4 block"
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
          :class="session.result >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
        >
          {{ formatProfit(session.result) }}
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
import type { CashSession } from '~/types';
import { formatDate, formatDuration, formatProfit } from '~/utils/formatters';

defineProps<{
  sessions: CashSession[];
}>();
</script>
