<template>
  <div class="p-4 lg:p-0 space-y-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/communities"
          class="p-2 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded-md transition-colors"
        >
          <ArrowLeftIcon class="w-5 h-5 text-foreground-muted dark:text-foreground-dark-muted" />
        </NuxtLink>
        <div class="flex items-center gap-3">
          <div
            v-if="community"
            class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-lg"
            :style="{ backgroundColor: community.avatar || '#10b981' }"
          >
            {{ community.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h1 class="text-xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
              {{ community?.name || 'Community' }}
            </h1>
            <p v-if="community" class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              {{ community.visibility === 'public' ? 'Public' : 'Private' }}
              <span v-if="pendingCount > 0 && isAdmin" class="ml-2 text-amber-600 dark:text-amber-400">
                {{ pendingCount }} pending
              </span>
            </p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="isAdmin"
          class="btn-secondary"
          @click="openSettingsModal"
        >
          <Cog6ToothIcon class="w-4 h-4" />
          <span class="hidden sm:inline ml-1.5">Settings</span>
        </button>
        <button
          v-if="isAdmin"
          class="btn-secondary text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30"
          @click="showDeleteModal = true"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card p-12 text-center">
      <div class="animate-spin w-8 h-8 border-2 border-accent-600 border-t-transparent rounded-full mx-auto" />
    </div>

    <!-- Not found -->
    <div v-else-if="!community" class="card p-12 text-center">
      <ExclamationCircleIcon class="w-12 h-12 mx-auto text-foreground-muted dark:text-foreground-dark-muted mb-4" />
      <h3 class="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
        Community not found
      </h3>
      <p class="text-foreground-secondary dark:text-foreground-dark-secondary mb-4">
        This community may have been deleted or you don't have access.
      </p>
      <NuxtLink to="/communities" class="btn-primary">
        Back to Communities
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Invite Code Banner (for admins) -->
      <div
        v-if="isAdmin && community.inviteCode"
        class="card p-4 bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-700/50"
      >
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p class="text-sm font-medium text-accent-800 dark:text-accent-200">
              Invite Code
            </p>
            <p class="text-xs text-accent-600 dark:text-accent-400">
              Share this code with others to let them join
            </p>
          </div>
          <div class="flex items-center gap-2">
            <code class="text-sm font-mono bg-white dark:bg-surface-dark px-3 py-1.5 rounded border border-accent-200 dark:border-accent-700">
              {{ community.inviteCode }}
            </code>
            <button
              class="p-2 hover:bg-accent-100 dark:hover:bg-accent-800/50 rounded transition-colors"
              title="Copy invite code"
              @click="copyInviteCode"
            >
              <ClipboardDocumentIcon class="w-4 h-4 text-accent-600 dark:text-accent-400" />
            </button>
          </div>
        </div>
      </div>

      <!-- Overview Stats -->
      <CommunitiesOverview :community-id="community.id" />

      <!-- Cumulative Profit Chart -->
      <CommunitiesChart
        v-if="communityMembers.length > 0"
        :community-id="community.id"
      />

      <!-- Pending Requests (admin only) -->
      <div
        v-if="isAdmin && pendingRequests.length > 0"
        class="card p-4 lg:p-6"
      >
        <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
          Pending Requests
        </h3>
        <div class="space-y-3">
          <div
            v-for="request in pendingRequests"
            :key="request.id"
            class="flex items-center justify-between p-3 bg-surface-secondary dark:bg-surface-dark-tertiary rounded-lg"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                :style="{ backgroundColor: 'rgb(16, 185, 129)' }"
              >
                {{ getMemberInitial(request) }}
              </div>
              <div>
                <p class="text-sm font-medium text-foreground dark:text-foreground-dark">
                  {{ getMemberDisplayName(request) }}
                </p>
                <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
                  {{ request.userEmail }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="btn-secondary text-xs px-3 py-1.5"
                @click="handleReject(request.id)"
              >
                Decline
              </button>
              <button
                class="btn-primary text-xs px-3 py-1.5"
                @click="handleApprove(request.id)"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Members Grid -->
      <div v-if="communityMembers.length > 0">
        <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
          Members ({{ communityMembers.length }})
        </h3>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CommunitiesMemberCard
            v-for="(member, index) in communityMembers"
            :key="member.id"
            :member="member"
            :community-id="community.id"
            :index="index"
            :is-admin="isAdmin"
            @view="openMemberDrawer"
            @remove="handleRemoveMember"
          />
        </div>
      </div>

      <!-- Empty members state -->
      <div
        v-else
        class="card p-8 text-center"
      >
        <UsersIcon class="w-10 h-10 mx-auto text-foreground-muted dark:text-foreground-dark-muted mb-3" />
        <p class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
          No members yet. Share your invite code to invite others.
        </p>
      </div>

      <!-- Leave Community (non-admin) -->
      <div v-if="!isAdmin && isMember" class="pt-4 border-t border-border dark:border-border-dark">
        <button
          class="text-sm text-danger-600 dark:text-danger-400 hover:underline"
          @click="handleLeave"
        >
          Leave Community
        </button>
      </div>
    </template>

    <!-- Settings Modal -->
    <CommunitiesFormModal
      :is-open="showSettingsModal"
      :community="community"
      @close="showSettingsModal = false"
      @save="handleSaveCommunity"
    />

    <!-- Delete Confirmation Modal -->
    <TransitionRoot :show="showDeleteModal" as="template">
      <Dialog as="div" class="relative z-50" @close="showDeleteModal = false">
        <TransitionChild
          as="template"
          enter="ease-out duration-200"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-150"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/40 dark:bg-black/60" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as="template"
              enter="ease-out duration-200"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="ease-in duration-150"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-xl bg-surface dark:bg-surface-dark-secondary shadow-xl transition-all p-6">
                <DialogTitle class="text-lg font-semibold text-foreground dark:text-foreground-dark">
                  Delete Community
                </DialogTitle>
                <p class="mt-2 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                  Are you sure you want to delete "{{ community?.name }}"? This action cannot be undone and all members will be removed.
                </p>
                <div class="flex gap-3 mt-6">
                  <button
                    class="btn-secondary flex-1"
                    @click="showDeleteModal = false"
                  >
                    Cancel
                  </button>
                  <button
                    class="btn-primary flex-1 bg-danger-600 hover:bg-danger-700 dark:bg-danger-600 dark:hover:bg-danger-700"
                    @click="handleDelete"
                  >
                    Delete
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Member Detail Drawer -->
    <CommunitiesMemberDrawer
      :member="selectedMember"
      :community-id="community?.id"
      @close="closeMemberDrawer"
    />
  </div>
</template>

<script setup lang="ts">
import type { CommunityMember, NewCommunity } from '~/types';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
import {
  ArrowLeftIcon,
  ClipboardDocumentIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const communitiesStore = useCommunitiesStore();
const toast = useToast();

const communityId = computed(() => route.params.id as string);
const community = computed(() => communitiesStore.getCommunityById(communityId.value));
const loading = ref(false);

// Modal states
const showSettingsModal = ref(false);
const showDeleteModal = ref(false);
const selectedMember = ref<CommunityMember | null>(null);

// Computed
const communityMembers = computed(() => {
  if (!community.value) {
    return [];
  }
  return communitiesStore.getCommunityMembers(community.value.id);
});

const pendingRequests = computed(() => {
  if (!community.value) {
    return [];
  }
  return communitiesStore.getPendingRequests(community.value.id);
});

const pendingCount = computed(() => pendingRequests.value.length);

const isAdmin = computed(() => {
  if (!community.value) {
    return false;
  }
  return communitiesStore.isAdmin(community.value.id);
});

const isMember = computed(() => {
  if (!community.value) {
    return false;
  }
  return communitiesStore.isMember(community.value.id);
});

// Helper functions
function getMemberDisplayName(member: CommunityMember): string {
  return member.displayName || member.userEmail?.split('@')[0] || 'Member';
}

function getMemberInitial(member: CommunityMember): string {
  const name = getMemberDisplayName(member);
  return name.charAt(0).toUpperCase();
}

// Settings modal
function openSettingsModal() {
  showSettingsModal.value = true;
}

async function handleSaveCommunity(data: Omit<NewCommunity, 'createdBy'>) {
  if (!community.value) {
    return;
  }
  const result = await communitiesStore.updateCommunity(community.value.id, data);
  if (result.success) {
    toast.success('Community updated');
    showSettingsModal.value = false;
  }
  else {
    toast.error(result.error.message);
  }
}

// Member drawer handlers
function openMemberDrawer(member: CommunityMember) {
  selectedMember.value = member;
}

function closeMemberDrawer() {
  selectedMember.value = null;
}

// Membership handlers
async function handleApprove(memberId: string) {
  const result = await communitiesStore.approveMember(memberId);
  if (result.success) {
    toast.success('Member approved');
  }
  else {
    toast.error(result.error.message);
  }
}

async function handleReject(memberId: string) {
  const result = await communitiesStore.rejectMember(memberId);
  if (result.success) {
    toast.success('Request declined');
  }
  else {
    toast.error(result.error.message);
  }
}

async function handleRemoveMember(memberId: string) {
  const result = await communitiesStore.removeMember(memberId);
  if (result.success) {
    toast.success('Member removed');
  }
  else {
    toast.error(result.error.message);
  }
}

async function handleLeave() {
  if (!community.value) {
    return;
  }
  const result = await communitiesStore.leaveCommunity(community.value.id);
  if (result.success) {
    toast.success('Left community');
    router.push('/communities');
  }
  else {
    toast.error(result.error.message);
  }
}

async function handleDelete() {
  if (!community.value) {
    return;
  }
  const result = await communitiesStore.deleteCommunity(community.value.id);
  if (result.success) {
    toast.success('Community deleted');
    router.push('/communities');
  }
  else {
    toast.error(result.error.message);
  }
  showDeleteModal.value = false;
}

function copyInviteCode() {
  if (community.value?.inviteCode) {
    navigator.clipboard.writeText(community.value.inviteCode);
    toast.success('Invite code copied!');
  }
}

// Load members and community data on mount
onMounted(async () => {
  if (community.value) {
    loading.value = true;
    // Fetch members and community data (sessions/tournaments from all members) in parallel
    await Promise.all([
      communitiesStore.fetchCommunityMembers(community.value.id),
      communitiesStore.fetchCommunityData(community.value.id),
    ]);
    loading.value = false;
  }
});
</script>
