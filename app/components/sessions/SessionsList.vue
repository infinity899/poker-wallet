<template>
  <div class="p-4 lg:p-0 space-y-6">
    <SessionsHeader :count="sessionsStore.filteredSessions.length" />
    <SessionsStats :stats="sessionsStore.stats" />

    <SessionsMobileList
      v-if="isMobile"
      :sessions="sessionsStore.sortedSessions"
    />
    <SessionsTable
      v-else
      :sessions="sessionsStore.sortedSessions"
      @delete="handleDelete"
    />

    <SessionsDeleteModal
      :session-id="deleteConfirmId"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
const sessionsStore = useSessionsStore();
const { isMobile } = useBreakpoint();

const deleteConfirmId = ref<string | null>(null);

function handleDelete(id: string) {
  deleteConfirmId.value = id;
}

function confirmDelete() {
  if (deleteConfirmId.value) {
    sessionsStore.deleteSession(deleteConfirmId.value);
    deleteConfirmId.value = null;
  }
}

function cancelDelete() {
  deleteConfirmId.value = null;
}
</script>
