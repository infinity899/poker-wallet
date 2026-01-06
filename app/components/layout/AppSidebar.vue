<template>
  <aside class="w-64 bg-surface dark:bg-surface-dark-secondary border-r border-border dark:border-border-dark h-full flex flex-col">
    <!-- Logo -->
    <div class="px-5 py-5 border-b border-border dark:border-border-dark">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-accent-600 dark:bg-accent-500 rounded-lg flex items-center justify-center">
          <span class="text-white font-semibold text-base">P</span>
        </div>
        <div>
          <h1 class="text-base font-semibold text-foreground dark:text-foreground-dark tracking-tight">
            Poker Wallet
          </h1>
          <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
            Track your results
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-3 space-y-0.5">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ 'nav-item-active': isActive(item.path) }"
      >
        <component
          :is="item.icon"
          class="nav-icon"
        />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- User & Settings -->
    <div class="p-3 border-t border-border dark:border-border-dark space-y-1">
      <!-- User info / Auth buttons -->
      <div v-if="authStore.isAuthenticated" class="px-3 py-2">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-accent-600 dark:bg-accent-500 flex items-center justify-center shrink-0">
            <span class="text-white text-sm font-medium">
              {{ userInitial }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground dark:text-foreground-dark truncate">
              {{ userEmail }}
            </p>
            <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
              {{ authStore.isDemoMode ? 'Demo Mode' : 'Connected' }}
            </p>
          </div>
          <button
            class="p-1.5 rounded-md text-foreground-muted dark:text-foreground-dark-muted hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary hover:text-foreground dark:hover:text-foreground-dark transition-colors"
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
          class="nav-item"
        >
          <ArrowRightOnRectangleIcon class="nav-icon" />
          <span>Sign in</span>
        </NuxtLink>
        <p class="px-3 text-xs text-foreground-muted dark:text-foreground-dark-muted">
          Demo mode active
        </p>
      </div>

      <!-- Settings link -->
      <NuxtLink
        to="/settings"
        class="nav-item"
        :class="{ 'nav-item-active': isActive('/settings') }"
      >
        <Cog6ToothIcon class="nav-icon" />
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
