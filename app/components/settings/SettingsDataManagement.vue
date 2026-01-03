<template>
  <div class="card p-6">
    <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Data Management
    </h2>

    <div class="mb-6">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Export Data
      </h3>
      <div class="flex flex-wrap gap-2">
        <button class="btn-secondary" @click="handleExportSessionsCSV">
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          Sessions CSV
        </button>
        <button class="btn-secondary" @click="handleExportTournamentsCSV">
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          Tournaments CSV
        </button>
        <button class="btn-secondary" @click="handleExportBackup">
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          Full Backup (JSON)
        </button>
      </div>
    </div>

    <div class="mb-6">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Import Data
      </h3>
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleFileChange"
      >
      <button class="btn-secondary" @click="handleImportClick">
        <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
        Import from JSON
      </button>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Import a previously exported backup file
      </p>
    </div>

    <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
      <h3 class="text-sm font-medium text-danger-600 dark:text-danger-400 mb-3">
        Danger Zone
      </h3>
      <button class="btn-danger" @click="showResetConfirm = true">
        Reset All Data
      </button>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        This will permanently delete all your sessions, tournaments, and settings.
      </p>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="showResetConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showResetConfirm = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Reset All Data?
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          This will permanently delete all sessions, tournaments, and custom settings. This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button class="btn-secondary flex-1" @click="showResetConfirm = false">
            Cancel
          </button>
          <button class="btn-danger flex-1" @click="handleReset">
            Reset Everything
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/vue/24/outline';

const sessionsStore = useSessionsStore();
const tournamentsStore = useTournamentsStore();
const referenceStore = useReferenceStore();
const { exportSessionsToCSV, exportTournamentsToCSV, exportToJSON, importFromJSON } = useExport();

const fileInput = ref<HTMLInputElement | null>(null);
const showResetConfirm = ref(false);

function handleExportSessionsCSV() {
  const sessions = JSON.parse(JSON.stringify(sessionsStore.sessions));
  exportSessionsToCSV(sessions);
}

function handleExportTournamentsCSV() {
  const tournaments = JSON.parse(JSON.stringify(tournamentsStore.tournaments));
  exportTournamentsToCSV(tournaments);
}

function handleExportBackup() {
  const backup = {
    sessions: JSON.parse(JSON.stringify(sessionsStore.sessions)),
    tournaments: JSON.parse(JSON.stringify(tournamentsStore.tournaments)),
    venues: JSON.parse(JSON.stringify(referenceStore.venues)),
    tags: JSON.parse(JSON.stringify(referenceStore.tags)),
    exportedAt: new Date().toISOString(),
  };
  exportToJSON(backup, 'poker-wallet-backup');
}

function handleImportClick() {
  fileInput.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  try {
    const data = await importFromJSON<any>(file);

    if (data.sessions) {
      sessionsStore.importSessions(data.sessions, true);
    }
    if (data.tournaments) {
      tournamentsStore.importTournaments(data.tournaments, true);
    }

    // eslint-disable-next-line no-alert
    alert('Import successful!');
  }
  catch {
    // eslint-disable-next-line no-alert
    alert('Import failed. Please check the file format.');
  }

  input.value = '';
}

function handleReset() {
  sessionsStore.clearAll();
  tournamentsStore.clearAll();
  referenceStore.resetToDefaults();
  localStorage.clear();
  showResetConfirm.value = false;
  window.location.reload();
}
</script>
