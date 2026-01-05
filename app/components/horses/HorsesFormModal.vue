<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="emit('close')"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {{ horse ? 'Edit Horse' : 'Add Horse' }}
        </h3>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g., Mike 'The Grinder'"
              class="input"
              :class="{ 'input-error': errors.name }"
            >
            <p v-if="errors.name" class="mt-1 text-sm text-danger-600">
              {{ errors.name }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency
            </label>
            <select v-model="form.currency" class="input">
              <option v-for="currency in referenceStore.currencies" :key="currency" :value="currency">
                {{ currency }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in colorOptions"
                :key="color"
                type="button"
                class="w-8 h-8 rounded-full transition-transform hover:scale-110"
                :class="form.avatar === color ? 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-gray-800' : ''"
                :style="{ backgroundColor: color }"
                @click="form.avatar = color"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              v-model="form.notes"
              rows="2"
              class="input"
              placeholder="e.g., Cash game specialist, tournament grinder..."
            />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" class="btn-secondary flex-1" @click="emit('close')">
              Cancel
            </button>
            <button type="submit" class="btn-primary flex-1">
              {{ horse ? 'Save Changes' : 'Add Horse' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Currency, Horse } from '~/types';
import { HORSE_COLORS } from '~/types/horse';

const props = defineProps<{
  isOpen: boolean;
  horse?: Horse | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [data: { name: string; currency: Currency; avatar?: string; notes?: string }];
}>();

const referenceStore = useReferenceStore();

const colorOptions = HORSE_COLORS;
const defaultColor = HORSE_COLORS[0] ?? 'rgb(245, 158, 11)';

const form = reactive({
  name: '',
  currency: 'USD' as Currency,
  avatar: defaultColor,
  notes: '',
});

const errors = reactive<Record<string, string>>({});

// Reset form when modal opens/closes or horse changes
watch(() => [props.isOpen, props.horse], () => {
  if (props.isOpen) {
    if (props.horse) {
      form.name = props.horse.name;
      form.currency = props.horse.currency;
      form.avatar = props.horse.avatar || defaultColor;
      form.notes = props.horse.notes || '';
    }
    else {
      form.name = '';
      form.currency = 'USD';
      form.avatar = defaultColor;
      form.notes = '';
    }
    errors.name = '';
  }
}, { immediate: true });

function validate(): boolean {
  errors.name = '';

  if (!form.name.trim()) {
    errors.name = 'Name is required';
    return false;
  }

  return true;
}

function handleSubmit() {
  if (!validate()) {
    return;
  }

  emit('save', {
    name: form.name.trim(),
    currency: form.currency,
    avatar: form.avatar,
    notes: form.notes.trim() || undefined,
  });
}
</script>
