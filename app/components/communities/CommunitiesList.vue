<template>
  <div class="p-4 lg:p-0 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
          My Communities
        </h1>
        <p class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-0.5">
          Track results with your poker groups
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-secondary" @click="showDiscoverModal = true">
          <GlobeAltIcon class="w-4 h-4" />
          <span class="hidden sm:inline ml-1.5">Discover</span>
        </button>
        <button class="btn-primary" @click="openCreateModal">
          <PlusIcon class="w-4 h-4" />
          <span class="hidden sm:inline ml-1.5">Create</span>
        </button>
      </div>
    </div>

    <!-- No community state -->
    <div
      v-if="communitiesStore.myCommunities.length === 0"
      class="card p-12 text-center"
    >
      <UserGroupIcon class="w-12 h-12 mx-auto text-foreground-muted dark:text-foreground-dark-muted mb-4" />
      <h3 class="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
        No community yet
      </h3>
      <p class="text-foreground-secondary dark:text-foreground-dark-secondary mb-6 max-w-sm mx-auto">
        Create your own community or join one to start tracking results with your poker group.
      </p>
      <div class="flex items-center justify-center gap-3">
        <button class="btn-secondary" @click="showDiscoverModal = true">
          Discover Communities
        </button>
        <button class="btn-primary" @click="openCreateModal">
          Create Community
        </button>
      </div>
    </div>

    <!-- Communities grid -->
    <div v-else class="space-y-6">
      <div class="grid sm:grid-cols-2 gap-4">
        <CommunitiesCard
          v-for="community in communitiesStore.myCommunities"
          :key="community.id"
          :community="community"
          @view="navigateToCommunity"
        />
      </div>
    </div>

    <!-- Create Community Modal -->
    <CommunitiesFormModal
      :is-open="showCreateModal"
      :community="editingCommunity"
      @close="closeCreateModal"
      @save="handleSaveCommunity"
    />

    <!-- Discover Communities Modal -->
    <CommunitiesDiscoverModal
      :is-open="showDiscoverModal"
      @close="showDiscoverModal = false"
      @show-invite-code="showDiscoverModal = false; showJoinModal = true"
      @joined="handleJoined"
    />

    <!-- Join by Invite Code Modal -->
    <CommunitiesJoinModal
      :is-open="showJoinModal"
      @close="showJoinModal = false"
      @joined="handleJoined"
    />
  </div>
</template>

<script setup lang="ts">
import type { Community, NewCommunity } from '~/types';
import { GlobeAltIcon, PlusIcon, UserGroupIcon } from '@heroicons/vue/24/outline';

const communitiesStore = useCommunitiesStore();
const router = useRouter();
const toast = useToast();

// Modal states
const showCreateModal = ref(false);
const showDiscoverModal = ref(false);
const showJoinModal = ref(false);
const editingCommunity = ref<Community | null>(null);

// Prefetch community data for all communities on mount
onMounted(async () => {
  // Fetch data for each community in parallel to show accurate stats in cards
  await Promise.all(
    communitiesStore.myCommunities.map(c => communitiesStore.fetchCommunityData(c.id)),
  );
});

// Navigation
function navigateToCommunity(community: Community) {
  router.push(`/communities/${community.id}`);
}

function handleJoined(_community: Community) {
  // Refresh happens automatically through store
}

// Create modal handlers
function openCreateModal() {
  editingCommunity.value = null;
  showCreateModal.value = true;
}

function closeCreateModal() {
  showCreateModal.value = false;
  editingCommunity.value = null;
}

async function handleSaveCommunity(data: Omit<NewCommunity, 'createdBy'>) {
  if (editingCommunity.value) {
    const result = await communitiesStore.updateCommunity(editingCommunity.value.id, data);
    if (result.success) {
      toast.success('Community updated');
    }
    else {
      toast.error(result.error.message);
    }
  }
  else {
    const result = await communitiesStore.createCommunity(data);
    if (result.success) {
      toast.success('Community created');
    }
    else {
      toast.error(result.error.message);
    }
  }
  closeCreateModal();
}
</script>
