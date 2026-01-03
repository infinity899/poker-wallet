<script setup lang="ts">
import { formatCurrency, formatProfit, formatDuration, formatPercentage } from '~/utils/formatters'

const sessionsStore = useSessionsStore()
const tournamentsStore = useTournamentsStore()
const { isMobile } = useBreakpoint()

// Dashboard filters
const showCash = ref(true)
const showTournaments = ref(true)
const showLive = ref(true)
const showOnline = ref(true)

// Combined stats
const totalProfit = computed(() => {
  let profit = 0
  if (showCash.value) {
    const sessions = sessionsStore.sessions.filter(s => {
      if (!showLive.value && s.type === 'live') return false
      if (!showOnline.value && s.type === 'online') return false
      return true
    })
    profit += sessions.reduce((sum, s) => sum + s.result, 0)
  }
  if (showTournaments.value) {
    const tournaments = tournamentsStore.tournaments.filter(t => {
      if (!showLive.value && t.type === 'live') return false
      if (!showOnline.value && t.type === 'online') return false
      return true
    })
    profit += tournaments.reduce((sum, t) => {
      const cost = (t.buyIn + t.fee) * (t.entries + 1)
      return sum + (t.winnings - cost)
    }, 0)
  }
  return profit
})

const totalEntries = computed(() => {
  let count = 0
  if (showCash.value) {
    count += sessionsStore.sessions.filter(s => {
      if (!showLive.value && s.type === 'live') return false
      if (!showOnline.value && s.type === 'online') return false
      return true
    }).length
  }
  if (showTournaments.value) {
    count += tournamentsStore.tournaments.filter(t => {
      if (!showLive.value && t.type === 'live') return false
      if (!showOnline.value && t.type === 'online') return false
      return true
    }).length
  }
  return count
})

const totalHours = computed(() => {
  if (!showCash.value) return 0
  const sessions = sessionsStore.sessions.filter(s => {
    if (!showLive.value && s.type === 'live') return false
    if (!showOnline.value && s.type === 'online') return false
    return true
  })
  return sessions.reduce((sum, s) => sum + s.duration, 0) / 60
})

const hourlyRate = computed(() => {
  if (totalHours.value === 0) return 0
  const sessionProfit = sessionsStore.sessions
    .filter(s => {
      if (!showLive.value && s.type === 'live') return false
      if (!showOnline.value && s.type === 'online') return false
      return true
    })
    .reduce((sum, s) => sum + s.result, 0)
  return sessionProfit / totalHours.value
})

const winRate = computed(() => {
  if (!showCash.value) return 0
  const sessions = sessionsStore.sessions.filter(s => {
    if (!showLive.value && s.type === 'live') return false
    if (!showOnline.value && s.type === 'online') return false
    return true
  })
  if (sessions.length === 0) return 0
  const winning = sessions.filter(s => s.result > 0).length
  return (winning / sessions.length) * 100
})

// Recent activity
const recentSessions = computed(() =>
  sessionsStore.sortedSessions.slice(0, 5)
)

const recentTournaments = computed(() =>
  tournamentsStore.sortedTournaments.slice(0, 5)
)
</script>

<template>
  <div class="p-4 lg:p-0 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-500 text-sm mt-1">Your poker performance at a glance</p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-2">
        <button
          @click="showCash = !showCash"
          class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
          :class="showCash ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'"
        >
          Cash
        </button>
        <button
          @click="showTournaments = !showTournaments"
          class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
          :class="showTournaments ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'"
        >
          MTTs
        </button>
        <button
          @click="showLive = !showLive"
          class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
          :class="showLive ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'"
        >
          Live
        </button>
        <button
          @click="showOnline = !showOnline"
          class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
          :class="showOnline ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'"
        >
          Online
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Profit -->
      <div class="card p-4 lg:p-6">
        <p class="text-sm text-gray-500 mb-1">Total Profit</p>
        <p
          class="text-xl lg:text-2xl font-bold"
          :class="totalProfit >= 0 ? 'text-success-600' : 'text-danger-600'"
        >
          {{ formatProfit(totalProfit) }}
        </p>
      </div>

      <!-- Total Entries -->
      <div class="card p-4 lg:p-6">
        <p class="text-sm text-gray-500 mb-1">Total Entries</p>
        <p class="text-xl lg:text-2xl font-bold text-gray-900">
          {{ totalEntries }}
        </p>
      </div>

      <!-- Win Rate (Cash) -->
      <div class="card p-4 lg:p-6">
        <p class="text-sm text-gray-500 mb-1">Win Rate</p>
        <p class="text-xl lg:text-2xl font-bold text-gray-900">
          {{ formatPercentage(winRate) }}
        </p>
      </div>

      <!-- Hourly Rate -->
      <div class="card p-4 lg:p-6">
        <p class="text-sm text-gray-500 mb-1">Hourly Rate</p>
        <p
          class="text-xl lg:text-2xl font-bold"
          :class="hourlyRate >= 0 ? 'text-success-600' : 'text-danger-600'"
        >
          {{ formatCurrency(hourlyRate) }}/hr
        </p>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Recent Sessions -->
      <div class="card">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">Recent Sessions</h2>
          <NuxtLink to="/sessions" class="text-sm text-primary-600 hover:text-primary-700">
            View all
          </NuxtLink>
        </div>
        <div class="divide-y divide-gray-100">
          <div
            v-for="session in recentSessions"
            :key="session.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">
                  {{ session.game }} {{ session.stake }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ session.type === 'live' ? session.location : session.site }}
                </p>
              </div>
              <div class="text-right">
                <p
                  class="font-semibold"
                  :class="session.result >= 0 ? 'text-success-600' : 'text-danger-600'"
                >
                  {{ formatProfit(session.result) }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatDuration(session.duration) }}
                </p>
              </div>
            </div>
          </div>
          <div v-if="recentSessions.length === 0" class="p-8 text-center text-gray-500">
            No sessions yet
          </div>
        </div>
      </div>

      <!-- Recent Tournaments -->
      <div class="card">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">Recent Tournaments</h2>
          <NuxtLink to="/tournaments" class="text-sm text-primary-600 hover:text-primary-700">
            View all
          </NuxtLink>
        </div>
        <div class="divide-y divide-gray-100">
          <div
            v-for="tournament in recentTournaments"
            :key="tournament.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">
                  {{ tournament.name }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatCurrency(tournament.buyIn) }} buy-in
                  <span v-if="tournament.finishPosition">
                    &middot; {{ tournament.finishPosition }}{{ tournament.finishPosition === 1 ? 'st' : tournament.finishPosition === 2 ? 'nd' : tournament.finishPosition === 3 ? 'rd' : 'th' }}
                  </span>
                </p>
              </div>
              <div class="text-right">
                <p
                  class="font-semibold"
                  :class="tournament.winnings - (tournament.buyIn + tournament.fee) * (tournament.entries + 1) >= 0 ? 'text-success-600' : 'text-danger-600'"
                >
                  {{ formatProfit(tournament.winnings - (tournament.buyIn + tournament.fee) * (tournament.entries + 1)) }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ tournament.cashed ? 'ITM' : 'Bust' }}
                </p>
              </div>
            </div>
          </div>
          <div v-if="recentTournaments.length === 0" class="p-8 text-center text-gray-500">
            No tournaments yet
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
