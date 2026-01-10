<template>
  <div class="p-4 lg:p-0 space-y-6">
    <AnalyticsHeader />

    <AnalyticsTabs v-model="activeTab" />

    <AnalyticsCashCharts
      v-if="activeTab === 'cash'"
      :cumulative-data="cashCumulativeData"
      :session-profit-data="sessionProfitData"
      :stats="sessionsStore.stats"
    />

    <AnalyticsTournamentCharts
      v-if="activeTab === 'tournaments'"
      :cumulative-data="tournamentCumulativeData"
      :stats="tournamentsStore.stats"
    />
  </div>
</template>

<script setup lang="ts">
import {
  BarElement,
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
import { calculateCumulativeProfit } from '~/utils/calculations';
import { formatDateShort } from '~/utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const sessionsStore = useSessionsStore();
const tournamentsStore = useTournamentsStore();

const activeTab = ref<'cash' | 'tournaments'>('cash');

const cashCumulativeData = computed(() => {
  const data = calculateCumulativeProfit(
    sessionsStore.sortedSessions.slice().reverse(),
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
  const sessions = sessionsStore.sortedSessions.slice(0, 30).reverse();

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

const tournamentCumulativeData = computed(() => {
  const sorted = tournamentsStore.sortedTournaments.slice().reverse();
  let cumulative = 0;

  const data = sorted.map((t) => {
    const cost = (t.buyIn + t.fee) * (t.entries + 1);
    const profit = t.winnings - cost;
    cumulative += profit;
    return { date: t.date, profit, cumulative };
  });

  return {
    labels: data.map(d => formatDateShort(d.date)),
    datasets: [{
      label: 'Cumulative Profit',
      data: data.map(d => d.cumulative),
      borderColor: 'rgb(139, 92, 246)',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.3,
    }],
  };
});
</script>
