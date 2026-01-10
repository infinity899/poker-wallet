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
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-xl bg-surface dark:bg-surface-dark-secondary shadow-xl transition-all">
              <!-- Header -->
              <div class="flex items-center justify-between p-4 border-b border-border dark:border-border-dark">
                <div>
                  <DialogTitle class="text-lg font-semibold text-foreground dark:text-foreground-dark">
                    Join by Invite Code
                  </DialogTitle>
                  <p class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-0.5">
                    Enter the invite code shared by a community admin
                  </p>
                </div>
                <button
                  class="p-1.5 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded-md transition-colors"
                  @click="emit('close')"
                >
                  <XMarkIcon class="w-5 h-5 text-foreground-muted dark:text-foreground-dark-muted" />
                </button>
              </div>

              <!-- Form -->
              <form class="p-4 space-y-4" @submit.prevent="handleSubmit">
                <!-- Invite code input -->
                <div>
                  <label class="label">Invite Code</label>
                  <input
                    v-model="inviteCode"
                    type="text"
                    placeholder="e.g., ABC123XYZ"
                    class="input font-mono text-center uppercase tracking-wider"
                    :class="{ 'input-error': errorMessage }"
                    maxlength="32"
                    @input="clearError"
                  >
                  <p v-if="errorMessage" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
                    {{ errorMessage }}
                  </p>
                </div>

                <!-- Display name input -->
                <div>
                  <label class="label">Display Name <span class="text-foreground-muted dark:text-foreground-dark-muted font-normal">(optional)</span></label>
                  <input
                    v-model="displayName"
                    type="text"
                    placeholder="How others will see you"
                    class="input"
                    maxlength="50"
                  >
                  <p class="mt-1 text-xs text-foreground-muted dark:text-foreground-dark-muted">
                    Leave blank to use your email username
                  </p>
                </div>

                <!-- Preview community (when found) -->
                <div
                  v-if="foundCommunity"
                  class="p-3 bg-surface-secondary dark:bg-surface-dark-tertiary rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                      :style="{ backgroundColor: foundCommunity.avatar || '#10b981' }"
                    >
                      {{ foundCommunity.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <h4 class="text-sm font-semibold text-foreground dark:text-foreground-dark">
                        {{ foundCommunity.name }}
                      </h4>
                      <p
                        v-if="foundCommunity.description"
                        class="text-xs text-foreground-secondary dark:text-foreground-dark-secondary line-clamp-1"
                      >
                        {{ foundCommunity.description }}
                      </p>
                    </div>
                    <CheckCircleIcon class="w-5 h-5 text-success-500 ml-auto shrink-0" />
                  </div>
                </div>
              </form>

              <!-- Footer -->
              <div class="flex gap-3 p-4 border-t border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary">
                <button
                  type="button"
                  class="btn-secondary flex-1"
                  @click="emit('close')"
                >
                  Cancel
                </button>
                <button
                  class="btn-primary flex-1"
                  :disabled="!inviteCode.trim() || loading"
                  @click="handleSubmit"
                >
                  {{ loading ? 'Joining...' : 'Join Community' }}
                </button>
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
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  joined: [community: Community];
}>();

const communitiesStore = useCommunitiesStore();
const toast = useToast();

const inviteCode = ref('');
const displayName = ref('');
const foundCommunity = ref<Community | null>(null);
const errorMessage = ref('');
const loading = ref(false);

// Debounced lookup
let lookupTimeout: ReturnType<typeof setTimeout>;

function clearError() {
  errorMessage.value = '';
}

// Try to find community when code changes
watch(inviteCode, (code) => {
  clearTimeout(lookupTimeout);
  foundCommunity.value = null;

  if (code.trim().length >= 6) {
    lookupTimeout = setTimeout(async () => {
      const result = await communitiesStore.getCommunityByInviteCode(code.trim().toUpperCase());
      if (result.success && result.data) {
        foundCommunity.value = result.data;
      }
    }, 300);
  }
});

async function handleSubmit() {
  if (!inviteCode.value.trim()) {
    errorMessage.value = 'Please enter an invite code';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await communitiesStore.joinByInviteCode(
      inviteCode.value.trim().toUpperCase(),
      displayName.value.trim() || undefined,
    );

    if (result.success) {
      toast.success(`Requested to join ${result.data.community.name}!`);
      emit('joined', result.data.community);
      emit('close');
    }
    else {
      errorMessage.value = result.error.message;
    }
  }
  finally {
    loading.value = false;
  }
}

// Reset form when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    inviteCode.value = '';
    displayName.value = '';
    foundCommunity.value = null;
    errorMessage.value = '';
  }
});
</script>
