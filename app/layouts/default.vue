<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
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
const { addAnnouncement } = useAnnouncements();
const tournamentsStore = useTournamentsStore();

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

// Add default alpha announcement
onMounted(() => {
  addAnnouncement({
    id: 'alpha-notice',
    type: 'info',
    message: 'Alpha version with simulated data. You can add your own sessions on top of it.',
    dismissible: true,
  });
});
</script>
