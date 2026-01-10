<template>
  <div>
    <label class="label">Track for community</label>
    <div v-if="myCommunities.length === 0" class="text-sm text-foreground-muted dark:text-foreground-dark-muted">
      You're not a member of any community yet.
    </div>
    <div v-else class="flex flex-wrap gap-2">
      <button
        v-for="community in myCommunities"
        :key="community.id"
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
        :class="isSelected(community.id)
          ? 'bg-accent-600 text-white'
          : 'bg-surface-secondary dark:bg-surface-dark-tertiary text-foreground-secondary dark:text-foreground-dark-secondary hover:bg-surface-tertiary dark:hover:bg-surface-dark-quaternary'"
        @click="toggleCommunity(community.id)"
      >
        <CheckIcon v-if="isSelected(community.id)" class="w-3.5 h-3.5" />
        {{ community.name }}
      </button>
    </div>
    <p v-if="myCommunities.length > 0 && modelValue.length === 0" class="mt-2 text-xs text-foreground-muted dark:text-foreground-dark-muted">
      Select a community to share this result with your group.
    </p>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/20/solid';

const props = defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const communitiesStore = useCommunitiesStore();

const myCommunities = computed(() => communitiesStore.myCommunities);

function isSelected(id: string): boolean {
  return props.modelValue.includes(id);
}

function toggleCommunity(id: string) {
  if (isSelected(id)) {
    emit('update:modelValue', props.modelValue.filter(cid => cid !== id));
  }
  else {
    emit('update:modelValue', [...props.modelValue, id]);
  }
}
</script>
