<template>
  <div class="card p-3 lg:p-4 space-y-3">
    <!-- Always visible: search, live/online, and the panel toggle -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-[11rem]">
        <MagnifyingGlassIcon
          class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-faint"
        />
        <input
          :value="modelValue.searchQuery ?? ''"
          type="search"
          placeholder="Search name, venue, tag…"
          aria-label="Search tournaments"
          class="input pl-8"
          @input="patch({ searchQuery: ($event.target as HTMLInputElement).value })"
        >
      </div>

      <div class="inline-flex gap-1 p-1 rounded-lg bg-surface-secondary border border-border">
        <button
          v-for="option in TYPE_OPTIONS"
          :key="option.value"
          type="button"
          class="px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors"
          :class="modelValue.type === option.value
            ? 'bg-accent-600 text-white shadow-sm'
            : 'text-foreground-muted hover:text-foreground hover:bg-surface-tertiary'"
          @click="patch({ type: option.value })"
        >
          {{ option.label }}
        </button>
      </div>

      <button
        type="button"
        class="btn-secondary"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <FunnelIcon class="w-4 h-4" />
        Filters
        <span v-if="activeCount > 0" class="badge-accent">{{ activeCount }}</span>
        <ChevronDownIcon
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': expanded }"
        />
      </button>

      <button
        v-if="activeCount > 0"
        type="button"
        class="btn-ghost btn-sm"
        @click="reset"
      >
        Clear all
      </button>

      <p
        v-if="totalCount !== undefined"
        class="text-xs text-foreground-muted ml-auto tabular-nums"
      >
        {{ resultCount ?? totalCount }} of {{ totalCount }}
      </p>
    </div>

    <!-- Collapsed summary of what is currently narrowing the set -->
    <div v-if="!expanded && activeChips.length > 0" class="flex flex-wrap gap-1.5">
      <button
        v-for="chip in activeChips"
        :key="chip.label"
        type="button"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300 transition-colors hover:bg-accent-100 dark:hover:bg-accent-900/50"
        :title="`Remove filter: ${chip.label}`"
        @click="chip.clear()"
      >
        {{ chip.label }}
        <XMarkIcon class="w-3 h-3" />
      </button>
    </div>

    <!-- Expanded panel -->
    <div v-show="expanded" class="space-y-4 pt-3 border-t border-border">
      <div v-if="showDate">
        <p class="label">
          Date range
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <div class="inline-flex max-w-full gap-1 p-1 rounded-lg bg-surface-secondary border border-border overflow-x-auto">
            <button
              v-for="preset in DATE_PRESETS"
              :key="preset.value"
              type="button"
              class="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors"
              :class="modelValue.datePreset === preset.value
                ? 'bg-accent-600 text-white shadow-sm'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-tertiary'"
              @click="setDatePreset(preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <input
              :value="modelValue.dateRange.start ?? ''"
              type="date"
              aria-label="From date"
              class="input w-auto"
              @change="setCustomDate('start', ($event.target as HTMLInputElement).value)"
            >
            <span class="text-sm text-foreground-muted">to</span>
            <input
              :value="modelValue.dateRange.end ?? ''"
              type="date"
              aria-label="To date"
              class="input w-auto"
              @change="setCustomDate('end', ($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-baseline justify-between gap-2">
          <p class="label">
            Venues &amp; sites
          </p>
          <button
            v-if="modelValue.venues.length > 0"
            type="button"
            class="text-xs text-foreground-muted hover:text-foreground"
            @click="patch({ venues: [] })"
          >
            Clear
          </button>
        </div>

        <div v-if="venueGroups.length > 0" class="space-y-2 max-h-40 overflow-y-auto">
          <div v-for="group in venueGroups" :key="group.type">
            <p class="text-2xs uppercase tracking-wider text-foreground-faint mb-1">
              {{ group.label }}
            </p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="venue in group.venues"
                :key="venue.name"
                type="button"
                :class="[CHIP_BASE, modelValue.venues.includes(venue.name) ? CHIP_ON : CHIP_OFF]"
                @click="toggle('venues', venue.name)"
              >
                {{ venue.name }}
                <span :class="modelValue.venues.includes(venue.name) ? 'opacity-70' : 'text-foreground-faint'">
                  {{ venue.count }}
                </span>
              </button>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-foreground-muted">
          No venues or sites recorded yet
        </p>
      </div>

      <div v-if="tagOptions.length > 0">
        <div class="flex items-baseline justify-between gap-2">
          <p class="label">
            Tags
          </p>
          <button
            v-if="modelValue.tags.length > 0"
            type="button"
            class="text-xs text-foreground-muted hover:text-foreground"
            @click="patch({ tags: [] })"
          >
            Clear
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          <button
            v-for="tag in tagOptions"
            :key="tag"
            type="button"
            :class="[CHIP_BASE, modelValue.tags.includes(tag) ? CHIP_ON : CHIP_OFF]"
            @click="toggle('tags', tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p class="label">
            Buy-in incl. fee ({{ displayCurrency }})
          </p>
          <div class="flex items-center gap-2">
            <input
              v-model="buyInMinInput"
              type="number"
              min="0"
              step="any"
              inputmode="decimal"
              placeholder="Min"
              aria-label="Minimum buy-in"
              class="input"
              @change="commitBuyInRange"
            >
            <span class="text-foreground-muted">–</span>
            <input
              v-model="buyInMaxInput"
              type="number"
              min="0"
              step="any"
              inputmode="decimal"
              placeholder="Max"
              aria-label="Maximum buy-in"
              class="input"
              @change="commitBuyInRange"
            >
          </div>
        </div>

        <div>
          <label class="label" for="filter-currency">Currency</label>
          <select
            id="filter-currency"
            :value="modelValue.currency"
            class="input"
            @change="patch({ currency: ($event.target as HTMLSelectElement).value as Currency | 'all' })"
          >
            <option value="all">
              All currencies
            </option>
            <option v-for="currency in currencyOptions" :key="currency" :value="currency">
              {{ currency }}
            </option>
          </select>
        </div>

        <div>
          <label class="label" for="filter-itm">Result</label>
          <select
            id="filter-itm"
            :value="modelValue.itm"
            class="input"
            @change="patch({ itm: ($event.target as HTMLSelectElement).value as TournamentItmFilter })"
          >
            <option v-for="option in ITM_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div v-if="showStatus">
          <label class="label" for="filter-status">Status</label>
          <select
            id="filter-status"
            :value="modelValue.status"
            class="input"
            @change="patch({ status: ($event.target as HTMLSelectElement).value as TournamentStatusFilter })"
          >
            <option v-for="option in STATUS_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  Currency,
  DateRangePreset,
  SessionType,
  TournamentFilters,
  TournamentItmFilter,
  TournamentStatusFilter,
} from '~/types';
import {
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';
import { countActiveTournamentFilters, getDateRangeFromPreset } from '~/composables/useFilters';
import { DEFAULT_TOURNAMENT_FILTERS } from '~/types';

const props = withDefaults(defineProps<{
  modelValue: TournamentFilters;
  /** Analytics owns its own date control, so the date row is opt-in. */
  showDate?: boolean;
  /** Off where the set is already scoped to completed entries (analytics). */
  showStatus?: boolean;
  resultCount?: number;
  totalCount?: number;
}>(), {
  showDate: false,
  showStatus: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: TournamentFilters];
}>();

const tournamentsStore = useTournamentsStore();
const currencyStore = useCurrencyStore();
const { displayCurrency } = useCurrency();

const TYPE_OPTIONS: { value: SessionType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'online', label: 'Online' },
];

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'ytd', label: 'YTD' },
  { value: '12m', label: '12M' },
  { value: 'lifetime', label: 'All' },
];

const ITM_OPTIONS: { value: TournamentItmFilter; label: string }[] = [
  { value: 'all', label: 'All results' },
  { value: 'itm', label: 'In the money' },
  { value: 'busted', label: 'Busted' },
];

const STATUS_OPTIONS: { value: TournamentStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'in_progress', label: 'In progress' },
];

const CHIP_BASE = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors';
const CHIP_ON = 'bg-accent-600 border-accent-600 text-white';
const CHIP_OFF = 'bg-surface-tertiary border-border text-foreground-secondary hover:text-foreground hover:border-border-strong';

const expanded = ref(false);

const tagOptions = computed(() => tournamentsStore.tagOptions);
const currencyOptions = computed(() => tournamentsStore.currencyOptions);

/** Live venues and online sites listed separately — they are different things. */
const venueGroups = computed(() => {
  const groups: { type: SessionType; label: string; venues: { name: string; count: number }[] }[] = [
    { type: 'live', label: 'Live venues', venues: [] },
    { type: 'online', label: 'Online sites', venues: [] },
  ];

  for (const venue of tournamentsStore.venueOptions) {
    groups.find(g => g.type === venue.type)?.venues.push({ name: venue.name, count: venue.count });
  }

  return groups.filter(g => g.venues.length > 0);
});

const activeCount = computed(() => countActiveTournamentFilters(props.modelValue));

function patch(partial: Partial<TournamentFilters>): void {
  emit('update:modelValue', { ...props.modelValue, ...partial });
}

function reset(): void {
  emit('update:modelValue', { ...DEFAULT_TOURNAMENT_FILTERS });
}

function toggle(key: 'venues' | 'tags', value: string): void {
  const current = props.modelValue[key];
  patch({
    [key]: current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value],
  });
}

function setDatePreset(preset: DateRangePreset): void {
  patch({ datePreset: preset, dateRange: getDateRangeFromPreset(preset) });
}

function setCustomDate(edge: 'start' | 'end', value: string): void {
  const dateRange = { ...props.modelValue.dateRange, [edge]: value || null };
  const cleared = !dateRange.start && !dateRange.end;
  patch({ dateRange, datePreset: cleared ? 'lifetime' : 'custom' });
}

/*
 * Buy-in bounds are stored in USD (as the data is) but typed in the display
 * currency, so they are held locally and converted on commit rather than on
 * every keystroke — converting mid-typing would rewrite the field under the
 * user's cursor.
 */
const buyInMinInput = ref('');
const buyInMaxInput = ref('');

function usdToInput(usd: number | undefined): string {
  if (usd === undefined) {
    return '';
  }
  return String(Math.round(currencyStore.toDisplayCurrency(usd) * 100) / 100);
}

function inputToUsd(value: string): number | undefined {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return currencyStore.toUSD(parsed, displayCurrency.value);
}

watch(
  () => [props.modelValue.buyInMin, props.modelValue.buyInMax, displayCurrency.value] as const,
  ([min, max]) => {
    buyInMinInput.value = usdToInput(min);
    buyInMaxInput.value = usdToInput(max);
  },
  { immediate: true },
);

function commitBuyInRange(): void {
  patch({
    buyInMin: inputToUsd(buyInMinInput.value),
    buyInMax: inputToUsd(buyInMaxInput.value),
  });
}

/** One removable chip per active filter, shown while the panel is collapsed. */
const activeChips = computed<{ label: string; clear: () => void }[]>(() => {
  const f = props.modelValue;
  const chips: { label: string; clear: () => void }[] = [];

  if (props.showDate && f.datePreset !== 'lifetime') {
    const preset = DATE_PRESETS.find(p => p.value === f.datePreset);
    chips.push({
      label: preset ? `Date: ${preset.label}` : 'Custom dates',
      clear: () => setDatePreset('lifetime'),
    });
  }
  if (f.type !== 'all') {
    chips.push({ label: f.type === 'live' ? 'Live' : 'Online', clear: () => patch({ type: 'all' }) });
  }
  for (const venue of f.venues) {
    chips.push({ label: venue, clear: () => toggle('venues', venue) });
  }
  for (const tag of f.tags) {
    chips.push({ label: `#${tag}`, clear: () => toggle('tags', tag) });
  }
  if (f.buyInMin !== undefined || f.buyInMax !== undefined) {
    const min = f.buyInMin === undefined ? '' : usdToInput(f.buyInMin);
    const max = f.buyInMax === undefined ? '' : usdToInput(f.buyInMax);
    chips.push({
      label: `Buy-in ${min || '0'}–${max || '∞'} ${displayCurrency.value}`,
      clear: () => patch({ buyInMin: undefined, buyInMax: undefined }),
    });
  }
  if (f.currency !== 'all') {
    chips.push({ label: f.currency, clear: () => patch({ currency: 'all' }) });
  }
  if (f.itm !== 'all') {
    chips.push({
      label: ITM_OPTIONS.find(o => o.value === f.itm)?.label ?? f.itm,
      clear: () => patch({ itm: 'all' }),
    });
  }
  if (f.status !== 'all') {
    chips.push({
      label: STATUS_OPTIONS.find(o => o.value === f.status)?.label ?? f.status,
      clear: () => patch({ status: 'all' }),
    });
  }
  if (f.searchQuery) {
    chips.push({ label: `"${f.searchQuery}"`, clear: () => patch({ searchQuery: '' }) });
  }

  return chips;
});
</script>
