<template>
  <div class="card p-6">
    <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Tags
    </h2>

    <div class="flex gap-2 mb-4">
      <input
        v-model="newTag.name"
        type="text"
        placeholder="Tag name"
        class="input flex-1"
      >
      <input
        v-model="newTag.color"
        type="color"
        class="w-12 h-10 rounded cursor-pointer"
      >
      <button class="btn-primary" @click="addTag">
        <PlusIcon class="w-5 h-5" />
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <div
        v-for="tag in referenceStore.tags"
        :key="tag.id"
        class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full"
      >
        <span
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: tag.color }"
        />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ tag.name }}</span>
        <button class="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full" @click="deleteTag(tag.id)">
          <TrashIcon class="w-3 h-3 text-danger-500" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline';

const referenceStore = useReferenceStore();

const newTag = reactive({
  name: '',
  color: '#3b82f6',
});

async function addTag() {
  if (!newTag.name.trim()) {
    return;
  }

  const result = await referenceStore.addTag({
    name: newTag.name.trim(),
    color: newTag.color,
  });

  if (result.success) {
    newTag.name = '';
    newTag.color = '#3b82f6';
  }
}

async function deleteTag(id: string) {
  await referenceStore.deleteTag(id);
}
</script>
