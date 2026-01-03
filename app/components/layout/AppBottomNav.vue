<script setup lang="ts">
import {
  HomeIcon,
  BanknotesIcon,
  TrophyIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import {
  HomeIcon as HomeIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  TrophyIcon as TrophyIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/vue/24/solid'

const route = useRoute()

const navItems = [
  {
    path: '/',
    label: 'Home',
    icon: HomeIcon,
    iconActive: HomeIconSolid
  },
  {
    path: '/sessions',
    label: 'Sessions',
    icon: BanknotesIcon,
    iconActive: BanknotesIconSolid
  },
  {
    path: '/tournaments',
    label: 'MTTs',
    icon: TrophyIcon,
    iconActive: TrophyIconSolid
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: ChartBarIcon,
    iconActive: ChartBarIconSolid
  }
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="bg-white border-t border-gray-200 h-16 grid grid-cols-4 pb-safe">
    <NuxtLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="flex flex-col items-center justify-center gap-1 transition-colors"
      :class="isActive(item.path) ? 'text-primary-600' : 'text-gray-500'"
    >
      <component
        :is="isActive(item.path) ? item.iconActive : item.icon"
        class="w-6 h-6"
      />
      <span class="text-xs font-medium">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
