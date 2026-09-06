<template>
  <div class="p-4 lg:p-0 space-y-6">
    <TournamentsHeader
      :count="tournamentsStore.filteredTournaments.length"
      :total-entries="getTotalEntries(tournamentsStore.filteredTournaments)"
      @log-session="openSessionModal"
    />
    <TournamentsFilterBar
      v-model="tournamentsStore.filters"
      show-date
      :result-count="tournamentsStore.filteredTournaments.length"
      :total-count="tournamentsStore.tournaments.length"
    />

    <TournamentsStats :stats="tournamentsStore.stats" />

    <div class="flex justify-end">
      <TournamentsBreakdownSelect v-model="breakdown" />
    </div>

    <TournamentsProfitChart
      :tournaments="tournamentsStore.sortedTournaments"
      :breakdown="breakdown"
    />

    <TournamentsBreakdownTable
      v-if="breakdown !== 'none'"
      :groups="breakdownGroups"
      :dimension-label="breakdownLabel(breakdown)"
      :overlaps="breakdown === 'tag'"
    />

    <TournamentsMobileList
      v-if="isMobile"
      :tournaments="tournamentsStore.sortedTournaments"
      @delete="handleDelete"
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
import type { Currency, SessionStatus, SessionType, Tournament, TournamentBreakdown } from '~/types';
import type { TournamentSiteEntry } from '~/types/tournament';
import { getTotalEntries } from '~/utils/calculations';
import { breakdownLabel, groupTournaments } from '~/utils/tournamentGrouping';

const tournamentsStore = useTournamentsStore();
const communitiesStore = useCommunitiesStore();
const { isMobile } = useBreakpoint();
const { formatAmount } = useCurrency();

const deleteConfirmId = ref<string | null>(null);
const showSessionModal = ref(false);
// Survives the round trip to an edit page so the list comes back as it was left.
const breakdown = useState<TournamentBreakdown>('tournaments-breakdown', () => 'none');

// The table mirrors the chart: same filtered set, same split, same colors.
const breakdownGroups = computed(() =>
  groupTournaments(
    (tournamentsStore.filteredTournaments as Tournament[]).filter(t => t.status !== 'in_progress'),
    breakdown.value,
    { formatAmount },
  ));

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
