<template>
  <div class="card p-4 lg:p-6">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
          :style="{ backgroundColor: horse.avatar || defaultColor }"
        >
          {{ horse.name.charAt(0).toUpperCase() }}
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">
            {{ horse.name }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ stats.totalTransactions }} transactions
          </p>
        </div>
      </div>
      <Menu as="div" class="relative">
        <MenuButton class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <EllipsisVerticalIcon class="w-5 h-5 text-gray-500" />
        </MenuButton>
        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <MenuItems class="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-10">
            <MenuItem v-slot="{ active }">
              <button
                class="w-full text-left px-4 py-2 text-sm rounded-t-lg"
                :class="active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'"
                @click="emit('edit', horse)"
              >
                Edit
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button
                class="w-full text-left px-4 py-2 text-sm rounded-b-lg"
                :class="active ? 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400' : 'text-danger-600 dark:text-danger-400'"
                @click="emit('delete', horse)"
              >
                Delete
              </button>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Total Profit
        </p>
        <p
          class="text-xl font-bold"
          :class="stats.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
        >
          {{ formatCurrency(stats.totalProfit) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Win Rate
        </p>
        <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ stats.winRate.toFixed(1) }}%
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Best
        </p>
        <p class="font-medium text-success-600 dark:text-success-400">
          {{ formatCurrency(stats.bestResult) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Worst
        </p>
        <p class="font-medium text-danger-600 dark:text-danger-400">
          {{ formatCurrency(stats.worstResult) }}
        </p>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        class="flex-1 btn-secondary"
        @click="emit('logSession', horse)"
      >
        Log Session
      </button>
      <button
        class="flex-1 btn-primary"
        @click="emit('log', horse)"
      >
        Log Result
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Horse } from '~/types';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { EllipsisVerticalIcon } from '@heroicons/vue/24/outline';
import { HORSE_COLORS } from '~/types/horse';
import { formatCurrency } from '~/utils/formatters';

const props = defineProps<{
  horse: Horse;
  index: number;
}>();

const emit = defineEmits<{
  edit: [horse: Horse];
  delete: [horse: Horse];
  log: [horse: Horse];
  logSession: [horse: Horse];
}>();

const horsesStore = useHorsesStore();

const stats = computed(() => horsesStore.getHorseStats(props.horse.id));

const defaultColor = computed(() => HORSE_COLORS[props.index % HORSE_COLORS.length] ?? 'rgb(245, 158, 11)');
</script>
