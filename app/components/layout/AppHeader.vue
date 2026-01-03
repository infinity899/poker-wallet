<script setup lang="ts">
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'

const route = useRoute()

const pageTitle = computed(() => {
  const path = route.path

  if (path === '/') return 'Dashboard'
  if (path.startsWith('/sessions/new')) return 'New Session'
  if (path.startsWith('/sessions/')) return 'Edit Session'
  if (path.startsWith('/sessions')) return 'Cash Sessions'
  if (path.startsWith('/tournaments/new')) return 'New Tournament'
  if (path.startsWith('/tournaments/')) return 'Edit Tournament'
  if (path.startsWith('/tournaments')) return 'Tournaments'
  if (path.startsWith('/analytics')) return 'Analytics'
  if (path.startsWith('/settings')) return 'Settings'

  return 'Poker Wallet'
})
</script>

<template>
  <header class="bg-white border-b border-gray-200 h-14 px-4 flex items-center justify-between pt-safe">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
        <span class="text-white font-bold text-sm">P</span>
      </div>
      <h1 class="text-lg font-semibold text-gray-900">{{ pageTitle }}</h1>
    </div>

    <NuxtLink
      to="/settings"
      class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <Cog6ToothIcon class="w-6 h-6 text-gray-600" />
    </NuxtLink>
  </header>
</template>
