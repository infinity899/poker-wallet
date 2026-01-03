<template>
  <div class="card overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Date
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Type
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Game
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Stakes
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Venue/Site
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Duration
          </th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Result
          </th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        <tr
          v-for="session in sessions"
          :key="session.id"
          class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            {{ formatDate(session.date) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm">
            <span
              class="badge"
              :class="session.type === 'live' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'"
            >
              {{ session.type }}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            {{ session.game }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            {{ session.stake }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {{ session.type === 'live' ? session.location : session.site }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {{ formatDuration(session.duration) }}
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold"
            :class="session.result >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
          >
            {{ formatProfit(session.result) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
            <div class="flex gap-2 justify-end">
              <NuxtLink
                :to="`/sessions/${session.id}`"
                class="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <PencilIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </NuxtLink>
              <button
                class="p-1 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded"
                @click.prevent="emit('delete', session.id)"
              >
                <TrashIcon class="w-4 h-4 text-danger-500" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="sessions.length === 0"
      class="p-8 text-center text-gray-500 dark:text-gray-400"
    >
      No sessions yet. Add your first session!
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CashSession } from '~/types';
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { formatDate, formatDuration, formatProfit } from '~/utils/formatters';

defineProps<{
  sessions: CashSession[];
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();
</script>
