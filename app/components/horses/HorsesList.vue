<template>
  <div class="p-4 lg:p-0 space-y-6">
    <HorsesHeader
      :count="horsesStore.horses.length"
      @add="openAddModal"
    />

    <HorsesChart
      v-if="horsesStore.horses.length > 0"
      :horses="horsesStore.horses"
    />

    <div v-if="horsesStore.horses.length > 0" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <HorsesCard
        v-for="(horse, index) in horsesStore.sortedHorses"
        :key="horse.id"
        :horse="horse"
        :index="index"
        @edit="openEditModal"
        @delete="openDeleteModal"
        @log="openLogModal"
        @log-session="openSessionModal"
      />
    </div>

    <div
      v-else
      class="card p-12 text-center"
    >
      <UserGroupIcon class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No horses yet
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        Add your first horse to start tracking their results.
      </p>
      <button class="btn-primary" @click="openAddModal">
        Add Your First Horse
      </button>
    </div>

    <HorsesFormModal
      :is-open="showFormModal"
      :horse="editingHorse"
      @close="closeFormModal"
      @save="handleSaveHorse"
    />

    <HorsesLogResultModal
      :horse="loggingHorse"
      @close="closeLogModal"
      @save="handleLogResult"
    />

    <HorsesLogSessionModal
      :horse="sessionHorse"
      @close="closeSessionModal"
      @save="handleLogSession"
    />

    <HorsesDeleteModal
      :horse="deletingHorse"
      @confirm="handleDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import type { Currency, Horse, HorseTransactionType } from '~/types';
import { UserGroupIcon } from '@heroicons/vue/24/outline';

const horsesStore = useHorsesStore();

// Modal states
const showFormModal = ref(false);
const editingHorse = ref<Horse | null>(null);
const loggingHorse = ref<Horse | null>(null);
const sessionHorse = ref<Horse | null>(null);
const deletingHorse = ref<Horse | null>(null);

// Form modal handlers
function openAddModal() {
  editingHorse.value = null;
  showFormModal.value = true;
}

function openEditModal(horse: Horse) {
  editingHorse.value = horse;
  showFormModal.value = true;
}

function closeFormModal() {
  showFormModal.value = false;
  editingHorse.value = null;
}

function handleSaveHorse(data: { name: string; currency: Currency; avatar?: string; notes?: string }) {
  if (editingHorse.value) {
    horsesStore.updateHorse(editingHorse.value.id, data);
  }
  else {
    horsesStore.addHorse(data);
  }
  closeFormModal();
}

// Log modal handlers
function openLogModal(horse: Horse) {
  loggingHorse.value = horse;
}

function closeLogModal() {
  loggingHorse.value = null;
}

function handleLogResult(data: { horseId: string; date: string; type: HorseTransactionType; result: number; description?: string }) {
  horsesStore.addTransaction(data);
  closeLogModal();
}

// Session modal handlers
function openSessionModal(horse: Horse) {
  sessionHorse.value = horse;
}

function closeSessionModal() {
  sessionHorse.value = null;
}

function handleLogSession(data: {
  horseId: string;
  date: string;
  type: HorseTransactionType;
  result: number;
  description?: string;
  isSession: boolean;
  sessionCount: number;
}) {
  horsesStore.addTransaction(data);
  closeSessionModal();
}

// Delete modal handlers
function openDeleteModal(horse: Horse) {
  deletingHorse.value = horse;
}

function closeDeleteModal() {
  deletingHorse.value = null;
}

function handleDelete() {
  if (deletingHorse.value) {
    horsesStore.deleteHorse(deletingHorse.value.id);
    closeDeleteModal();
  }
}
</script>
