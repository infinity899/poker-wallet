<template>
  <div class="card p-6">
    <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Appearance
    </h2>

    <div class="space-y-3">
      <button
        v-for="option in themeOptions"
        :key="option.value"
        class="w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors"
        :class="[
          themeStore.mode === option.value
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        ]"
        @click="themeStore.setMode(option.value)"
      >
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center"
          :class="option.iconBg"
        >
          <component :is="option.icon" class="w-5 h-5" :class="option.iconColor" />
        </div>
        <div class="flex-1 text-left">
          <p class="font-medium text-gray-900 dark:text-gray-100">
            {{ option.label }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ option.description }}
          </p>
        </div>
        <div
          v-if="themeStore.mode === option.value"
          class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
        >
          <CheckIcon class="w-3 h-3 text-white" />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ThemeMode } from '~/stores/theme';

import { CheckIcon, ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/vue/24/outline';

import { useThemeStore } from '~/stores/theme';

const themeStore = useThemeStore();

const themeOptions: {
  value: ThemeMode;
  label: string;
  description: string;
  icon: typeof SunIcon;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Light background with dark text',
    icon: SunIcon,
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Dark background with light text',
    icon: MoonIcon,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow your system preference',
    icon: ComputerDesktopIcon,
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-gray-400',
  },
];
</script>
