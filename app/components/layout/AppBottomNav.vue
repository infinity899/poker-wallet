<template>
  <nav class="bg-surface dark:bg-surface-dark-secondary border-t border-border dark:border-border-dark h-16 grid grid-cols-5 pb-safe">
    <NuxtLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="flex flex-col items-center justify-center gap-1 transition-colors duration-150"
      :class="isActive(item.path)
        ? 'text-accent-600 dark:text-accent-400'
        : 'text-foreground-muted dark:text-foreground-dark-muted'"
    >
      <component
        :is="isActive(item.path) ? item.iconActive : item.icon"
        class="w-5 h-5"
      />
      <span class="text-2xs font-medium">{{ item.label }}</span>
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
    path: '/communities',
    label: 'Communities',
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
