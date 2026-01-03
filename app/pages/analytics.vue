<script setup lang="ts">
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { formatCurrency, formatDateShort } from '~/utils/formatters'
import { calculateCumulativeProfit } from '~/utils/calculations'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const sessionsStore = useSessionsStore()
const tournamentsStore = useTournamentsStore()

const activeTab = ref<'cash' | 'tournaments' | 'combined'>('cash')

// Cash cumulative profit chart data
const cashCumulativeData = computed(() => {
  const data = calculateCumulativeProfit(
    sessionsStore.sortedSessions.slice().reverse(),
    (item) => (item as any).result
  )

  return {
    labels: data.map(d => formatDateShort(d.date)),
    datasets: [{
      label: 'Cumulative Profit',
      data: data.map(d => d.cumulative),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3
    }]
  }
})

// Session profit bar chart
const sessionProfitData = computed(() => {
  const sessions = sessionsStore.sortedSessions.slice(0, 30).reverse()

  return {
    labels: sessions.map(s => formatDateShort(s.date)),
    datasets: [{
      label: 'Session Profit',
      data: sessions.map(s => s.result),
      backgroundColor: sessions.map(s =>
        s.result >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
      )
    }]
  }
})

// Tournament cumulative profit
const tournamentCumulativeData = computed(() => {
  const sorted = tournamentsStore.sortedTournaments.slice().reverse()
  let cumulative = 0

  const data = sorted.map(t => {
    const cost = (t.buyIn + t.fee) * (t.entries + 1)
    const profit = t.winnings - cost
    cumulative += profit
    return { date: t.date, profit, cumulative }
  })

  return {
    labels: data.map(d => formatDateShort(d.date)),
    datasets: [{
      label: 'Cumulative Profit',
      data: data.map(d => d.cumulative),
      borderColor: 'rgb(139, 92, 246)',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.3
    }]
  }
})

const lineChartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => formatCurrency(context.raw)
      }
    }
  },
  scales: {
    y: {
      ticks: {
        callback: (value: any) => formatCurrency(value)
      }
    }
  }
}

const barChartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => formatCurrency(context.raw)
      }
    }
  },
  scales: {
    y: {
      ticks: {
        callback: (value: any) => formatCurrency(value)
      }
    }
  }
}
</script>

<template>
  <div class="p-4 lg:p-0 space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl lg:text-3xl font-bold text-gray-900">Analytics</h1>
      <p class="text-gray-500 text-sm mt-1">Visualize your poker performance</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2">
      <button
        @click="activeTab = 'cash'"
        class="px-4 py-2 rounded-lg font-medium transition-colors"
        :class="activeTab === 'cash' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
      >
        Cash Games
      </button>
      <button
        @click="activeTab = 'tournaments'"
        class="px-4 py-2 rounded-lg font-medium transition-colors"
        :class="activeTab === 'tournaments' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
      >
        Tournaments
      </button>
    </div>

    <!-- Cash Charts -->
    <div v-if="activeTab === 'cash'" class="grid lg:grid-cols-2 gap-6">
      <!-- Cumulative Profit -->
      <div class="card p-6">
        <h3 class="font-semibold text-gray-900 mb-4">Cumulative Profit</h3>
        <div class="h-64">
          <Line
            v-if="cashCumulativeData.labels.length > 0"
            :data="cashCumulativeData"
            :options="lineChartOptions"
          />
          <div v-else class="h-full flex items-center justify-center text-gray-400">
            No data available
          </div>
        </div>
      </div>

      <!-- Session Profit -->
      <div class="card p-6">
        <h3 class="font-semibold text-gray-900 mb-4">Profit per Session (Last 30)</h3>
        <div class="h-64">
          <Bar
            v-if="sessionProfitData.labels.length > 0"
            :data="sessionProfitData"
            :options="barChartOptions"
          />
          <div v-else class="h-full flex items-center justify-center text-gray-400">
            No data available
          </div>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="card p-6 lg:col-span-2">
        <h3 class="font-semibold text-gray-900 mb-4">Session Statistics</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-500">Total Sessions</p>
            <p class="text-xl font-bold text-gray-900">{{ sessionsStore.stats.totalSessions }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Winning Sessions</p>
            <p class="text-xl font-bold text-success-600">{{ sessionsStore.stats.winningSessions }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Losing Sessions</p>
            <p class="text-xl font-bold text-danger-600">{{ sessionsStore.stats.losingSessions }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Best Session</p>
            <p class="text-xl font-bold text-success-600">{{ formatCurrency(sessionsStore.stats.bestSession) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Worst Session</p>
            <p class="text-xl font-bold text-danger-600">{{ formatCurrency(sessionsStore.stats.worstSession) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Avg Profit</p>
            <p class="text-xl font-bold" :class="sessionsStore.stats.avgProfit >= 0 ? 'text-success-600' : 'text-danger-600'">
              {{ formatCurrency(sessionsStore.stats.avgProfit) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Total Hours</p>
            <p class="text-xl font-bold text-gray-900">{{ sessionsStore.stats.totalHours.toFixed(1) }}h</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Current Streak</p>
            <p class="text-xl font-bold" :class="sessionsStore.stats.currentStreak >= 0 ? 'text-success-600' : 'text-danger-600'">
              {{ sessionsStore.stats.currentStreak > 0 ? '+' : '' }}{{ sessionsStore.stats.currentStreak }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tournament Charts -->
    <div v-if="activeTab === 'tournaments'" class="grid lg:grid-cols-2 gap-6">
      <!-- Cumulative Profit -->
      <div class="card p-6 lg:col-span-2">
        <h3 class="font-semibold text-gray-900 mb-4">Cumulative Profit</h3>
        <div class="h-64">
          <Line
            v-if="tournamentCumulativeData.labels.length > 0"
            :data="tournamentCumulativeData"
            :options="lineChartOptions"
          />
          <div v-else class="h-full flex items-center justify-center text-gray-400">
            No data available
          </div>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="card p-6 lg:col-span-2">
        <h3 class="font-semibold text-gray-900 mb-4">Tournament Statistics</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-500">Total Tournaments</p>
            <p class="text-xl font-bold text-gray-900">{{ tournamentsStore.stats.totalTournaments }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">ITM Count</p>
            <p class="text-xl font-bold text-success-600">{{ tournamentsStore.stats.itm }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">ITM %</p>
            <p class="text-xl font-bold text-gray-900">{{ tournamentsStore.stats.itmPercentage.toFixed(1) }}%</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">ROI</p>
            <p class="text-xl font-bold" :class="tournamentsStore.stats.roi >= 0 ? 'text-success-600' : 'text-danger-600'">
              {{ tournamentsStore.stats.roi.toFixed(1) }}%
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Total Buy-ins</p>
            <p class="text-xl font-bold text-gray-900">{{ formatCurrency(tournamentsStore.stats.totalBuyIns) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Total Winnings</p>
            <p class="text-xl font-bold text-gray-900">{{ formatCurrency(tournamentsStore.stats.totalWinnings) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Avg Buy-in</p>
            <p class="text-xl font-bold text-gray-900">{{ formatCurrency(tournamentsStore.stats.avgBuyIn) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Best Finish</p>
            <p class="text-xl font-bold text-success-600">
              {{ tournamentsStore.stats.bestFinish > 0 ? `${tournamentsStore.stats.bestFinish}${tournamentsStore.stats.bestFinish === 1 ? 'st' : tournamentsStore.stats.bestFinish === 2 ? 'nd' : tournamentsStore.stats.bestFinish === 3 ? 'rd' : 'th'}` : '-' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
