# Poker Wallet Architecture Refactor Plan

**Current State**: Functional MVP with clean patterns but significant duplication
**Target State**: Production-ready, scalable architecture for thousands of concurrent users
**Architecture Score**: 7.5/10 → Target 9.5/10

---

## Executive Summary

The codebase has solid foundations but needs architectural refinement before scaling. The main issues are:
1. **Store duplication** - ~300 lines of repeated boilerplate across 4 stores
2. **Demo/Production branching** - Every action has if/else for persistence mode
3. **Missing error handling** - Failures are logged but not surfaced to users
4. **Performance ceiling** - In-memory filtering won't scale past 5,000 records

---

## Phase 1: Foundation Layer (Critical)

### 1.1 Adapter Pattern for Persistence

**Problem**: Every store has dual-path logic:
```typescript
// Current - repeated in every action
if (isDemoMode.value) {
  // localStorage path (~20 lines)
} else {
  // Supabase path (~20 lines)
}
```

**Solution**: Create unified storage adapter interface

**Files to create**:
- `app/adapters/types.ts`
- `app/adapters/LocalStorageAdapter.ts`
- `app/adapters/SupabaseAdapter.ts`
- `app/adapters/index.ts`

**Implementation**:

```typescript
// app/adapters/types.ts
export interface StorageAdapter<T extends { id: string }> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | null>
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, updates: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
  deleteMany(ids: string[]): Promise<void>
}
```

```typescript
// app/adapters/LocalStorageAdapter.ts
import type { StorageAdapter } from './types'

export class LocalStorageAdapter<T extends { id: string }> implements StorageAdapter<T> {
  constructor(
    private storageKey: string,
    private seedDataPath?: string
  ) {}

  async getAll(): Promise<T[]> {
    const stored = localStorage.getItem(this.storageKey)
    if (stored) {
      return JSON.parse(stored)
    }
    // Load seed data if available
    if (this.seedDataPath) {
      const response = await fetch(this.seedDataPath)
      const data = await response.json()
      this.saveAll(data)
      return data
    }
    return []
  }

  async getById(id: string): Promise<T | null> {
    const items = await this.getAll()
    return items.find(item => item.id === id) || null
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const items = await this.getAll()
    const now = new Date().toISOString()
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as T
    items.push(newItem)
    this.saveAll(items)
    return newItem
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const items = await this.getAll()
    const index = items.findIndex(item => item.id === id)
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`)
    }
    const updated = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    items[index] = updated
    this.saveAll(items)
    return updated
  }

  async delete(id: string): Promise<void> {
    const items = await this.getAll()
    const filtered = items.filter(item => item.id !== id)
    this.saveAll(filtered)
  }

  async deleteMany(ids: string[]): Promise<void> {
    const items = await this.getAll()
    const idSet = new Set(ids)
    const filtered = items.filter(item => !idSet.has(item.id))
    this.saveAll(filtered)
  }

  private saveAll(items: T[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items))
  }

  clearAll(): void {
    localStorage.removeItem(this.storageKey)
  }
}
```

```typescript
// app/adapters/SupabaseAdapter.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { StorageAdapter } from './types'
import { camelToSnakeObject, snakeToCamelObject } from '~/utils/caseMapping'

export class SupabaseAdapter<T extends { id: string }, DbT> implements StorageAdapter<T> {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string,
    private userId: string,
    private toFrontend: (db: DbT) => T,
    private toDatabase: (item: Partial<T>) => Partial<DbT>
  ) {}

  async getAll(): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', this.userId)
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []).map(this.toFrontend)
  }

  async getById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data ? this.toFrontend(data) : null
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const dbItem = {
      ...this.toDatabase(item as Partial<T>),
      user_id: this.userId,
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(dbItem)
      .select()
      .single()

    if (error) throw error
    return this.toFrontend(data)
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const dbUpdates = this.toDatabase(updates)

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single()

    if (error) throw error
    return this.toFrontend(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId)

    if (error) throw error
  }

  async deleteMany(ids: string[]): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .in('id', ids)
      .eq('user_id', this.userId)

    if (error) throw error
  }
}
```

```typescript
// app/adapters/index.ts
export * from './types'
export { LocalStorageAdapter } from './LocalStorageAdapter'
export { SupabaseAdapter } from './SupabaseAdapter'
```

**Estimated lines saved**: ~200 lines across stores

---

### 1.2 Base Store Factory

**Problem**: All stores repeat the same patterns:
- `loading`, `initialized` refs
- `initialize()` with guard
- `saveToStorage()` helper
- Error logging pattern

**Files to create**:
- `app/stores/createEntityStore.ts`

**Files to modify**:
- `app/stores/sessions.ts` - use factory
- `app/stores/tournaments.ts` - use factory
- `app/stores/horses.ts` - use factory

**Implementation**:

```typescript
// app/stores/createEntityStore.ts
import type { Ref } from 'vue'
import type { StorageAdapter } from '~/adapters/types'
import type { Result } from '~/types/result'

export interface EntityStoreOptions<T, F, S> {
  name: string
  getAdapter: () => StorageAdapter<T>
  defaultFilters: F
  calculateStats: (items: T[]) => S
  applyFilters: (items: T[], filters: F) => T[]
  sortItems: (items: T[]) => T[]
}

export function createEntityStore<
  T extends { id: string },
  F extends Record<string, any>,
  S
>(options: EntityStoreOptions<T, F, S>) {
  return defineStore(options.name, () => {
    const authStore = useAuthStore()

    // State
    const items = ref<T[]>([]) as Ref<T[]>
    const loading = ref(false)
    const initialized = ref(false)
    const filters = ref<F>({ ...options.defaultFilters }) as Ref<F>
    const error = ref<string | null>(null)

    // Computed
    const filteredItems = computed(() => options.applyFilters(items.value, filters.value))
    const sortedItems = computed(() => options.sortItems(filteredItems.value))
    const stats = computed(() => options.calculateStats(filteredItems.value))

    // Actions
    async function initialize(): Promise<void> {
      if (initialized.value) return

      loading.value = true
      error.value = null

      try {
        await authStore.waitForSettings()
        const adapter = options.getAdapter()
        items.value = await adapter.getAll()
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Failed to load data'
        console.error(`Failed to initialize ${options.name}:`, e)
      } finally {
        loading.value = false
        initialized.value = true
      }
    }

    async function add(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<T>> {
      try {
        const adapter = options.getAdapter()
        const created = await adapter.create(item)
        items.value.push(created)
        return { success: true, data: created }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to create item'
        return { success: false, error: new Error(message) }
      }
    }

    async function update(id: string, updates: Partial<T>): Promise<Result<T>> {
      try {
        const adapter = options.getAdapter()
        const updated = await adapter.update(id, updates)
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          items.value[index] = updated
        }
        return { success: true, data: updated }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to update item'
        return { success: false, error: new Error(message) }
      }
    }

    async function remove(id: string): Promise<Result<void>> {
      try {
        const adapter = options.getAdapter()
        await adapter.delete(id)
        items.value = items.value.filter(item => item.id !== id)
        return { success: true, data: undefined }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to delete item'
        return { success: false, error: new Error(message) }
      }
    }

    async function removeMany(ids: string[]): Promise<Result<void>> {
      try {
        const adapter = options.getAdapter()
        await adapter.deleteMany(ids)
        const idSet = new Set(ids)
        items.value = items.value.filter(item => !idSet.has(item.id))
        return { success: true, data: undefined }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to delete items'
        return { success: false, error: new Error(message) }
      }
    }

    function getById(id: string): T | undefined {
      return items.value.find(item => item.id === id)
    }

    function setFilters(newFilters: Partial<F>): void {
      filters.value = { ...filters.value, ...newFilters }
    }

    function resetFilters(): void {
      filters.value = { ...options.defaultFilters }
    }

    async function reload(): Promise<void> {
      initialized.value = false
      await initialize()
    }

    return {
      // State
      items,
      loading: readonly(loading),
      initialized: readonly(initialized),
      filters,
      error: readonly(error),

      // Computed
      filteredItems,
      sortedItems,
      stats,

      // Actions
      initialize,
      add,
      update,
      remove,
      removeMany,
      getById,
      setFilters,
      resetFilters,
      reload,
    }
  })
}
```

---

### 1.3 Result Type Pattern for Error Handling

**Problem**: Errors are swallowed and logged, users have no feedback

```typescript
// Current
catch (error) {
  console.error('Failed to save session:', error)
  // User has no idea operation failed
}
```

**Files to create**:
- `app/types/result.ts`
- `app/composables/useToast.ts`

**Files to modify**:
- All store actions to return `Result<T>`
- Components to handle results

**Implementation**:

```typescript
// app/types/result.ts
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success
}

export function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success
}
```

```typescript
// app/composables/useToast.ts
interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function show(type: Toast['type'], message: string, duration = 4000) {
    const id = crypto.randomUUID()
    toasts.value.push({ id, type, message, duration })

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts: readonly(toasts),
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message),
    info: (message: string) => show('info', message),
    warning: (message: string) => show('warning', message),
    dismiss,
  }
}
```

**Usage in components**:

```typescript
// In any component
const toast = useToast()
const sessionsStore = useSessionsStore()

async function saveSession() {
  const result = await sessionsStore.add(sessionData)

  if (result.success) {
    toast.success('Session saved successfully')
    navigateTo('/sessions')
  } else {
    toast.error(`Failed to save: ${result.error.message}`)
  }
}
```

---

## Phase 2: Data Layer Improvements

### 2.1 Type-Safe Database Mapping

**Problem**: Manual camelCase ↔ snake_case mapping is error-prone

```typescript
// Current - easy to miss a field
dbUpdates.start_time = updates.startTime  // Manual for 30+ fields
```

**Files to create**:
- `app/utils/caseMapping.ts`

**Files to modify**:
- `app/composables/useDatabase.ts`

**Implementation**:

```typescript
// app/utils/caseMapping.ts
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function camelToSnakeObject<T extends Record<string, any>>(
  obj: T
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue
    const snakeKey = camelToSnake(key)
    result[snakeKey] = value
  }
  return result
}

export function snakeToCamelObject<T extends Record<string, any>>(
  obj: T
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key)
    result[camelKey] = value
  }
  return result
}

// Field mappings for special cases (fields that don't follow standard conversion)
const FIELD_MAPPINGS: Record<string, string> = {
  // camelCase: snake_case
  buyIn: 'buy_in',
  cashOut: 'cash_out',
}

export function toDbSession(session: Partial<CashSession>): Record<string, any> {
  return camelToSnakeObject(session)
}

export function fromDbSession(dbSession: Record<string, any>): CashSession {
  return snakeToCamelObject(dbSession) as CashSession
}
```

---

### 2.2 Pagination for Large Datasets

**Problem**: All data loaded into memory, will degrade at 5,000+ records

**Files to modify**:
- `app/adapters/SupabaseAdapter.ts` - add pagination methods
- List components - implement infinite scroll

**Implementation**:

```typescript
// Add to SupabaseAdapter.ts
interface PaginatedResult<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
  total?: number
}

interface PaginationOptions {
  cursor?: string
  limit?: number
}

async getPaginated(options: PaginationOptions = {}): Promise<PaginatedResult<T>> {
  const { limit = 50, cursor } = options

  let query = this.supabase
    .from(this.tableName)
    .select('*', { count: 'exact' })
    .eq('user_id', this.userId)
    .order('date', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('date', cursor)
  }

  const { data, error, count } = await query

  if (error) throw error

  const hasMore = (data?.length || 0) > limit
  const items = (data || []).slice(0, limit).map(this.toFrontend)

  return {
    data: items,
    nextCursor: hasMore && data ? data[limit - 1].date : null,
    hasMore,
    total: count || undefined,
  }
}
```

```typescript
// app/composables/useInfiniteScroll.ts
export function useInfiniteScroll<T>(
  fetchFn: (cursor?: string) => Promise<PaginatedResult<T>>
) {
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const hasMore = ref(true)
  const cursor = ref<string | null>(null)
  const error = ref<string | null>(null)

  async function loadMore() {
    if (loading.value || !hasMore.value) return

    loading.value = true
    error.value = null

    try {
      const result = await fetchFn(cursor.value || undefined)
      items.value.push(...result.data)
      cursor.value = result.nextCursor
      hasMore.value = result.hasMore
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load'
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    items.value = []
    cursor.value = null
    hasMore.value = true
    await loadMore()
  }

  return {
    items: readonly(items),
    loading: readonly(loading),
    hasMore: readonly(hasMore),
    error: readonly(error),
    loadMore,
    refresh,
  }
}
```

---

## Phase 3: Component Architecture

### 3.1 Extract Shared UI Primitives

**Problem**: UI patterns repeated across features without abstraction

**Files to create**:
```
app/components/shared/
├── DataTable.vue
├── MobileList.vue
├── StatsCard.vue
├── DeleteModal.vue
├── EmptyState.vue
├── LoadingState.vue
└── ToastContainer.vue
```

**Implementation**:

```vue
<!-- app/components/shared/DeleteModal.vue -->
<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'

const props = defineProps<{
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <Dialog :open="open" @close="emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="mx-auto max-w-sm rounded-lg bg-white dark:bg-gray-800 p-6">
        <DialogTitle class="text-lg font-medium text-gray-900 dark:text-white">
          {{ title || 'Confirm Delete' }}
        </DialogTitle>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ message || 'Are you sure? This action cannot be undone.' }}
        </p>
        <div class="mt-4 flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            :disabled="loading"
            @click="emit('confirm')"
          >
            {{ loading ? 'Deleting...' : (confirmText || 'Delete') }}
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
```

```vue
<!-- app/components/shared/EmptyState.vue -->
<script setup lang="ts">
defineProps<{
  title?: string
  message?: string
  icon?: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="text-4xl mb-4">{{ icon || '📭' }}</div>
    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
      {{ title || 'No data yet' }}
    </h3>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ message || 'Get started by creating your first entry.' }}
    </p>
    <button
      v-if="actionLabel"
      class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
```

```vue
<!-- app/components/shared/LoadingState.vue -->
<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
      {{ message || 'Loading...' }}
    </p>
  </div>
</template>
```

```vue
<!-- app/components/shared/ToastContainer.vue -->
<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px]"
        :class="{
          'bg-green-600 text-white': toast.type === 'success',
          'bg-red-600 text-white': toast.type === 'error',
          'bg-blue-600 text-white': toast.type === 'info',
          'bg-yellow-500 text-black': toast.type === 'warning',
        }"
      >
        <span class="flex-1">{{ toast.message }}</span>
        <button @click="dismiss(toast.id)" class="opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
```

---

### 3.2 Loading & Error States

**Problem**: No loading indicators or error states in UI

**Files to modify**:
- `app/components/sessions/SessionsList.vue`
- `app/components/tournaments/TournamentsList.vue`
- `app/components/horses/HorsesList.vue`

**Implementation Pattern**:

```vue
<!-- Pattern for all list components -->
<template>
  <div>
    <LoadingState v-if="store.loading" />

    <div v-else-if="store.error" class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <p class="text-red-600 dark:text-red-400">{{ store.error }}</p>
      <button @click="store.reload()" class="mt-2 text-sm underline">
        Try again
      </button>
    </div>

    <EmptyState
      v-else-if="store.sortedItems.length === 0"
      :title="emptyTitle"
      :message="emptyMessage"
      :action-label="actionLabel"
      @action="$emit('create')"
    />

    <template v-else>
      <!-- Desktop table -->
      <SessionsTable v-if="isDesktop" :sessions="store.sortedItems" />
      <!-- Mobile list -->
      <SessionsMobileList v-else :sessions="store.sortedItems" />
    </template>
  </div>
</template>
```

---

## Phase 4: Testing & Quality

### 4.1 Component Test Suite

**Problem**: Zero component tests

**Files to create**:
- `app/components/shared/__tests__/DeleteModal.spec.ts`
- `app/components/shared/__tests__/EmptyState.spec.ts`
- `app/components/sessions/__tests__/SessionsStats.spec.ts`

**Implementation**:

```typescript
// app/components/shared/__tests__/DeleteModal.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import DeleteModal from '../DeleteModal.vue'

describe('DeleteModal', () => {
  it('renders with default props', () => {
    const wrapper = mount(DeleteModal, {
      props: { open: true }
    })
    expect(wrapper.text()).toContain('Confirm Delete')
    expect(wrapper.text()).toContain('Are you sure?')
  })

  it('renders custom title and message', () => {
    const wrapper = mount(DeleteModal, {
      props: {
        open: true,
        title: 'Delete Session',
        message: 'This will remove the session permanently.'
      }
    })
    expect(wrapper.text()).toContain('Delete Session')
    expect(wrapper.text()).toContain('permanently')
  })

  it('emits close when cancel clicked', async () => {
    const wrapper = mount(DeleteModal, {
      props: { open: true }
    })
    await wrapper.find('button:first-of-type').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits confirm when delete clicked', async () => {
    const wrapper = mount(DeleteModal, {
      props: { open: true }
    })
    await wrapper.find('button:last-of-type').trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('disables button when loading', () => {
    const wrapper = mount(DeleteModal, {
      props: { open: true, loading: true }
    })
    const button = wrapper.find('button:last-of-type')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toBe('Deleting...')
  })
})
```

```typescript
// app/stores/__tests__/createEntityStore.spec.ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEntityStore } from '../createEntityStore'

describe('createEntityStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('initializes with empty state', async () => {
    const useTestStore = createEntityStore({
      name: 'test',
      getAdapter: () => mockAdapter,
      defaultFilters: {},
      calculateStats: () => ({}),
      applyFilters: items => items,
      sortItems: items => items,
    })

    const store = useTestStore()
    expect(store.items).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.initialized).toBe(false)
  })

  it('loads items on initialize', async () => {
    const mockItems = [{ id: '1', name: 'Test' }]
    const mockAdapter = {
      getAll: vi.fn().mockResolvedValue(mockItems),
    }

    const useTestStore = createEntityStore({
      name: 'test',
      getAdapter: () => mockAdapter,
      // ... rest of options
    })

    const store = useTestStore()
    await store.initialize()

    expect(store.items).toEqual(mockItems)
    expect(store.initialized).toBe(true)
  })

  it('returns Result on add success', async () => {
    const newItem = { name: 'New' }
    const createdItem = { id: '1', name: 'New', createdAt: '...', updatedAt: '...' }
    const mockAdapter = {
      getAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(createdItem),
    }

    const useTestStore = createEntityStore({
      name: 'test',
      getAdapter: () => mockAdapter,
      // ...
    })

    const store = useTestStore()
    const result = await store.add(newItem)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(createdItem)
    }
  })

  it('returns Result on add failure', async () => {
    const mockAdapter = {
      getAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockRejectedValue(new Error('Network error')),
    }

    const useTestStore = createEntityStore({
      name: 'test',
      getAdapter: () => mockAdapter,
      // ...
    })

    const store = useTestStore()
    const result = await store.add({ name: 'Test' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Network error')
    }
  })
})
```

---

### 4.2 Integration Tests

**Files to create**:
- `app/__tests__/integration/sessions.spec.ts`
- `app/__tests__/integration/tournaments.spec.ts`

**Implementation**:

```typescript
// app/__tests__/integration/sessions.spec.ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'

const STORAGE_KEY = 'poker-wallet-sessions'

describe('Sessions Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('persists new session to localStorage', async () => {
    const store = useSessionsStore()
    await store.initialize()

    const session = {
      date: '2024-01-15',
      type: 'live' as const,
      game: 'NLH' as const,
      currency: 'USD' as const,
      stake: '1/2',
      smallBlind: 1,
      bigBlind: 2,
      result: 150,
      duration: 180,
      tags: [],
      status: 'completed' as const,
    }

    const result = await store.add(session)
    expect(result.success).toBe(true)

    // Verify localStorage
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toHaveLength(1)
    expect(stored[0].result).toBe(150)
  })

  it('updates session and persists change', async () => {
    // Seed data
    const existing = {
      id: 'test-1',
      date: '2024-01-15',
      result: 100,
      // ... other fields
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([existing]))

    const store = useSessionsStore()
    await store.initialize()

    const result = await store.update('test-1', { result: 200 })
    expect(result.success).toBe(true)

    // Verify state
    expect(store.getById('test-1')?.result).toBe(200)

    // Verify localStorage
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored[0].result).toBe(200)
  })

  it('calculates stats correctly', async () => {
    const sessions = [
      { id: '1', result: 100, duration: 60 },
      { id: '2', result: -50, duration: 120 },
      { id: '3', result: 200, duration: 180 },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))

    const store = useSessionsStore()
    await store.initialize()

    expect(store.stats.totalProfit).toBe(250)
    expect(store.stats.totalSessions).toBe(3)
    expect(store.stats.winningSessions).toBe(2)
    expect(store.stats.losingSessions).toBe(1)
  })
})
```

---

## Phase 5: Performance

### 5.1 Optimistic Updates

**Problem**: UI waits for server response

**Implementation** (built into createEntityStore):

```typescript
// Enhanced add method with optimistic update
async function add(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<T>> {
  // Create optimistic item
  const tempId = `temp-${Date.now()}`
  const now = new Date().toISOString()
  const optimistic = {
    ...item,
    id: tempId,
    createdAt: now,
    updatedAt: now,
  } as T

  // Add immediately for instant UI feedback
  items.value.push(optimistic)

  try {
    const adapter = options.getAdapter()
    const created = await adapter.create(item)

    // Replace temp with real item
    const index = items.value.findIndex(i => i.id === tempId)
    if (index !== -1) {
      items.value[index] = created
    }

    return { success: true, data: created }
  } catch (e) {
    // Rollback on failure
    items.value = items.value.filter(i => i.id !== tempId)

    const message = e instanceof Error ? e.message : 'Failed to create item'
    return { success: false, error: new Error(message) }
  }
}
```

---

### 5.2 Memory-Efficient Filtering

**Problem**: In-memory filtering with `.includes()` is O(n*m)

**Implementation**:

```typescript
// app/utils/filterIndex.ts
export class FilterIndex<T extends { id: string }> {
  private indexes = new Map<string, Map<string, Set<string>>>()

  constructor(private items: T[]) {}

  buildIndex(field: keyof T): void {
    const index = new Map<string, Set<string>>()

    for (const item of this.items) {
      const value = String(item[field])
      if (!index.has(value)) {
        index.set(value, new Set())
      }
      index.get(value)!.add(item.id)
    }

    this.indexes.set(String(field), index)
  }

  getMatching(field: keyof T, values: string[]): Set<string> {
    const index = this.indexes.get(String(field))
    if (!index) {
      // Fallback to linear search
      return new Set(
        this.items
          .filter(item => values.includes(String(item[field])))
          .map(item => item.id)
      )
    }

    const matches = new Set<string>()
    for (const value of values) {
      const ids = index.get(value)
      if (ids) {
        ids.forEach(id => matches.add(id))
      }
    }
    return matches
  }

  rebuild(items: T[]): void {
    this.items = items
    // Rebuild all existing indexes
    for (const field of this.indexes.keys()) {
      this.buildIndex(field as keyof T)
    }
  }
}

// Usage in store
const filterIndex = new FilterIndex(sessions.value)
filterIndex.buildIndex('stake')
filterIndex.buildIndex('game')
filterIndex.buildIndex('type')

watch(sessions, (newSessions) => {
  filterIndex.rebuild(newSessions)
})
```

---

## Implementation Roadmap

### Sprint 1: Foundation (P0)
| Task | Complexity | Files |
|------|------------|-------|
| Create StorageAdapter interface | Low | `app/adapters/types.ts` |
| Implement LocalStorageAdapter | Medium | `app/adapters/LocalStorageAdapter.ts` |
| Implement SupabaseAdapter | Medium | `app/adapters/SupabaseAdapter.ts` |
| Create Result type | Low | `app/types/result.ts` |
| Create toast composable | Low | `app/composables/useToast.ts` |
| Create ToastContainer component | Low | `app/components/shared/ToastContainer.vue` |

### Sprint 2: Store Refactor (P0)
| Task | Complexity | Files |
|------|------------|-------|
| Create base store factory | High | `app/stores/createEntityStore.ts` |
| Create case mapping utils | Low | `app/utils/caseMapping.ts` |
| Migrate sessions store | Medium | `app/stores/sessions.ts` |
| Migrate tournaments store | Medium | `app/stores/tournaments.ts` |
| Migrate horses store | Medium | `app/stores/horses.ts` |

### Sprint 3: UI Polish (P1)
| Task | Complexity | Files |
|------|------------|-------|
| Create DeleteModal shared | Low | `app/components/shared/DeleteModal.vue` |
| Create EmptyState shared | Low | `app/components/shared/EmptyState.vue` |
| Create LoadingState shared | Low | `app/components/shared/LoadingState.vue` |
| Add loading/error states to SessionsList | Low | `app/components/sessions/SessionsList.vue` |
| Add loading/error states to TournamentsList | Low | `app/components/tournaments/TournamentsList.vue` |
| Add loading/error states to HorsesList | Low | `app/components/horses/HorsesList.vue` |

### Sprint 4: Testing (P1)
| Task | Complexity | Files |
|------|------------|-------|
| Add DeleteModal tests | Low | `app/components/shared/__tests__/DeleteModal.spec.ts` |
| Add createEntityStore tests | Medium | `app/stores/__tests__/createEntityStore.spec.ts` |
| Add sessions integration tests | Medium | `app/__tests__/integration/sessions.spec.ts` |
| Add adapter unit tests | Medium | `app/adapters/__tests__/*.spec.ts` |

### Sprint 5: Performance (P2)
| Task | Complexity | Files |
|------|------------|-------|
| Add pagination to SupabaseAdapter | Medium | `app/adapters/SupabaseAdapter.ts` |
| Create infinite scroll composable | Medium | `app/composables/useInfiniteScroll.ts` |
| Add optimistic updates | Medium | `app/stores/createEntityStore.ts` |
| Create filter index utility | High | `app/utils/filterIndex.ts` |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Store boilerplate | ~1,800 lines | ~600 lines |
| Test coverage | ~30% | 80% |
| Error handling | Silent | User-visible |
| Type safety | Partial | Full |

---

## Files Summary

**New Files (17)**:
```
app/adapters/types.ts
app/adapters/LocalStorageAdapter.ts
app/adapters/SupabaseAdapter.ts
app/adapters/index.ts
app/stores/createEntityStore.ts
app/types/result.ts
app/utils/caseMapping.ts
app/composables/useToast.ts
app/composables/useInfiniteScroll.ts
app/components/shared/DeleteModal.vue
app/components/shared/EmptyState.vue
app/components/shared/LoadingState.vue
app/components/shared/ToastContainer.vue
app/utils/filterIndex.ts
app/components/shared/__tests__/DeleteModal.spec.ts
app/stores/__tests__/createEntityStore.spec.ts
app/__tests__/integration/sessions.spec.ts
```

**Modified Files (9)**:
```
app/stores/sessions.ts (major refactor)
app/stores/tournaments.ts (major refactor)
app/stores/horses.ts (major refactor)
app/composables/useDatabase.ts (use case mapping)
app/types/index.ts (export result type)
app/components/sessions/SessionsList.vue (use shared components)
app/components/tournaments/TournamentsList.vue (use shared components)
app/components/horses/HorsesList.vue (use shared components)
app/layouts/default.vue (add ToastContainer)
```

---

## Next Steps

1. Review this plan and confirm priorities
2. Start with Sprint 1 (Foundation) - creates the base for everything else
3. Each sprint can be a separate PR for easier review

Ready to start implementing when you give the go-ahead.
