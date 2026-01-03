<script setup lang="ts">
import { formatCurrency, formatProfit, formatDate, formatPosition, formatPercentage } from '~/utils/formatters'
import { TrashIcon, PencilIcon } from '@heroicons/vue/24/outline'

const tournamentsStore = useTournamentsStore()
const { isMobile } = useBreakpoint()

const deleteConfirmId = ref<string | null>(null)

const getTournamentProfit = (t: any) => {
  const cost = (t.buyIn + t.fee) * (t.entries + 1)
  return t.winnings - cost
}

const handleDelete = (id: string) => {
  deleteConfirmId.value = id
}

const confirmDelete = () => {
  if (deleteConfirmId.value) {
    tournamentsStore.deleteTournament(deleteConfirmId.value)
    deleteConfirmId.value = null
  }
}

const cancelDelete = () => {
  deleteConfirmId.value = null
}
</script>

<template>
  <div class="p-4 lg:p-0 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-gray-900">Tournaments</h1>
        <p class="text-gray-500 text-sm mt-1">
          {{ tournamentsStore.filteredTournaments.length }} tournaments
        </p>
      </div>
      <NuxtLink to="/tournaments/new" class="btn-primary">
        Add Tournament
      </NuxtLink>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-gray-500">Total Profit</p>
        <p
          class="text-xl font-bold"
          :class="tournamentsStore.stats.totalProfit >= 0 ? 'text-success-600' : 'text-danger-600'"
        >
          {{ formatProfit(tournamentsStore.stats.totalProfit) }}
        </p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">ROI</p>
        <p
          class="text-xl font-bold"
          :class="tournamentsStore.stats.roi >= 0 ? 'text-success-600' : 'text-danger-600'"
        >
          {{ formatPercentage(tournamentsStore.stats.roi) }}
        </p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">ITM %</p>
        <p class="text-xl font-bold text-gray-900">
          {{ formatPercentage(tournamentsStore.stats.itmPercentage) }}
        </p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">Avg Buy-in</p>
        <p class="text-xl font-bold text-gray-900">
          {{ formatCurrency(tournamentsStore.stats.avgBuyIn) }}
        </p>
      </div>
    </div>

    <!-- Tournaments List - Mobile -->
    <div v-if="isMobile" class="space-y-3">
      <NuxtLink
        v-for="tournament in tournamentsStore.sortedTournaments"
        :key="tournament.id"
        :to="`/tournaments/${tournament.id}`"
        class="card p-4 block hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start mb-2">
          <div>
            <p class="font-semibold text-gray-900">
              {{ tournament.name }}
            </p>
            <p class="text-sm text-gray-500">
              {{ formatDate(tournament.date) }} &middot; {{ formatCurrency(tournament.buyIn) }}
            </p>
          </div>
          <p
            class="text-lg font-bold"
            :class="getTournamentProfit(tournament) >= 0 ? 'text-success-600' : 'text-danger-600'"
          >
            {{ formatProfit(getTournamentProfit(tournament)) }}
          </p>
        </div>
        <div class="flex gap-4 text-sm text-gray-500">
          <span>{{ tournament.type === 'live' ? tournament.venue : tournament.site }}</span>
          <span v-if="tournament.finishPosition">{{ formatPosition(tournament.finishPosition) }}</span>
          <span :class="tournament.cashed ? 'text-success-600' : ''">
            {{ tournament.cashed ? 'ITM' : 'Bust' }}
          </span>
        </div>
      </NuxtLink>

      <div v-if="tournamentsStore.sortedTournaments.length === 0" class="card p-8 text-center text-gray-500">
        No tournaments yet. Add your first tournament!
      </div>
    </div>

    <!-- Tournaments Table - Desktop -->
    <div v-else class="card overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Buy-in
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Finish
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Result
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="tournament in tournamentsStore.sortedTournaments"
            :key="tournament.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatDate(tournament.date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ tournament.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span
                class="badge"
                :class="tournament.type === 'live' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
              >
                {{ tournament.type }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatCurrency(tournament.buyIn) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span v-if="tournament.finishPosition">
                {{ formatPosition(tournament.finishPosition) }}
                <span v-if="tournament.fieldSize" class="text-gray-400">
                  / {{ tournament.fieldSize }}
                </span>
              </span>
              <span
                class="ml-2 badge"
                :class="tournament.cashed ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'"
              >
                {{ tournament.cashed ? 'ITM' : 'Bust' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold" :class="getTournamentProfit(tournament) >= 0 ? 'text-success-600' : 'text-danger-600'">
              {{ formatProfit(getTournamentProfit(tournament)) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <div class="flex gap-2 justify-end">
                <NuxtLink
                  :to="`/tournaments/${tournament.id}`"
                  class="p-1 hover:bg-gray-100 rounded"
                >
                  <PencilIcon class="w-4 h-4 text-gray-500" />
                </NuxtLink>
                <button
                  @click.prevent="handleDelete(tournament.id)"
                  class="p-1 hover:bg-danger-50 rounded"
                >
                  <TrashIcon class="w-4 h-4 text-danger-500" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="tournamentsStore.sortedTournaments.length === 0" class="p-8 text-center text-gray-500">
        No tournaments yet. Add your first tournament!
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="deleteConfirmId"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="cancelDelete"
      >
        <div class="bg-white rounded-xl p-6 max-w-sm w-full">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete Tournament?</h3>
          <p class="text-gray-600 mb-6">This action cannot be undone.</p>
          <div class="flex gap-3">
            <button @click="cancelDelete" class="btn-secondary flex-1">
              Cancel
            </button>
            <button @click="confirmDelete" class="btn-danger flex-1">
              Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
