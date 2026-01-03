<script setup lang="ts">
import { formatCurrency, formatProfit, formatDate, formatDuration } from '~/utils/formatters'
import { TrashIcon, PencilIcon } from '@heroicons/vue/24/outline'

const sessionsStore = useSessionsStore()
const { isMobile, isDesktop } = useBreakpoint()

const deleteConfirmId = ref<string | null>(null)

const handleDelete = (id: string) => {
  deleteConfirmId.value = id
}

const confirmDelete = () => {
  if (deleteConfirmId.value) {
    sessionsStore.deleteSession(deleteConfirmId.value)
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
        <h1 class="text-2xl lg:text-3xl font-bold text-gray-900">Cash Sessions</h1>
        <p class="text-gray-500 text-sm mt-1">
          {{ sessionsStore.filteredSessions.length }} sessions
        </p>
      </div>
      <NuxtLink to="/sessions/new" class="btn-primary">
        Add Session
      </NuxtLink>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-gray-500">Total Profit</p>
        <p
          class="text-xl font-bold"
          :class="sessionsStore.stats.totalProfit >= 0 ? 'text-success-600' : 'text-danger-600'"
        >
          {{ formatProfit(sessionsStore.stats.totalProfit) }}
        </p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">Win Rate</p>
        <p class="text-xl font-bold text-gray-900">
          {{ sessionsStore.stats.winRate.toFixed(1) }}%
        </p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">Hourly Rate</p>
        <p
          class="text-xl font-bold"
          :class="sessionsStore.stats.hourlyRate >= 0 ? 'text-success-600' : 'text-danger-600'"
        >
          {{ formatCurrency(sessionsStore.stats.hourlyRate) }}/hr
        </p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">Total Hours</p>
        <p class="text-xl font-bold text-gray-900">
          {{ sessionsStore.stats.totalHours.toFixed(1) }}h
        </p>
      </div>
    </div>

    <!-- Sessions List - Mobile -->
    <div v-if="isMobile" class="space-y-3">
      <NuxtLink
        v-for="session in sessionsStore.sortedSessions"
        :key="session.id"
        :to="`/sessions/${session.id}`"
        class="card p-4 block hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start mb-2">
          <div>
            <p class="font-semibold text-gray-900">
              {{ session.game }} {{ session.stake }}
            </p>
            <p class="text-sm text-gray-500">
              {{ formatDate(session.date) }}
            </p>
          </div>
          <p
            class="text-lg font-bold"
            :class="session.result >= 0 ? 'text-success-600' : 'text-danger-600'"
          >
            {{ formatProfit(session.result) }}
          </p>
        </div>
        <div class="flex gap-4 text-sm text-gray-500">
          <span>{{ session.type === 'live' ? session.location : session.site }}</span>
          <span>{{ formatDuration(session.duration) }}</span>
        </div>
        <div v-if="session.tags.length" class="mt-2 flex gap-1 flex-wrap">
          <span
            v-for="tag in session.tags"
            :key="tag"
            class="badge-gray"
          >
            {{ tag }}
          </span>
        </div>
      </NuxtLink>

      <div v-if="sessionsStore.sortedSessions.length === 0" class="card p-8 text-center text-gray-500">
        No sessions yet. Add your first session!
      </div>
    </div>

    <!-- Sessions Table - Desktop -->
    <div v-else class="card overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Game
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stakes
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Venue/Site
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duration
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
            v-for="session in sessionsStore.sortedSessions"
            :key="session.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatDate(session.date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span
                class="badge"
                :class="session.type === 'live' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
              >
                {{ session.type }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ session.game }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ session.stake }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ session.type === 'live' ? session.location : session.site }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDuration(session.duration) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold" :class="session.result >= 0 ? 'text-success-600' : 'text-danger-600'">
              {{ formatProfit(session.result) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <div class="flex gap-2 justify-end">
                <NuxtLink
                  :to="`/sessions/${session.id}`"
                  class="p-1 hover:bg-gray-100 rounded"
                >
                  <PencilIcon class="w-4 h-4 text-gray-500" />
                </NuxtLink>
                <button
                  @click.prevent="handleDelete(session.id)"
                  class="p-1 hover:bg-danger-50 rounded"
                >
                  <TrashIcon class="w-4 h-4 text-danger-500" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="sessionsStore.sortedSessions.length === 0" class="p-8 text-center text-gray-500">
        No sessions yet. Add your first session!
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
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete Session?</h3>
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
