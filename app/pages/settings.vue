<script setup lang="ts">
import { TrashIcon, PlusIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/vue/24/outline'
import type { Venue } from '~/types'

const sessionsStore = useSessionsStore()
const tournamentsStore = useTournamentsStore()
const referenceStore = useReferenceStore()
const { exportSessionsToCSV, exportTournamentsToCSV, exportToJSON, importFromJSON } = useExport()

// Venue form
const newVenue = reactive({
  name: '',
  type: 'live' as 'live' | 'online',
  location: ''
})

const addVenue = () => {
  if (!newVenue.name.trim()) return

  referenceStore.addVenue({
    name: newVenue.name.trim(),
    type: newVenue.type,
    location: newVenue.type === 'live' ? newVenue.location.trim() : undefined
  })

  newVenue.name = ''
  newVenue.location = ''
}

const deleteVenue = (id: string) => {
  referenceStore.deleteVenue(id)
}

// Tag form
const newTag = reactive({
  name: '',
  color: '#3b82f6'
})

const addTag = () => {
  if (!newTag.name.trim()) return

  referenceStore.addTag({
    name: newTag.name.trim(),
    color: newTag.color
  })

  newTag.name = ''
  newTag.color = '#3b82f6'
}

const deleteTag = (id: string) => {
  referenceStore.deleteTag(id)
}

// Export functions
const handleExportSessionsCSV = () => {
  const sessions = JSON.parse(JSON.stringify(sessionsStore.sessions))
  exportSessionsToCSV(sessions)
}

const handleExportTournamentsCSV = () => {
  const tournaments = JSON.parse(JSON.stringify(tournamentsStore.tournaments))
  exportTournamentsToCSV(tournaments)
}

const handleExportBackup = () => {
  const backup = {
    sessions: JSON.parse(JSON.stringify(sessionsStore.sessions)),
    tournaments: JSON.parse(JSON.stringify(tournamentsStore.tournaments)),
    venues: JSON.parse(JSON.stringify(referenceStore.venues)),
    tags: JSON.parse(JSON.stringify(referenceStore.tags)),
    exportedAt: new Date().toISOString()
  }
  exportToJSON(backup, 'poker-wallet-backup')
}

// Import
const fileInput = ref<HTMLInputElement | null>(null)

const handleImportClick = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const data = await importFromJSON<any>(file)

    if (data.sessions) {
      sessionsStore.importSessions(data.sessions, true)
    }
    if (data.tournaments) {
      tournamentsStore.importTournaments(data.tournaments, true)
    }

    alert('Import successful!')
  } catch (error) {
    alert('Import failed. Please check the file format.')
  }

  input.value = ''
}

// Reset data
const showResetConfirm = ref(false)

const handleReset = () => {
  sessionsStore.clearAll()
  tournamentsStore.clearAll()
  referenceStore.resetToDefaults()
  localStorage.clear()
  showResetConfirm.value = false
  window.location.reload()
}
</script>

<template>
  <div class="p-4 lg:p-0 max-w-4xl mx-auto space-y-8">
    <div>
      <h1 class="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-500 text-sm mt-1">Manage your data and preferences</p>
    </div>

    <!-- Venues Management -->
    <div class="card p-6">
      <h2 class="font-semibold text-gray-900 mb-4">Venues & Sites</h2>

      <!-- Add Venue Form -->
      <div class="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          v-model="newVenue.name"
          type="text"
          placeholder="Venue name"
          class="input flex-1"
        />
        <select v-model="newVenue.type" class="input sm:w-32">
          <option value="live">Live</option>
          <option value="online">Online</option>
        </select>
        <input
          v-if="newVenue.type === 'live'"
          v-model="newVenue.location"
          type="text"
          placeholder="Location"
          class="input sm:w-40"
        />
        <button @click="addVenue" class="btn-primary">
          <PlusIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Venue List -->
      <div class="space-y-2">
        <div
          v-for="venue in referenceStore.venues"
          :key="venue.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <span class="font-medium text-gray-900">{{ venue.name }}</span>
            <span
              class="ml-2 badge"
              :class="venue.type === 'live' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
            >
              {{ venue.type }}
            </span>
            <span v-if="venue.location" class="ml-2 text-sm text-gray-500">
              {{ venue.location }}
            </span>
          </div>
          <button @click="deleteVenue(venue.id)" class="p-1 hover:bg-gray-200 rounded">
            <TrashIcon class="w-4 h-4 text-danger-500" />
          </button>
        </div>
      </div>
    </div>

    <!-- Tags Management -->
    <div class="card p-6">
      <h2 class="font-semibold text-gray-900 mb-4">Tags</h2>

      <!-- Add Tag Form -->
      <div class="flex gap-2 mb-4">
        <input
          v-model="newTag.name"
          type="text"
          placeholder="Tag name"
          class="input flex-1"
        />
        <input
          v-model="newTag.color"
          type="color"
          class="w-12 h-10 rounded cursor-pointer"
        />
        <button @click="addTag" class="btn-primary">
          <PlusIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Tag List -->
      <div class="flex flex-wrap gap-2">
        <div
          v-for="tag in referenceStore.tags"
          :key="tag.id"
          class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full"
        >
          <span
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: tag.color }"
          />
          <span class="text-sm font-medium text-gray-700">{{ tag.name }}</span>
          <button @click="deleteTag(tag.id)" class="p-0.5 hover:bg-gray-200 rounded-full">
            <TrashIcon class="w-3 h-3 text-danger-500" />
          </button>
        </div>
      </div>
    </div>

    <!-- Data Management -->
    <div class="card p-6">
      <h2 class="font-semibold text-gray-900 mb-4">Data Management</h2>

      <!-- Export -->
      <div class="mb-6">
        <h3 class="text-sm font-medium text-gray-700 mb-3">Export Data</h3>
        <div class="flex flex-wrap gap-2">
          <button @click="handleExportSessionsCSV" class="btn-secondary">
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            Sessions CSV
          </button>
          <button @click="handleExportTournamentsCSV" class="btn-secondary">
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            Tournaments CSV
          </button>
          <button @click="handleExportBackup" class="btn-secondary">
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            Full Backup (JSON)
          </button>
        </div>
      </div>

      <!-- Import -->
      <div class="mb-6">
        <h3 class="text-sm font-medium text-gray-700 mb-3">Import Data</h3>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleFileChange"
        />
        <button @click="handleImportClick" class="btn-secondary">
          <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
          Import from JSON
        </button>
        <p class="mt-2 text-sm text-gray-500">
          Import a previously exported backup file
        </p>
      </div>

      <!-- Reset -->
      <div class="pt-6 border-t border-gray-200">
        <h3 class="text-sm font-medium text-danger-600 mb-3">Danger Zone</h3>
        <button @click="showResetConfirm = true" class="btn-danger">
          Reset All Data
        </button>
        <p class="mt-2 text-sm text-gray-500">
          This will permanently delete all your sessions, tournaments, and settings.
        </p>
      </div>
    </div>

    <!-- Reset Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showResetConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showResetConfirm = false"
      >
        <div class="bg-white rounded-xl p-6 max-w-sm w-full">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Reset All Data?</h3>
          <p class="text-gray-600 mb-6">
            This will permanently delete all sessions, tournaments, and custom settings. This action cannot be undone.
          </p>
          <div class="flex gap-3">
            <button @click="showResetConfirm = false" class="btn-secondary flex-1">
              Cancel
            </button>
            <button @click="handleReset" class="btn-danger flex-1">
              Reset Everything
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
