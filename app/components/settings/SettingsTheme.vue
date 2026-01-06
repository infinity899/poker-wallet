<template>
  <div class="card p-5">
    <h2 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
      Appearance
    </h2>

    <div class="space-y-2">
      <button
        v-for="option in themeOptions"
        :key="option.value"
        class="w-full flex items-center gap-4 p-3 rounded-lg border transition-all duration-150"
        :class="[
          themeStore.mode === option.value
            ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 dark:border-accent-400'
            : 'border-border dark:border-border-dark hover:border-border-strong dark:hover:border-border-dark-strong',
        ]"
        @click="themeStore.setMode(option.value)"
      >
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          :class="option.iconBg"
        >
          <component :is="option.icon" class="w-4.5 h-4.5" :class="option.iconColor" />
        </div>
        <div class="flex-1 text-left min-w-0">
          <p class="text-sm font-medium text-foreground dark:text-foreground-dark">
            {{ option.label }}
          </p>
          <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
            {{ option.description }}
          </p>
        </div>
        <div
          v-if="themeStore.mode === option.value"
          class="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center shrink-0"
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
    iconBg: 'bg-amber-50 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Dark background with light text',
    icon: MoonIcon,
    iconBg: 'bg-slate-100 dark:bg-slate-700',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow your system preference',
    icon: ComputerDesktopIcon,
    iconBg: 'bg-surface-tertiary dark:bg-surface-dark-tertiary',
    iconColor: 'text-foreground-muted dark:text-foreground-dark-muted',
  },
];
</script>
