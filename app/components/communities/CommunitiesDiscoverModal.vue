<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="emit('close')">
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
            <DialogPanel class="w-full max-w-lg transform overflow-hidden rounded-xl bg-surface dark:bg-surface-dark-secondary shadow-xl transition-all">
              <!-- Header -->
              <div class="flex items-center justify-between p-4 border-b border-border dark:border-border-dark">
                <div>
                  <DialogTitle class="text-lg font-semibold text-foreground dark:text-foreground-dark">
                    Discover Communities
                  </DialogTitle>
                  <p class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-0.5">
                    Browse and join public poker communities
                  </p>
                </div>
                <button
                  class="p-1.5 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded-md transition-colors"
                  @click="emit('close')"
                >
                  <XMarkIcon class="w-5 h-5 text-foreground-muted dark:text-foreground-dark-muted" />
                </button>
              </div>

              <!-- Search -->
              <div class="p-4 border-b border-border dark:border-border-dark">
                <div class="relative">
                  <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted dark:text-foreground-dark-muted" />
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search communities..."
                    class="input pl-10"
                    @input="handleSearch"
                  >
                </div>
              </div>

              <!-- Results -->
              <div class="max-h-80 overflow-y-auto p-4">
                <!-- Loading -->
                <div v-if="loading" class="flex items-center justify-center py-8">
                  <div class="animate-spin w-6 h-6 border-2 border-accent-600 border-t-transparent rounded-full" />
                </div>

                <!-- Empty state -->
                <div v-else-if="communities.length === 0" class="text-center py-8">
                  <GlobeAltIcon class="w-10 h-10 mx-auto text-foreground-muted dark:text-foreground-dark-muted mb-3" />
                  <p class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                    {{ searchQuery ? 'No communities found matching your search.' : 'No public communities available.' }}
                  </p>
                </div>

                <!-- Communities list -->
                <div v-else class="space-y-3">
                  <div
                    v-for="community in communities"
                    :key="community.id"
                    class="p-3 bg-surface-secondary dark:bg-surface-dark-tertiary rounded-lg"
                  >
                    <div class="flex items-start gap-3">
                      <div
                        class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold shrink-0"
                        :style="{ backgroundColor: community.avatar || '#10b981' }"
                      >
                        {{ community.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-semibold text-foreground dark:text-foreground-dark truncate">
                          {{ community.name }}
                        </h4>
                        <p
                          v-if="community.description"
                          class="text-xs text-foreground-secondary dark:text-foreground-dark-secondary mt-0.5 line-clamp-2"
                        >
                          {{ community.description }}
                        </p>
                      </div>
                      <button
                        v-if="!isMember(community.id) && !isPending(community.id)"
                        class="btn-primary text-xs px-3 py-1.5 shrink-0"
                        :disabled="joiningId === community.id"
                        @click="handleJoin(community)"
                      >
                        {{ joiningId === community.id ? 'Joining...' : 'Join' }}
                      </button>
                      <span
                        v-else-if="isPending(community.id)"
                        class="text-xs text-amber-600 dark:text-amber-400"
                      >
                        Pending
                      </span>
                      <span
                        v-else
                        class="text-xs text-foreground-muted dark:text-foreground-dark-muted"
                      >
                        Joined
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer with invite code option -->
              <div class="p-4 border-t border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary">
                <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted text-center">
                  Have an invite code?
                  <button
                    class="text-accent-600 dark:text-accent-400 hover:underline ml-1"
                    @click="emit('showInviteCode')"
                  >
                    Join by code
                  </button>
                </p>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import type { Community } from '~/types';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
import {
  GlobeAltIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  showInviteCode: [];
  joined: [community: Community];
}>();

const communitiesStore = useCommunitiesStore();
const toast = useToast();

const searchQuery = ref('');
const communities = ref<Community[]>([]);
const loading = ref(false);
const joiningId = ref<string | null>(null);

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>;

function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    await searchCommunities();
  }, 300);
}

async function searchCommunities() {
  loading.value = true;
  try {
    const result = await communitiesStore.searchPublicCommunities(searchQuery.value || undefined);
    if (result.success) {
      communities.value = result.data;
    }
    else {
      toast.error(result.error.message);
    }
  }
  finally {
    loading.value = false;
  }
}

function isMember(communityId: string): boolean {
  return communitiesStore.isMember(communityId);
}

function isPending(communityId: string): boolean {
  return communitiesStore.members.some(
    m => m.communityId === communityId
      && m.userId === communitiesStore.currentUserId
      && m.status === 'pending',
  );
}

async function handleJoin(community: Community) {
  joiningId.value = community.id;
  try {
    const result = await communitiesStore.requestToJoin(community.id);
    if (result.success) {
      toast.success('Join request sent!');
      emit('joined', community);
    }
    else {
      toast.error(result.error.message);
    }
  }
  finally {
    joiningId.value = null;
  }
}

// Load communities when modal opens
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    searchQuery.value = '';
    await searchCommunities();
  }
});
</script>
