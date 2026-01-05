<template>
  <div class="p-4 lg:p-0 space-y-6">
    <TournamentsHeader
      :count="tournamentsStore.filteredTournaments.length"
      @log-session="openSessionModal"
    />
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

    <TournamentsLogSessionModal
      :is-open="showSessionModal"
      @close="closeSessionModal"
      @save="handleSaveSession"
    />
  </div>
</template>

<script setup lang="ts">
import type { Currency, SessionType } from '~/types';

const tournamentsStore = useTournamentsStore();
const { isMobile } = useBreakpoint();

const deleteConfirmId = ref<string | null>(null);
const showSessionModal = ref(false);

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

function openSessionModal() {
  showSessionModal.value = true;
}

function closeSessionModal() {
  showSessionModal.value = false;
}

function handleSaveSession(data: {
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
  closeSessionModal();
}
</script>
