<template>
  <Teleport to="body">
    <div
      v-if="horse"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="emit('close')"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Log Session
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {{ horse.name }}
        </p>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                v-model="form.date"
                type="date"
                class="input"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select v-model="form.type" class="input">
                <option value="cash">
                  Cash
                </option>
                <option value="tournament">
                  Tournament
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Games
            </label>
            <input
              v-model.number="form.sessionCount"
              type="number"
              min="1"
              class="input"
              :class="{ 'input-error': errors.sessionCount }"
              placeholder="e.g., 25"
            >
            <p v-if="errors.sessionCount" class="mt-1 text-sm text-danger-600">
              {{ errors.sessionCount }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Result ({{ horse.currency }})
            </label>
            <input
              v-model.number="form.result"
              type="number"
              step="1"
              class="input"
              :class="{ 'input-error': errors.result }"
              placeholder="Enter total profit/loss (e.g., -500 or 1200)"
            >
            <p v-if="errors.result" class="mt-1 text-sm text-danger-600">
              {{ errors.result }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use negative numbers for losses
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <input
              v-model="form.description"
              type="text"
              class="input"
              placeholder="e.g., Weekend MTT grind, Sunday cash games"
            >
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" class="btn-secondary flex-1" @click="emit('close')">
              Cancel
            </button>
            <button type="submit" class="btn-primary flex-1">
              Log Session
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Horse, HorseTransactionType } from '~/types';

const props = defineProps<{
  horse: Horse | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [data: {
    horseId: string;
    date: string;
    type: HorseTransactionType;
    result: number;
    description?: string;
    isSession: boolean;
    sessionCount: number;
  }];
}>();

function getToday(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

const form = reactive({
  date: getToday(),
  type: 'tournament' as HorseTransactionType,
  sessionCount: 1,
  result: 0,
  description: '',
});

const errors = reactive<Record<string, string>>({});

// Reset form when horse changes (modal opens)
watch(() => props.horse, () => {
  if (props.horse) {
    form.date = getToday();
    form.type = 'tournament';
    form.sessionCount = 1;
    form.result = 0;
    form.description = '';
    errors.sessionCount = '';
    errors.result = '';
  }
}, { immediate: true });

function validate(): boolean {
  errors.sessionCount = '';
  errors.result = '';

  let valid = true;

  if (!form.sessionCount || form.sessionCount < 1) {
    errors.sessionCount = 'Must be at least 1 game';
    valid = false;
  }

  if (form.result === 0) {
    errors.result = 'Result cannot be zero';
    valid = false;
  }

  return valid;
}

function handleSubmit() {
  if (!validate() || !props.horse) {
    return;
  }

  emit('save', {
    horseId: props.horse.id,
    date: form.date,
    type: form.type,
    result: form.result,
    description: form.description.trim() || `Session (${form.sessionCount} ${form.type === 'tournament' ? 'tournaments' : 'cash games'})`,
    isSession: true,
    sessionCount: form.sessionCount,
  });
}
</script>
