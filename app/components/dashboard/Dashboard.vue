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

    <div class="grid lg:grid-cols-2 gap-6">
      <DashboardRecentSessions :sessions="recentSessions" />
      <DashboardRecentTournaments :tournaments="recentTournaments" />
    </div>
  </div>
</template>

<script setup lang="ts">
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
</script>
