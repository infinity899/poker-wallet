import type {
  DateRange,
  DateRangePreset,
  SessionFilters,
  TournamentFilters
} from '~/types'
import {
  DEFAULT_SESSION_FILTERS,
  DEFAULT_TOURNAMENT_FILTERS
} from '~/types'

export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date()
  const today = now.toISOString().split('T')[0] as string

  switch (preset) {
    case '7d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      const startStr = start.toISOString().split('T')[0] as string
      return { start: startStr, end: today }
    }
    case '30d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      const startStr = start.toISOString().split('T')[0] as string
      return { start: startStr, end: today }
    }
    case '90d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 90)
      const startStr = start.toISOString().split('T')[0] as string
      return { start: startStr, end: today }
    }
    case 'ytd': {
      const start = new Date(now.getFullYear(), 0, 1)
      const startStr = start.toISOString().split('T')[0] as string
      return { start: startStr, end: today }
    }
    case '12m': {
      const start = new Date(now)
      start.setFullYear(start.getFullYear() - 1)
      const startStr = start.toISOString().split('T')[0] as string
      return { start: startStr, end: today }
    }
    case 'lifetime':
    case 'custom':
    default:
      return { start: null, end: null }
  }
}

export function isDateInRange(dateString: string, range: DateRange): boolean {
  if (!range.start && !range.end) return true

  const date = new Date(dateString)

  if (range.start && date < new Date(range.start)) return false
  if (range.end && date > new Date(range.end)) return false

  return true
}

export function useSessionFilters() {
  const filters = ref<SessionFilters>({ ...DEFAULT_SESSION_FILTERS })

  const setDatePreset = (preset: DateRangePreset) => {
    filters.value.datePreset = preset
    filters.value.dateRange = getDateRangeFromPreset(preset)
  }

  const setCustomDateRange = (range: DateRange) => {
    filters.value.datePreset = 'custom'
    filters.value.dateRange = range
  }

  const resetFilters = () => {
    filters.value = { ...DEFAULT_SESSION_FILTERS }
  }

  const hasActiveFilters = computed(() => {
    const f = filters.value
    return (
      f.datePreset !== 'lifetime' ||
      f.type !== 'all' ||
      f.game !== 'all' ||
      f.currency !== 'all' ||
      f.stakes.length > 0 ||
      f.venues.length > 0 ||
      f.tags.length > 0 ||
      f.minProfit !== undefined ||
      f.maxProfit !== undefined ||
      (f.searchQuery && f.searchQuery.length > 0)
    )
  })

  return {
    filters,
    setDatePreset,
    setCustomDateRange,
    resetFilters,
    hasActiveFilters
  }
}

export function useTournamentFilters() {
  const filters = ref<TournamentFilters>({ ...DEFAULT_TOURNAMENT_FILTERS })

  const setDatePreset = (preset: DateRangePreset) => {
    filters.value.datePreset = preset
    filters.value.dateRange = getDateRangeFromPreset(preset)
  }

  const setCustomDateRange = (range: DateRange) => {
    filters.value.datePreset = 'custom'
    filters.value.dateRange = range
  }

  const resetFilters = () => {
    filters.value = { ...DEFAULT_TOURNAMENT_FILTERS }
  }

  const hasActiveFilters = computed(() => {
    const f = filters.value
    return (
      f.datePreset !== 'lifetime' ||
      f.type !== 'all' ||
      f.currency !== 'all' ||
      f.buyInMin !== undefined ||
      f.buyInMax !== undefined ||
      f.venues.length > 0 ||
      f.tags.length > 0 ||
      f.itmOnly ||
      (f.searchQuery && f.searchQuery.length > 0)
    )
  })

  return {
    filters,
    setDatePreset,
    setCustomDateRange,
    resetFilters,
    hasActiveFilters
  }
}
