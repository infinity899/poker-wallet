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
import type { Currency, SessionStatus, SessionType } from '~/types';
import type { TournamentSiteEntry } from '~/types/tournament';

const tournamentsStore = useTournamentsStore();
const communitiesStore = useCommunitiesStore();
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

async function handleSaveSession(data: {
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
  sites?: TournamentSiteEntry[];
  notes?: string;
  tags: string[];
  isSession: boolean;
  sessionCount: number;
  status: SessionStatus;
  communityIds: string[];
}) {
  const result = await tournamentsStore.addTournament({
    ...data,
    status: data.status,
    sites: data.sites,
  });

  if (!result.success) {
    console.error('Failed to save tournament session:', result.error);
  }

  // Link tournament to selected communities
  if (result.success && data.communityIds.length > 0) {
    await communitiesStore.updateTournamentCommunities(result.data.id, data.communityIds);
  }

  closeSessionModal();
}
</script>
