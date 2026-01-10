<template>
  <div
    class="card p-4 cursor-pointer hover:border-accent-300 dark:hover:border-accent-600 transition-all"
    @click="emit('view', community)"
  >
    <div class="flex items-start gap-3">
      <!-- Avatar -->
      <div
        class="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-xl shrink-0"
        :style="{ backgroundColor: community.avatar || '#10b981' }"
      >
        {{ community.name.charAt(0).toUpperCase() }}
      </div>

      <div class="flex-1 min-w-0">
        <!-- Name & Visibility -->
        <div class="flex items-center gap-2">
          <h3 class="text-base font-semibold text-foreground dark:text-foreground-dark truncate">
            {{ community.name }}
          </h3>
          <span
            v-if="community.visibility === 'private'"
            class="text-xs px-1.5 py-0.5 rounded bg-surface-secondary dark:bg-surface-dark-tertiary text-foreground-muted dark:text-foreground-dark-muted"
          >
            Private
          </span>
        </div>

        <!-- Description -->
        <p
          v-if="community.description"
          class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-0.5 line-clamp-1"
        >
          {{ community.description }}
        </p>

        <!-- Stats -->
        <div class="flex items-center gap-4 mt-2 text-xs text-foreground-muted dark:text-foreground-dark-muted">
          <div class="flex items-center gap-1">
            <UsersIcon class="w-3.5 h-3.5" />
            <span>{{ stats.totalMembers }} members</span>
          </div>
          <div class="flex items-center gap-1">
            <ChartBarIcon class="w-3.5 h-3.5" />
            <span>{{ stats.totalSessions + stats.totalTournaments }} entries</span>
          </div>
        </div>
      </div>

      <!-- Profit -->
      <div class="text-right shrink-0">
        <div
          class="text-base font-semibold font-mono"
          :class="stats.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
        >
          {{ stats.totalProfit >= 0 ? '+' : '' }}{{ formatNumber(stats.totalProfit) }}
        </div>
        <div v-if="isAdmin" class="text-xs text-accent-600 dark:text-accent-400 mt-0.5">
          Admin
        </div>
      </div>
    </div>

    <!-- Pending requests badge -->
    <div
      v-if="isAdmin && pendingCount > 0"
      class="mt-3 pt-3 border-t border-border-subtle dark:border-border-dark-subtle"
    >
      <div class="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
        <BellIcon class="w-3.5 h-3.5" />
        <span>{{ pendingCount }} pending request{{ pendingCount > 1 ? 's' : '' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Community } from '~/types';
import { BellIcon, ChartBarIcon, UsersIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  community: Community;
}>();

const emit = defineEmits<{
  view: [community: Community];
}>();

const communitiesStore = useCommunitiesStore();

const stats = computed(() => communitiesStore.getCommunityStats(props.community.id));
const isAdmin = computed(() => communitiesStore.isAdmin(props.community.id));
const pendingCount = computed(() => communitiesStore.getPendingRequests(props.community.id).length);

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
</script>
