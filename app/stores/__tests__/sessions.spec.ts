import type { CashSession } from '~/types';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionsStore } from '../sessions';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

// Mock fetch
vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({
    ok: false,
    json: () => Promise.resolve([]),
  } as Response),
));

// Mock crypto.randomUUID
const mockRandomUUID = vi.fn(() => 'test-uuid-123');
vi.stubGlobal('crypto', {
  randomUUID: mockRandomUUID,
});

describe('useSessionsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes with empty sessions', async () => {
      const store = useSessionsStore();
      await store.initialize();

      expect(store.sessions).toHaveLength(0);
      expect(store.initialized).toBe(true);
    });

    it('loads from localStorage if available', async () => {
      const mockSessions: CashSession[] = [
        {
          id: '1',
          date: '2024-01-15',
          type: 'live',
          game: 'NLH',
          currency: 'USD',
          stake: '1/2',
          smallBlind: 1,
          bigBlind: 2,
          result: 100,
          duration: 120,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockSessions));

      const store = useSessionsStore();
      await store.initialize();

      expect(store.sessions).toHaveLength(1);
      expect(store.sessions[0]?.result).toBe(100);
    });

    it('only initializes once', async () => {
      const store = useSessionsStore();
      await store.initialize();
      await store.initialize();

      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('crud operations', () => {
    it('adds a session', async () => {
      const store = useSessionsStore();
      await store.initialize();

      const newSession = await store.addSession({
        date: '2024-01-15',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 200,
        duration: 180,
        tags: ['good session'],
      });

      expect(store.sessions).toHaveLength(1);
      expect(newSession.id).toBe('test-uuid-123');
      expect(newSession.result).toBe(200);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('updates a session', async () => {
      const store = useSessionsStore();
      await store.initialize();

      await store.addSession({
        date: '2024-01-15',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 100,
        duration: 120,
        tags: [],
      });

      const updated = await store.updateSession('test-uuid-123', { result: 300 });

      expect(updated).toBe(true);
      expect(store.sessions[0]?.result).toBe(300);
    });

    it('returns false when updating non-existent session', async () => {
      const store = useSessionsStore();
      await store.initialize();

      const updated = await store.updateSession('non-existent', { result: 300 });

      expect(updated).toBe(false);
    });

    it('deletes a session', async () => {
      const store = useSessionsStore();
      await store.initialize();

      await store.addSession({
        date: '2024-01-15',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 100,
        duration: 120,
        tags: [],
      });

      const deleted = await store.deleteSession('test-uuid-123');

      expect(deleted).toBe(true);
      expect(store.sessions).toHaveLength(0);
    });

    it('deletes multiple sessions', async () => {
      const store = useSessionsStore();
      await store.initialize();

      // Add multiple sessions with different UUIDs
      mockRandomUUID
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2')
        .mockReturnValueOnce('uuid-3');

      await store.addSession({
        date: '2024-01-15',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 100,
        duration: 120,
        tags: [],
      });
      await store.addSession({
        date: '2024-01-16',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 200,
        duration: 120,
        tags: [],
      });
      await store.addSession({
        date: '2024-01-17',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 300,
        duration: 120,
        tags: [],
      });

      const deletedCount = await store.deleteSessions(['uuid-1', 'uuid-3']);

      expect(deletedCount).toBe(2);
      expect(store.sessions).toHaveLength(1);
      expect(store.sessions[0]?.id).toBe('uuid-2');
    });

    it('gets session by ID', async () => {
      const store = useSessionsStore();
      await store.initialize();

      await store.addSession({
        date: '2024-01-15',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 150,
        duration: 120,
        tags: [],
      });

      const session = store.getSessionById('test-uuid-123');
      expect(session?.result).toBe(150);

      const notFound = store.getSessionById('non-existent');
      expect(notFound).toBeUndefined();
    });
  });

  describe('filtering', () => {
    it('filters sessions by type', async () => {
      const store = useSessionsStore();
      await store.initialize();

      mockRandomUUID
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2');

      await store.addSession({
        date: '2024-01-15',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 100,
        duration: 120,
        tags: [],
      });
      await store.addSession({
        date: '2024-01-16',
        type: 'online',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 200,
        duration: 120,
        tags: [],
      });

      store.setFilters({ type: 'live' });
      expect(store.filteredSessions).toHaveLength(1);
      expect(store.filteredSessions[0]?.type).toBe('live');
    });

    it('resets filters', async () => {
      const store = useSessionsStore();
      await store.initialize();

      store.setFilters({ type: 'live' });
      store.resetFilters();

      expect(store.filters.type).toBe('all');
    });
  });

  describe('computed stats', () => {
    it('calculates stats for filtered sessions', async () => {
      const store = useSessionsStore();
      await store.initialize();

      mockRandomUUID
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2');

      await store.addSession({
        date: '2024-01-15',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 100,
        duration: 60,
        tags: [],
      });
      await store.addSession({
        date: '2024-01-16',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: -50,
        duration: 60,
        tags: [],
      });

      expect(store.stats.totalSessions).toBe(2);
      expect(store.stats.totalProfit).toBe(50);
      expect(store.stats.winRate).toBe(50);
    });
  });

  describe('import/export', () => {
    it('imports sessions replacing existing', async () => {
      const store = useSessionsStore();
      await store.initialize();

      await store.addSession({
        date: '2024-01-15',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 100,
        duration: 120,
        tags: [],
      });

      const importedSessions: CashSession[] = [
        {
          id: 'imported-1',
          date: '2024-02-01',
          type: 'online',
          game: 'PLO',
          currency: 'EUR',
          stake: '2/4',
          smallBlind: 2,
          bigBlind: 4,
          result: 500,
          duration: 240,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await store.importSessions(importedSessions, true);

      expect(store.sessions).toHaveLength(1);
      expect(store.sessions[0]?.id).toBe('imported-1');
    });

    it('imports sessions merging with existing', async () => {
      const store = useSessionsStore();
      await store.initialize();

      await store.addSession({
        date: '2024-01-15',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 100,
        duration: 120,
        tags: [],
      });

      const importedSessions: CashSession[] = [
        {
          id: 'imported-1',
          date: '2024-02-01',
          type: 'online',
          game: 'PLO',
          currency: 'EUR',
          stake: '2/4',
          smallBlind: 2,
          bigBlind: 4,
          result: 500,
          duration: 240,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await store.importSessions(importedSessions, false);

      expect(store.sessions).toHaveLength(2);
    });

    it('clears all sessions', async () => {
      const store = useSessionsStore();
      await store.initialize();

      await store.addSession({
        date: '2024-01-15',
        type: 'live',
        game: 'NLH',
        currency: 'USD',
        stake: '1/2',
        smallBlind: 1,
        bigBlind: 2,
        result: 100,
        duration: 120,
        tags: [],
      });

      await store.clearAll();

      expect(store.sessions).toHaveLength(0);
    });
  });
});
