<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="emit('close')"
        />

        <!-- Modal Content -->
        <div class="absolute inset-0 flex items-center justify-center p-4">
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div
              v-if="isOpen"
              class="w-full max-w-md bg-surface dark:bg-surface-dark-secondary rounded-xl shadow-xl"
            >
              <!-- Header -->
              <div class="flex items-center justify-between p-4 border-b border-border dark:border-border-dark">
                <h2 class="text-lg font-semibold text-foreground dark:text-foreground-dark">
                  {{ community ? 'Edit Community' : 'Create Community' }}
                </h2>
                <button
                  class="p-1.5 rounded-lg text-foreground-muted dark:text-foreground-dark-muted hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary transition-colors"
                  @click="emit('close')"
                >
                  <XMarkIcon class="w-5 h-5" />
                </button>
              </div>

              <!-- Form -->
              <form @submit.prevent="handleSubmit">
                <div class="p-4 space-y-4">
                  <!-- Name -->
                  <div>
                    <label class="block text-sm font-medium text-foreground dark:text-foreground-dark mb-1.5">
                      Name
                    </label>
                    <input
                      v-model="form.name"
                      type="text"
                      class="input"
                      placeholder="My Poker Stable"
                      required
                    >
                  </div>

                  <!-- Description -->
                  <div>
                    <label class="block text-sm font-medium text-foreground dark:text-foreground-dark mb-1.5">
                      Description
                    </label>
                    <textarea
                      v-model="form.description"
                      class="input min-h-[80px] resize-none"
                      placeholder="Optional description..."
                      rows="3"
                    />
                  </div>

                  <!-- Currency -->
                  <div>
                    <label class="block text-sm font-medium text-foreground dark:text-foreground-dark mb-1.5">
                      Currency
                    </label>
                    <select v-model="form.currency" class="input">
                      <option value="USD">
                        USD ($)
                      </option>
                      <option value="EUR">
                        EUR (&euro;)
                      </option>
                      <option value="GBP">
                        GBP (&pound;)
                      </option>
                      <option value="CAD">
                        CAD ($)
                      </option>
                      <option value="RON">
                        RON (lei)
                      </option>
                    </select>
                  </div>

                  <!-- Visibility -->
                  <div>
                    <label class="block text-sm font-medium text-foreground dark:text-foreground-dark mb-1.5">
                      Visibility
                    </label>
                    <div class="flex gap-3">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          v-model="form.visibility"
                          type="radio"
                          value="private"
                          class="w-4 h-4 text-accent-600 bg-surface dark:bg-surface-dark-tertiary border-border dark:border-border-dark focus:ring-accent-500"
                        >
                        <span class="text-sm text-foreground dark:text-foreground-dark">Private</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          v-model="form.visibility"
                          type="radio"
                          value="public"
                          class="w-4 h-4 text-accent-600 bg-surface dark:bg-surface-dark-tertiary border-border dark:border-border-dark focus:ring-accent-500"
                        >
                        <span class="text-sm text-foreground dark:text-foreground-dark">Public</span>
                      </label>
                    </div>
                    <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted mt-1">
                      {{ form.visibility === 'public' ? 'Others can discover and request to join' : 'Invite-only community' }}
                    </p>
                  </div>

                  <!-- Avatar Color -->
                  <div>
                    <label class="block text-sm font-medium text-foreground dark:text-foreground-dark mb-1.5">
                      Color
                    </label>
                    <div class="flex gap-2">
                      <button
                        v-for="color in COMMUNITY_AVATAR_COLORS"
                        :key="color"
                        type="button"
                        class="w-8 h-8 rounded-lg transition-transform"
                        :class="form.avatar === color ? 'ring-2 ring-offset-2 ring-foreground dark:ring-foreground-dark scale-110' : 'hover:scale-105'"
                        :style="{ backgroundColor: color }"
                        @click="form.avatar = color"
                      />
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="flex items-center justify-end gap-3 p-4 border-t border-border dark:border-border-dark">
                  <button
                    type="button"
                    class="btn-secondary"
                    @click="emit('close')"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="btn-primary"
                    :disabled="!form.name.trim()"
                  >
                    {{ community ? 'Save' : 'Create' }}
                  </button>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Community, CommunityVisibility, Currency, NewCommunity } from '~/types';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { COMMUNITY_AVATAR_COLORS } from '~/types/community';

const props = defineProps<{
  isOpen: boolean;
  community: Community | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [data: Omit<NewCommunity, 'createdBy'>];
}>();

const form = reactive({
  name: '',
  description: '',
  currency: 'USD' as Currency,
  visibility: 'private' as CommunityVisibility,
  avatar: COMMUNITY_AVATAR_COLORS[0],
});

// Reset form when modal opens/closes or community changes
watch(() => [props.isOpen, props.community], () => {
  if (props.isOpen && props.community) {
    form.name = props.community.name;
    form.description = props.community.description || '';
    form.currency = props.community.currency;
    form.visibility = props.community.visibility;
    form.avatar = props.community.avatar || COMMUNITY_AVATAR_COLORS[0];
  }
  else if (props.isOpen && !props.community) {
    form.name = '';
    form.description = '';
    form.currency = 'USD';
    form.visibility = 'private';
    form.avatar = COMMUNITY_AVATAR_COLORS[0];
  }
}, { immediate: true });

function handleSubmit() {
  if (!form.name.trim()) {
    return;
  }

  emit('save', {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    currency: form.currency,
    visibility: form.visibility,
    avatar: form.avatar,
  });
}
</script>
