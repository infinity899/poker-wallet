<template>
  <div class="p-4 lg:p-0 space-y-6">
    <AnalyticsHeader />

    <div class="flex flex-wrap items-center justify-between gap-3">
      <AnalyticsTabs v-model="activeTab" />
      <AnalyticsDateFilter v-model="datePreset" />
    </div>

    <AnalyticsCashCharts
      v-if="activeTab === 'cash'"
      :cumulative-data="cashCumulativeData"
      :session-profit-data="sessionProfitData"
      :stats="cashStats"
    />

    <template v-if="activeTab === 'tournaments'">
      <TournamentsFilterBar
        v-model="tournamentFilters"
        :show-status="false"
        :result-count="analyticsTournaments.length"
        :total-count="dateScopedTournaments.length"
      />

      <div class="flex justify-end">
        <TournamentsBreakdownSelect v-model="breakdown" />
      </div>

      <AnalyticsTournamentCharts
        :tournaments="analyticsTournaments"
        :stats="tournamentStats"
        :breakdown="breakdown"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CashSession, DateRangePreset, Tournament, TournamentBreakdown, TournamentFilters } from '~/types';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PieController,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import {
  getDateRangeFromPreset,
  isDateInRange,
  matchesTournamentFilters,
} from '~/composables/useFilters';
import { DEFAULT_TOURNAMENT_FILTERS } from '~/types';
import {
  calculateCumulativeProfit,
  calculateSessionStats,
  calculateTournamentStats,
} from '~/utils/calculations';
import { formatDateShort } from '~/utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  PieController,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const sessionsStore = useSessionsStore();
const tournamentsStore = useTournamentsStore();

const activeTab = ref<'cash' | 'tournaments'>('tournaments');
const datePreset = ref<Exclude<DateRangePreset, 'custom'>>('lifetime');

// Tournament filters and the chart split are analytics-local, like the date
// range above: changing them here never touches the Tournaments page.
const tournamentFilters = ref<TournamentFilters>({ ...DEFAULT_TOURNAMENT_FILTERS });
const breakdown = ref<TournamentBreakdown>('none');

const dateRange = computed(() => getDateRangeFromPreset(datePreset.value));

// Analytics is scoped locally: only completed entries, filtered by the local date range.
// It deliberately ignores the Sessions/Tournaments page filters so the two don't interfere.
// Store state is exposed as readonly refs; analytics only reads/copies these arrays,
// so assert back to the mutable element types for downstream helpers and props.
const completedSessions = computed(() =>
  (sessionsStore.sessions as CashSession[]).filter(s => s.status !== 'in_progress'));
const completedTournaments = computed(() =>
  (tournamentsStore.tournaments as Tournament[]).filter(t => t.status !== 'in_progress'));

const analyticsSessions = computed(() =>
  completedSessions.value.filter(s => isDateInRange(s.date, dateRange.value)));
const dateScopedTournaments = computed(() =>
  completedTournaments.value.filter(t => isDateInRange(t.date, dateRange.value)));
const analyticsTournaments = computed(() =>
  dateScopedTournaments.value.filter(t => matchesTournamentFilters(t, tournamentFilters.value)));

const cashStats = computed(() => calculateSessionStats(analyticsSessions.value));
const tournamentStats = computed(() => calculateTournamentStats(analyticsTournaments.value));

const cashCumulativeData = computed(() => {
  const data = calculateCumulativeProfit(
    analyticsSessions.value,
    item => (item as { result: number }).result,
  );

  return {
    labels: data.map(d => formatDateShort(d.date)),
    datasets: [{
      label: 'Cumulative Profit',
      data: data.map(d => d.cumulative),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3,
    }],
  };
});

const sessionProfitData = computed(() => {
  const sessions = [...analyticsSessions.value]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30);

  return {
    labels: sessions.map(s => formatDateShort(s.date)),
    datasets: [{
      label: 'Session Profit',
      data: sessions.map(s => s.result),
      backgroundColor: sessions.map(s =>
        s.result >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
      ),
    }],
  };
});
</script>
