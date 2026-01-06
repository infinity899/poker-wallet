<template>
  <div class="min-h-screen bg-surface-secondary dark:bg-surface-dark">
    <!-- Announcement Banner -->
    <LayoutAppAnnouncement class="sticky top-0 z-50" />

    <!-- Desktop Sidebar -->
    <LayoutAppSidebar
      v-if="isDesktop"
      class="fixed left-0 top-0 h-full z-40"
    />

    <!-- Main Content -->
    <div :class="isDesktop ? 'ml-64' : ''">
      <!-- Mobile Header -->
      <LayoutAppHeader v-if="isMobile" />

      <!-- Page Content -->
      <main
        class="min-h-screen"
        :class="[
          isMobile ? 'pb-20 pt-0' : 'p-6',
          !isDesktop && !isMobile ? 'p-4' : '',
        ]"
      >
        <slot />
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <LayoutAppBottomNav
      v-if="isMobile"
      class="fixed bottom-0 left-0 right-0 z-40"
    />

    <!-- Floating Action Button -->
    <LayoutAppFAB @action="handleFabAction" />

    <!-- Global Tournament Session Modal -->
    <TournamentsLogSessionModal
      :is-open="showTournamentSessionModal"
      @close="showTournamentSessionModal = false"
      @save="handleSaveTournamentSession"
    />
  </div>
</template>

<script setup lang="ts">
import type { Currency, SessionType } from '~/types';

const { isMobile, isDesktop } = useBreakpoint();
const { addAnnouncement, removeAnnouncement } = useAnnouncements();
const authStore = useAuthStore();
const tournamentsStore = useTournamentsStore();
const router = useRouter();

const showTournamentSessionModal = ref(false);

function handleFabAction(action: string) {
  if (action === 'logTournamentSession') {
    showTournamentSessionModal.value = true;
  }
}

function handleSaveTournamentSession(data: {
  date: string;
  type: SessionType;
  currency: Currency;
  name: string;
  buyIn: number;
  fee: number;
  entries: number;
  winnings: number;
  venue?: string;
  site?: string;
  notes?: string;
  tags: string[];
  isSession: boolean;
  sessionCount: number;
}) {
  tournamentsStore.addTournament(data);
  showTournamentSessionModal.value = false;
}

const sessionsStore = useSessionsStore();
const horsesStore = useHorsesStore();

async function switchToRealData() {
  await authStore.setDemoMode(false);
  await Promise.all([
    sessionsStore.reload(),
    tournamentsStore.reload(),
    horsesStore.reload(),
  ]);
}

// Show demo mode announcement when in demo mode
watch(
  () => authStore.isDemoMode,
  (isDemoMode) => {
    if (isDemoMode) {
      addAnnouncement({
        id: 'demo-mode-notice',
        type: 'info',
        message: 'You\'re viewing demo data.',
        dismissible: true,
        action: authStore.isAuthenticated
          ? {
              label: 'Switch to real data',
              handler: switchToRealData,
            }
          : {
              label: 'Sign in to track your results',
              handler: () => router.push('/auth/login'),
            },
      });
    }
    else {
      removeAnnouncement('demo-mode-notice');
    }
  },
  { immediate: true },
);
</script>
