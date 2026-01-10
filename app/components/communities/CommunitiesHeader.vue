<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <!-- Community Avatar -->
      <div
        v-if="community"
        class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-lg"
        :style="{ backgroundColor: community.avatar || '#10b981' }"
      >
        {{ community.name.charAt(0).toUpperCase() }}
      </div>
      <div>
        <h1 class="text-xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
          {{ community?.name || 'My Community' }}
        </h1>
        <p v-if="community" class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
          {{ community.visibility === 'public' ? 'Public' : 'Private' }}
          <span v-if="pendingCount > 0" class="ml-2 text-accent-600 dark:text-accent-400">
            {{ pendingCount }} pending
          </span>
        </p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button
        v-if="community"
        class="btn-secondary"
        @click="emit('settings')"
      >
        <Cog6ToothIcon class="w-4 h-4" />
        <span class="hidden sm:inline ml-1.5">Settings</span>
      </button>
      <button class="btn-primary" @click="emit('create')">
        <PlusIcon class="w-4 h-4" />
        <span class="hidden sm:inline ml-1.5">{{ community ? 'New' : 'Create' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Community } from '~/types';
import { Cog6ToothIcon, PlusIcon } from '@heroicons/vue/24/outline';

defineProps<{
  community: Community | null;
  pendingCount?: number;
}>();

const emit = defineEmits<{
  create: [];
  settings: [];
}>();
</script>
