<template>
  <div class="inline-flex items-center gap-2">
    <label :for="selectId" class="text-xs font-medium text-foreground-muted whitespace-nowrap">
      Break down by
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      class="input w-auto py-1 text-xs"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value as TournamentBreakdown)"
    >
      <option
        v-for="option in TOURNAMENT_BREAKDOWN_OPTIONS"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import type { TournamentBreakdown } from '~/types';
import { TOURNAMENT_BREAKDOWN_OPTIONS } from '~/utils/tournamentGrouping';

defineProps<{
  modelValue: TournamentBreakdown;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: TournamentBreakdown];
}>();

const selectId = useId();
</script>
