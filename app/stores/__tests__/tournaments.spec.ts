import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { DbTournament } from '~/types';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useTournamentsStore } from '../tournaments';

type ChangeHandler = (payload: RealtimePostgresChangesPayload<DbTournament>) => void;

/**
 * The live-updates channel, reduced to what the store actually uses: it registers one
 * `postgres_changes` handler and subscribes. The test then plays the server's part by
 * calling that handler.
 */
const channel = {
  filter: null as Record<string, unknown> | null,
  handler: null as ChangeHandler | null,
  name: '',
  subscribed: false,
  on(_type: string, filter: Record<string, unknown>, handler: ChangeHandler) {
    channel.filter = filter;
    channel.handler = handler;
    return channel;
  },
  subscribe() {
    channel.subscribed = true;
    return channel;
  },
};

const removeChannel = vi.fn();
const createChannel = vi.fn((name: string) => {
  channel.name = name;
  return channel;
});

// Only the two calls the store makes in Supabase mode: the initial fetch and the channel.
vi.mock('~/composables/useTypedSupabase', () => ({
  useTypedSupabaseClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
    }),
    channel: createChannel,
    removeChannel,
  }),
}));

// A ref, not a plain flag: the store reads the mode through `computed()`, which would cache
// a plain value forever and never notice the switch the last test makes.
const demoMode = ref(false);

// Demo mode falls back to the localStorage adapter, which seeds itself over the network.
vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve([]) } as Response)));

vi.stubGlobal('useSupabaseUser', () => ({ value: { sub: 'user-1' } }));
vi.stubGlobal('useAuthStore', () => ({
  get isDemoMode() {
    return demoMode.value;
  },
  waitForSettings: () => Promise.resolve(),
}));

function dbRow(overrides: Partial<DbTournament> = {}): DbTournament {
  return {
    id: 'row-1',
    user_id: 'user-1',
    date: '2026-08-31',
    type: 'online',
    currency: 'USD',
    name: 'Bounty Builder $22',
    buy_in: 20,
    fee: 2,
    entries: 0,
    winnings: 0,
    venue: null,
    site: 'PokerStars',
    sites: null,
    field_size: 1200,
    finish_position: null,
    cashed: null,
    notes: null,
    tags: [],
    status: 'in_progress',
    is_session: null,
    session_count: null,
    original_currency: 'USD',
    original_buy_in: 20,
    original_fee: 2,
    original_winnings: 0,
    exchange_rate: 1,
    external_id: 'pokerstars:4026875516',
    source: 'desktop',
    created_at: '2026-08-31T18:00:00.000Z',
    updated_at: '2026-08-31T18:00:00.000Z',
    ...overrides,
  };
}

function insert(row: DbTournament): RealtimePostgresChangesPayload<DbTournament> {
  return { eventType: 'INSERT', new: row, old: {} } as RealtimePostgresChangesPayload<DbTournament>;
}

describe('useTournamentsStore live updates', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    demoMode.value = false;
    channel.filter = null;
    channel.handler = null;
    channel.name = '';
    channel.subscribed = false;
    vi.clearAllMocks();
  });

  it('subscribes to this user\'s rows once loaded', async () => {
    const store = useTournamentsStore();
    await store.initialize();

    expect(createChannel).toHaveBeenCalledWith('tournaments:user-1');
    expect(channel.subscribed).toBe(true);
    expect(channel.filter).toEqual({
      event: '*',
      schema: 'public',
      table: 'tournaments',
      filter: 'user_id=eq.user-1',
    });
  });

  it('does not subscribe in demo mode', async () => {
    demoMode.value = true;
    const store = useTournamentsStore();
    await store.initialize();

    expect(createChannel).not.toHaveBeenCalled();
  });

  it('adds a tournament registered elsewhere without a reload', async () => {
    const store = useTournamentsStore();
    await store.initialize();

    channel.handler?.(insert(dbRow()));

    expect(store.tournaments).toHaveLength(1);
    expect(store.tournaments[0]?.name).toBe('Bounty Builder $22');
    expect(store.inProgressTournaments).toHaveLength(1);
  });

  it('ignores the echo of a row it already has', async () => {
    const store = useTournamentsStore();
    await store.initialize();

    channel.handler?.(insert(dbRow()));
    channel.handler?.(insert(dbRow()));

    expect(store.tournaments).toHaveLength(1);
  });

  it('replaces a row in place on update', async () => {
    const store = useTournamentsStore();
    await store.initialize();

    channel.handler?.(insert(dbRow()));
    channel.handler?.({
      eventType: 'UPDATE',
      new: dbRow({ entries: 1, status: 'completed', winnings: 140 }),
      old: { id: 'row-1' },
    } as RealtimePostgresChangesPayload<DbTournament>);

    expect(store.tournaments).toHaveLength(1);
    expect(store.tournaments[0]?.entries).toBe(1);
    expect(store.tournaments[0]?.winnings).toBe(140);
    expect(store.inProgressTournaments).toHaveLength(0);
  });

  it('drops a row deleted elsewhere', async () => {
    const store = useTournamentsStore();
    await store.initialize();

    channel.handler?.(insert(dbRow()));
    channel.handler?.({
      eventType: 'DELETE',
      new: {},
      old: { id: 'row-1' },
    } as RealtimePostgresChangesPayload<DbTournament>);

    expect(store.tournaments).toHaveLength(0);
  });

  it('closes the channel when the mode changes', async () => {
    const store = useTournamentsStore();
    await store.initialize();
    expect(createChannel).toHaveBeenCalledTimes(1);

    demoMode.value = true;
    await store.reload();

    expect(removeChannel).toHaveBeenCalledWith(channel);
    expect(createChannel).toHaveBeenCalledTimes(1);
  });
});
