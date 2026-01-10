<template>
  <div
    class="card p-4 lg:p-6 cursor-pointer hover:border-accent-500/50 dark:hover:border-accent-400/50 transition-colors"
    @click="emit('view', member)"
  >
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
          :style="{ backgroundColor: memberColor }"
        >
          {{ memberInitial }}
        </div>
        <div>
          <h3 class="font-semibold text-foreground dark:text-foreground-dark">
            {{ displayName }}
          </h3>
          <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
            {{ member.role === 'admin' ? 'Admin' : 'Member' }}
          </p>
        </div>
      </div>
      <Menu v-if="isAdmin && member.role !== 'admin'" as="div" class="relative">
        <MenuButton
          class="p-1.5 rounded-lg hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary transition-colors"
          @click.stop
        >
          <EllipsisVerticalIcon class="w-5 h-5 text-foreground-muted dark:text-foreground-dark-muted" />
        </MenuButton>
        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <MenuItems class="absolute right-0 mt-1 w-36 bg-surface dark:bg-surface-dark-secondary rounded-lg shadow-lg ring-1 ring-border dark:ring-border-dark z-10">
            <MenuItem v-slot="{ active }">
              <button
                class="w-full text-left px-4 py-2 text-sm rounded-lg"
                :class="active ? 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400' : 'text-danger-600 dark:text-danger-400'"
                @click.stop="emit('remove', member.id)"
              >
                Remove
              </button>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted mb-1">
          Total Profit
        </p>
        <p
          class="text-xl font-bold tabular-nums"
          :class="stats.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
        >
          {{ formatCurrency(stats.totalProfit) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted mb-1">
          Win Rate
        </p>
        <p class="text-xl font-bold tabular-nums text-foreground dark:text-foreground-dark">
          {{ stats.winRate.toFixed(1) }}%
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
          Sessions
        </p>
        <p class="font-medium tabular-nums text-foreground dark:text-foreground-dark">
          {{ stats.totalSessions }}
        </p>
      </div>
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
          Hourly
        </p>
        <p
          class="font-medium tabular-nums"
          :class="stats.hourlyRate >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
        >
          {{ formatCurrency(stats.hourlyRate) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommunityMember } from '~/types';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { EllipsisVerticalIcon } from '@heroicons/vue/24/outline';
import { COMMUNITY_MEMBER_COLORS } from '~/types/community';
import { formatCurrency } from '~/utils/formatters';

const props = defineProps<{
  member: CommunityMember;
  communityId: string;
  index: number;
  isAdmin: boolean;
}>();

const emit = defineEmits<{
  view: [member: CommunityMember];
  remove: [memberId: string];
}>();

const communitiesStore = useCommunitiesStore();

const stats = computed(() => communitiesStore.getMemberStats(props.communityId, props.member.id));

const displayName = computed(() => {
  return props.member.displayName || props.member.userEmail?.split('@')[0] || 'Member';
});

const memberInitial = computed(() => displayName.value.charAt(0).toUpperCase());

const memberColor = computed(() => COMMUNITY_MEMBER_COLORS[props.index % COMMUNITY_MEMBER_COLORS.length]);
</script>
