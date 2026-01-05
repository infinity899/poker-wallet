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

    <!-- User & Settings -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
      <!-- User info / Auth buttons -->
      <div v-if="authStore.isAuthenticated" class="px-4 py-2">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
            <span class="text-white text-sm font-medium">
              {{ userInitial }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {{ userEmail }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ authStore.isDemoMode ? 'Demo Mode' : 'Connected' }}
            </p>
          </div>
          <button
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Sign out"
            @click="authStore.signOut()"
          >
            <ArrowRightOnRectangleIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
      <div v-else class="space-y-1">
        <NuxtLink
          to="/auth/login"
          class="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowRightOnRectangleIcon class="w-5 h-5 text-gray-400" />
          <span>Sign in</span>
        </NuxtLink>
        <p class="px-4 text-xs text-gray-500 dark:text-gray-400">
          Demo mode active
        </p>
      </div>

      <!-- Settings link -->
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
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline';

const route = useRoute();
const authStore = useAuthStore();

const navItems = [
  { path: '/', label: 'Dashboard', icon: HomeIcon },
  { path: '/sessions', label: 'Cash Sessions', icon: BanknotesIcon },
  { path: '/tournaments', label: 'Tournaments', icon: TrophyIcon },
  { path: '/horses', label: 'My Horses', icon: UserGroupIcon },
  { path: '/analytics', label: 'Analytics', icon: ChartBarIcon },
];

const userEmail = computed(() => authStore.currentUser?.email || '');
const userInitial = computed(() => {
  const email = userEmail.value;
  return email ? email.charAt(0).toUpperCase() : '?';
});

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
}
</script>
