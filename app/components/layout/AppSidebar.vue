<template>
  <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
    <!-- Logo -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
          <span class="text-white font-bold text-lg">P</span>
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            Poker Wallet
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Track your results
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
        :class="[
          isActive(item.path)
            ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100',
        ]"
      >
        <component
          :is="item.icon"
          class="w-5 h-5"
          :class="isActive(item.path) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'"
        />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Settings -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <NuxtLink
        to="/settings"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
        :class="[
          isActive('/settings')
            ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100',
        ]"
      >
        <Cog6ToothIcon
          class="w-5 h-5"
          :class="isActive('/settings') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'"
        />
        <span>Settings</span>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline';

const route = useRoute();

const navItems = [
  { path: '/', label: 'Dashboard', icon: HomeIcon },
  { path: '/sessions', label: 'Cash Sessions', icon: BanknotesIcon },
  { path: '/tournaments', label: 'Tournaments', icon: TrophyIcon },
  { path: '/horses', label: 'My Horses', icon: UserGroupIcon },
  { path: '/analytics', label: 'Analytics', icon: ChartBarIcon },
];

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
}
</script>
