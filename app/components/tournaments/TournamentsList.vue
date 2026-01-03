<template>
  <div class="p-4 lg:p-0 space-y-6">
    <TournamentsHeader :count="tournamentsStore.filteredTournaments.length" />
    <TournamentsStats :stats="tournamentsStore.stats" />

    <TournamentsMobileList
      v-if="isMobile"
      :tournaments="tournamentsStore.sortedTournaments"
    />
    <TournamentsTable
      v-else
      :tournaments="tournamentsStore.sortedTournaments"
      @delete="handleDelete"
    />

    <TournamentsDeleteModal
      :tournament-id="deleteConfirmId"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
const tournamentsStore = useTournamentsStore();
const { isMobile } = useBreakpoint();

const deleteConfirmId = ref<string | null>(null);

function handleDelete(id: string) {
  deleteConfirmId.value = id;
}

function confirmDelete() {
  if (deleteConfirmId.value) {
    tournamentsStore.deleteTournament(deleteConfirmId.value);
    deleteConfirmId.value = null;
  }
}

function cancelDelete() {
  deleteConfirmId.value = null;
}
</script>
