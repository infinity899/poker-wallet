<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="member" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="emit('close')"
        />

        <!-- Drawer -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform translate-x-full"
          enter-to-class="transform translate-x-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform translate-x-0"
          leave-to-class="transform translate-x-full"
        >
          <div
            v-if="member"
            class="absolute right-0 top-0 h-full w-full max-w-lg bg-surface dark:bg-surface-dark-secondary shadow-xl overflow-y-auto"
          >
            <!-- Header -->
            <div class="sticky top-0 z-10 flex items-center justify-between p-4 bg-surface dark:bg-surface-dark-secondary border-b border-border dark:border-border-dark">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  :style="{ backgroundColor: memberColor }"
                >
                  {{ memberInitial }}
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-foreground dark:text-foreground-dark">
                    {{ displayName }}
                  </h2>
                  <p class="text-sm text-foreground-muted dark:text-foreground-dark-muted">
                    {{ member.role === 'admin' ? 'Admin' : 'Member' }}
                  </p>
                </div>
              </div>
              <button
                class="p-2 rounded-lg text-foreground-muted dark:text-foreground-dark-muted hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary transition-colors"
                @click="emit('close')"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <!-- Content -->
            <div class="p-4 space-y-6">
              <!-- Stats Overview -->
              <div class="card p-4">
                <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
                  Statistics
                </h3>
                <div class="grid grid-cols-2 gap-4">
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
                  <div>
                    <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted mb-1">
                      Hourly Rate
                    </p>
                    <p
                      class="text-xl font-bold tabular-nums"
                      :class="stats.hourlyRate >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
                    >
                      {{ formatCurrency(stats.hourlyRate) }}/hr
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted mb-1">
                      Hours
                    </p>
                    <p class="text-xl font-bold tabular-nums text-foreground dark:text-foreground-dark">
                      {{ stats.totalHours.toFixed(1) }}
                    </p>
                  </div>
                </div>
                <div class="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border dark:border-border-dark">
                  <div>
                    <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
                      Sessions
                    </p>
                    <p class="text-sm font-medium tabular-nums text-foreground dark:text-foreground-dark">
                      {{ stats.totalSessions }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
                      Tournaments
                    </p>
                    <p class="text-sm font-medium tabular-nums text-foreground dark:text-foreground-dark">
                      {{ stats.totalTournaments }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
                      Best
                    </p>
                    <p class="text-sm font-medium tabular-nums text-success-600 dark:text-success-400">
                      {{ formatCurrency(stats.bestResult) }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
                      Worst
                    </p>
                    <p class="text-sm font-medium tabular-nums text-danger-600 dark:text-danger-400">
                      {{ formatCurrency(stats.worstResult) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Member Profit Chart -->
              <div v-if="(chartData.labels?.length ?? 0) > 0" class="card p-4">
                <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
                  Cumulative Profit
                </h3>
                <div class="h-48">
                  <Line
                    :data="chartData"
                    :options="chartOptions"
                  />
                </div>
              </div>

              <!-- Sessions List -->
              <div v-if="memberSessions.length > 0" class="card p-4">
                <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
                  Cash Sessions
                </h3>
                <div class="space-y-2">
                  <div
                    v-for="session in memberSessions"
                    :key="session.id"
                    class="flex items-center justify-between py-2 border-b border-border dark:border-border-dark last:border-0"
                  >
                    <div>
                      <p class="text-sm font-medium text-foreground dark:text-foreground-dark">
                        {{ session.stake }} {{ session.game }}
                      </p>
                      <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
                        {{ formatDate(session.date) }}
                      </p>
                    </div>
                    <p
                      class="text-sm font-semibold tabular-nums"
                      :class="session.result >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
                    >
                      {{ formatCurrency(session.result) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Tournaments List -->
              <div v-if="memberTournaments.length > 0" class="card p-4">
                <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
                  Tournaments
                </h3>
                <div class="space-y-2">
                  <div
                    v-for="tournament in memberTournaments"
                    :key="tournament.id"
                    class="flex items-center justify-between py-2 border-b border-border dark:border-border-dark last:border-0"
                  >
                    <div>
                      <p class="text-sm font-medium text-foreground dark:text-foreground-dark">
                        {{ tournament.name }}
                      </p>
                      <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
                        {{ formatDate(tournament.date) }} &middot; {{ formatCurrency(tournament.buyIn) }}
                      </p>
                    </div>
                    <p
                      class="text-sm font-semibold tabular-nums"
                      :class="calculateTournamentProfit(tournament) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
                    >
                      {{ formatCurrency(calculateTournamentProfit(tournament)) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div
                v-if="memberSessions.length === 0 && memberTournaments.length === 0"
                class="card p-8 text-center"
              >
                <ChartBarIcon class="w-10 h-10 mx-auto text-foreground-muted dark:text-foreground-dark-muted mb-3" />
                <p class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                  No results linked to this community yet.
                </p>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import type { CommunityMember, Tournament } from '~/types';
import { ChartBarIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { COMMUNITY_MEMBER_COLORS } from '~/types/community';
import { formatCurrency } from '~/utils/formatters';

const props = defineProps<{
  member: CommunityMember | null;
  communityId?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const communitiesStore = useCommunitiesStore();
const themeStore = useThemeStore();

const stats = computed(() => {
  if (!props.member || !props.communityId) {
    return {
      memberId: '',
      userId: '',
      displayName: '',
      totalProfit: 0,
      totalSessions: 0,
      totalTournaments: 0,
      winRate: 0,
      hourlyRate: 0,
      totalHours: 0,
      bestResult: 0,
      worstResult: 0,
    };
  }
  return communitiesStore.getMemberStats(props.communityId, props.member.id);
});

const displayName = computed(() => {
  if (!props.member) {
    return '';
  }
  return props.member.displayName || props.member.userEmail?.split('@')[0] || 'Member';
});

const memberInitial = computed(() => displayName.value.charAt(0).toUpperCase());

const memberColor = computed<string>(() => {
  const members = props.communityId ? communitiesStore.getCommunityMembers(props.communityId) : [];
  const index = members.findIndex(m => m.id === props.member?.id);
  // The modulo always lands in range; the ?? satisfies noUncheckedIndexedAccess.
  return COMMUNITY_MEMBER_COLORS[Math.max(0, index) % COMMUNITY_MEMBER_COLORS.length]
    ?? COMMUNITY_MEMBER_COLORS[0]!;
});

// Get member sessions from community cache (not the user's session store)
const memberSessions = computed(() => {
  if (!props.member || !props.communityId) {
    return [];
  }
  const communitySessions = communitiesStore.getCommunitySessions(props.communityId);
  return communitySessions
    .filter(s => s.userId === props.member?.userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
});

// Get member tournaments from community cache
const memberTournaments = computed(() => {
  if (!props.member || !props.communityId) {
    return [];
  }
  const communityTournaments = communitiesStore.getCommunityTournaments(props.communityId);
  return communityTournaments
    .filter(t => t.userId === props.member?.userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
});

// Chart data for member's cumulative profit
const chartData = computed<ChartData<'line'>>(() => {
  if (!props.member || !props.communityId) {
    return { labels: [], datasets: [] };
  }

  const memberData = communitiesStore.getCumulativeProfitData(props.communityId, props.member.id);

  if (memberData.length === 0) {
    return { labels: [], datasets: [] };
  }

  const labels = memberData.map(d =>
    new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  );

  return {
    labels,
    datasets: [
      {
        label: displayName.value,
        data: memberData.map(d => d.profit),
        borderColor: memberColor.value,
        backgroundColor: `${memberColor.value.replace('rgb', 'rgba').replace(')', ', 0.1)')}`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };
});

// Chart options
const chartOptions = computed<ChartOptions<'line'>>(() => {
  const isDark = themeStore.isDark;

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#475569',
        borderColor: isDark ? 'rgba(248, 250, 252, 0.1)' : 'rgba(15, 23, 42, 0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            return formatCurrency(context.parsed.y ?? 0);
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#64748b' : '#94a3b8',
          font: {
            size: 10,
          },
          maxRotation: 0,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(248, 250, 252, 0.05)' : 'rgba(15, 23, 42, 0.05)',
        },
        ticks: {
          color: isDark ? '#64748b' : '#94a3b8',
          font: {
            size: 10,
          },
          callback: (value) => {
            if (typeof value === 'number') {
              return formatCurrency(value);
            }
            return value;
          },
        },
        border: {
          display: false,
        },
      },
    },
  };
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateTournamentProfit(tournament: Tournament): number {
  const cost = (tournament.buyIn + tournament.fee) * (tournament.entries + 1);
  return tournament.winnings - cost;
}
</script>
