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
    <LayoutAppFAB />
  </div>
</template>

<script setup lang="ts">
const { isMobile, isDesktop } = useBreakpoint();
const { addAnnouncement } = useAnnouncements();

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
