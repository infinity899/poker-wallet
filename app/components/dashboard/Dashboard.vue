<template>
  <div class="p-4 lg:p-0 space-y-6">
    <DashboardHeader
      v-model:show-cash="showCash"
      v-model:show-tournaments="showTournaments"
      v-model:show-live="showLive"
      v-model:show-online="showOnline"
    />

    <DashboardStats
      :total-profit="totalProfit"
      :total-entries="totalEntries"
      :win-rate="winRate"
      :hourly-rate="hourlyRate"
    />

    <DashboardProfitChart :chart-data="combinedChartData" />

    <div class="grid lg:grid-cols-2 gap-6">
      <DashboardRecentSessions :sessions="recentSessions" />
      <DashboardRecentTournaments :tournaments="recentTournaments" />
    </div>
  </div>
</template>

<script setup lang="ts">
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
import { formatDateShort } from '~/utils/formatters';

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

const sessionsStore = useSessionsStore();
const tournamentsStore = useTournamentsStore();

const showCash = ref(true);
const showTournaments = ref(true);
const showLive = ref(true);
const showOnline = ref(true);

const filteredSessions = computed(() => {
  if (!showCash.value) {
    return [];
  }
  return sessionsStore.sessions.filter((s) => {
    if (!showLive.value && s.type === 'live') {
      return false;
    }
    if (!showOnline.value && s.type === 'online') {
      return false;
    }
    return true;
  });
});

const filteredTournaments = computed(() => {
  if (!showTournaments.value) {
    return [];
  }
  return tournamentsStore.tournaments.filter((t) => {
    if (!showLive.value && t.type === 'live') {
      return false;
    }
    if (!showOnline.value && t.type === 'online') {
      return false;
    }
    return true;
  });
});

const totalProfit = computed(() => {
  const sessionProfit = filteredSessions.value.reduce((sum, s) => sum + s.result, 0);
  const tournamentProfit = filteredTournaments.value.reduce((sum, t) => {
    const cost = (t.buyIn + t.fee) * (t.entries + 1);
    return sum + (t.winnings - cost);
  }, 0);
  return sessionProfit + tournamentProfit;
});

const totalEntries = computed(() => {
  return filteredSessions.value.length + filteredTournaments.value.length;
});

const totalHours = computed(() => {
  return filteredSessions.value.reduce((sum, s) => sum + s.duration, 0) / 60;
});

const hourlyRate = computed(() => {
  if (totalHours.value === 0) {
    return 0;
  }
  const sessionProfit = filteredSessions.value.reduce((sum, s) => sum + s.result, 0);
  return sessionProfit / totalHours.value;
});

const winRate = computed(() => {
  if (filteredSessions.value.length === 0) {
    return 0;
  }
  const winning = filteredSessions.value.filter(s => s.result > 0).length;
  return (winning / filteredSessions.value.length) * 100;
});

const recentSessions = computed(() => sessionsStore.sortedSessions.slice(0, 5));
const recentTournaments = computed(() => tournamentsStore.sortedTournaments.slice(0, 5));

// Combined chart data with 3 lines: Cash, Tournaments, Combined
const combinedChartData = computed(() => {
  // Get all cash session data points
  const cashData: { date: string; profit: number; type: 'cash' }[] = filteredSessions.value.map(s => ({
    date: s.date,
    profit: s.result,
    type: 'cash' as const,
  }));

  // Get all tournament data points
  const tournamentData: { date: string; profit: number; type: 'tournament' }[] = filteredTournaments.value.map((t) => {
    const cost = (t.buyIn + t.fee) * (t.entries + 1);
    return {
      date: t.date,
      profit: t.winnings - cost,
      type: 'tournament' as const,
    };
  });

  // Combine and sort all data by date
  const allData = [...cashData, ...tournamentData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  if (allData.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Calculate cumulative values for each line
  let cashCumulative = 0;
  let tournamentCumulative = 0;
  let combinedCumulative = 0;

  const labels: string[] = [];
  const cashValues: (number | null)[] = [];
  const tournamentValues: (number | null)[] = [];
  const combinedValues: number[] = [];

  // Track last known values for interpolation
  let lastCashValue = 0;
  let lastTournamentValue = 0;

  for (const item of allData) {
    labels.push(formatDateShort(item.date));

    if (item.type === 'cash') {
      cashCumulative += item.profit;
      lastCashValue = cashCumulative;
      cashValues.push(cashCumulative);
      tournamentValues.push(lastTournamentValue);
    }
    else {
      tournamentCumulative += item.profit;
      lastTournamentValue = tournamentCumulative;
      tournamentValues.push(tournamentCumulative);
      cashValues.push(lastCashValue);
    }

    combinedCumulative += item.profit;
    combinedValues.push(combinedCumulative);
  }

  return {
    labels,
    datasets: [
      {
        label: 'Combined',
        data: combinedValues,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(16, 185, 129)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        order: 3,
      },
      {
        label: 'Cash Sessions',
        data: cashValues,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderDash: [],
        order: 2,
      },
      {
        label: 'Tournaments',
        data: tournamentValues,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: false,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'rgb(168, 85, 247)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderDash: [5, 5],
        order: 1,
      },
    ],
  };
});
</script>
