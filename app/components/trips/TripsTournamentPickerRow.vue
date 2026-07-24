<template>
  <label
    class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
  >
    <input
      type="checkbox"
      :checked="selected"
      class="rounded border-border dark:border-border-dark text-accent-600 focus:ring-accent-500 shrink-0"
      @change="emit('toggle')"
    >
    <div class="min-w-0 flex-1">
      <p class="text-sm font-medium text-foreground dark:text-foreground-dark truncate">
        {{ tournament.name }}
      </p>
      <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted truncate">
        {{ formatDate(tournament.date) }}
        <template v-if="tournament.venue"> &middot; {{ tournament.venue }}</template>
      </p>
    </div>
    <span v-if="claimedBy" class="badge badge-warning shrink-0">
      In {{ claimedBy }}
    </span>
  </label>
</template>

<script setup lang="ts">
import type { Tournament } from '~/types';
import { formatDate } from '~/utils/formatters';

defineProps<{
  tournament: Tournament;
  selected: boolean;
  claimedBy?: string;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>
