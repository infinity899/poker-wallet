<template>
  <nav class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 h-16 grid grid-cols-5 pb-safe">
    <NuxtLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="flex flex-col items-center justify-center gap-1 transition-colors"
      :class="isActive(item.path) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'"
    >
      <component
        :is="isActive(item.path) ? item.iconActive : item.icon"
        class="w-6 h-6"
      />
      <span class="text-xs font-medium">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import {
  BanknotesIcon,
  ChartBarIcon,
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline';
import {
  BanknotesIcon as BanknotesIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  HomeIcon as HomeIconSolid,
  TrophyIcon as TrophyIconSolid,
  UserGroupIcon as UserGroupIconSolid,
} from '@heroicons/vue/24/solid';

const route = useRoute();

const navItems = [
  {
    path: '/',
    label: 'Home',
    icon: HomeIcon,
    iconActive: HomeIconSolid,
  },
  {
    path: '/sessions',
    label: 'Sessions',
    icon: BanknotesIcon,
    iconActive: BanknotesIconSolid,
  },
  {
    path: '/tournaments',
    label: 'MTTs',
    icon: TrophyIcon,
    iconActive: TrophyIconSolid,
  },
  {
    path: '/horses',
    label: 'Horses',
    icon: UserGroupIcon,
    iconActive: UserGroupIconSolid,
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: ChartBarIcon,
    iconActive: ChartBarIconSolid,
  },
];

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
}
</script>
