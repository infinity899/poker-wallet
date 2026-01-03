import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useReferenceStore } from '../reference';

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
    json: () => Promise.resolve({}),
  } as Response),
));

// Mock crypto.randomUUID
const mockRandomUUID = vi.fn(() => 'test-uuid-123');
vi.stubGlobal('crypto', {
  randomUUID: mockRandomUUID,
});

describe('useReferenceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default data when nothing stored', async () => {
      const store = useReferenceStore();
      await store.initialize();

      expect(store.initialized).toBe(true);
      expect(store.venues.length).toBeGreaterThan(0);
      expect(store.tags.length).toBeGreaterThan(0);
    });

    it('loads from localStorage if available', async () => {
      const mockData = {
        venues: [{ id: '1', name: 'Test Venue', type: 'live' }],
        tags: [{ id: '1', name: 'Test Tag', color: '#FF0000' }],
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockData));

      const store = useReferenceStore();
      await store.initialize();

      expect(store.venues).toHaveLength(1);
      expect(store.venues[0]?.name).toBe('Test Venue');
      expect(store.tags).toHaveLength(1);
      expect(store.tags[0]?.name).toBe('Test Tag');
    });

    it('only initializes once', async () => {
      const store = useReferenceStore();
      await store.initialize();
      await store.initialize();

      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('venue CRUD', () => {
    it('adds a venue', async () => {
      const store = useReferenceStore();
      await store.initialize();

      const initialLength = store.venues.length;
      const newVenue = store.addVenue({
        name: 'New Casino',
        type: 'live',
        location: 'Las Vegas',
      });

      expect(store.venues).toHaveLength(initialLength + 1);
      expect(newVenue.id).toBe('test-uuid-123');
      expect(newVenue.name).toBe('New Casino');
    });

    it('updates a venue', async () => {
      const store = useReferenceStore();
      await store.initialize();

      const venue = store.addVenue({
        name: 'Original Name',
        type: 'live',
      });

      const updated = store.updateVenue(venue.id, { name: 'Updated Name' });

      expect(updated).toBe(true);
      const foundVenue = store.getVenueById(venue.id);
      expect(foundVenue?.name).toBe('Updated Name');
    });

    it('returns false when updating non-existent venue', async () => {
      const store = useReferenceStore();
      await store.initialize();

      const updated = store.updateVenue('non-existent', { name: 'New Name' });

      expect(updated).toBe(false);
    });

    it('deletes a venue', async () => {
      const store = useReferenceStore();
      await store.initialize();

      const venue = store.addVenue({
        name: 'To Delete',
        type: 'live',
      });

      const deleted = store.deleteVenue(venue.id);

      expect(deleted).toBe(true);
      expect(store.getVenueById(venue.id)).toBeUndefined();
    });

    it('gets venue by name (case insensitive)', async () => {
      const store = useReferenceStore();
      await store.initialize();

      store.addVenue({
        name: 'Bellagio',
        type: 'live',
      });

      const found = store.getVenueByName('bellagio');
      expect(found?.name).toBe('Bellagio');

      const foundUpper = store.getVenueByName('BELLAGIO');
      expect(foundUpper?.name).toBe('Bellagio');
    });
  });

  describe('tag CRUD', () => {
    it('adds a tag', async () => {
      const store = useReferenceStore();
      await store.initialize();

      const initialLength = store.tags.length;
      const newTag = store.addTag({
        name: 'New Tag',
        color: '#00FF00',
      });

      expect(store.tags).toHaveLength(initialLength + 1);
      expect(newTag.id).toBe('test-uuid-123');
      expect(newTag.name).toBe('New Tag');
    });

    it('updates a tag', async () => {
      const store = useReferenceStore();
      await store.initialize();

      const tag = store.addTag({
        name: 'Original',
        color: '#FF0000',
      });

      const updated = store.updateTag(tag.id, { color: '#00FF00' });

      expect(updated).toBe(true);
      const foundTag = store.getTagById(tag.id);
      expect(foundTag?.color).toBe('#00FF00');
    });

    it('deletes a tag', async () => {
      const store = useReferenceStore();
      await store.initialize();

      const tag = store.addTag({
        name: 'To Delete',
        color: '#FF0000',
      });

      const deleted = store.deleteTag(tag.id);

      expect(deleted).toBe(true);
      expect(store.getTagById(tag.id)).toBeUndefined();
    });

    it('gets tag by name (case insensitive)', async () => {
      const store = useReferenceStore();
      await store.initialize();

      store.addTag({
        name: 'MyCustomTag',
        color: '#FF0000',
      });

      const found = store.getTagByName('mycustomtag');
      expect(found?.name).toBe('MyCustomTag');
    });
  });

  describe('computed getters', () => {
    it('filters live venues', async () => {
      const store = useReferenceStore();
      await store.initialize();

      mockRandomUUID
        .mockReturnValueOnce('live-1')
        .mockReturnValueOnce('online-1');

      store.addVenue({ name: 'Live Casino', type: 'live' });
      store.addVenue({ name: 'PokerStars', type: 'online' });

      expect(store.liveVenues.some(v => v.name === 'Live Casino')).toBe(true);
      expect(store.liveVenues.some(v => v.name === 'PokerStars')).toBe(false);
    });

    it('filters online sites', async () => {
      const store = useReferenceStore();
      await store.initialize();

      mockRandomUUID
        .mockReturnValueOnce('live-1')
        .mockReturnValueOnce('online-1');

      store.addVenue({ name: 'Live Casino', type: 'live' });
      store.addVenue({ name: 'PokerStars', type: 'online' });

      expect(store.onlineSites.some(v => v.name === 'PokerStars')).toBe(true);
      expect(store.onlineSites.some(v => v.name === 'Live Casino')).toBe(false);
    });
  });

  describe('reset to defaults', () => {
    it('resets all data to defaults', async () => {
      const store = useReferenceStore();
      await store.initialize();

      // Add custom data
      store.addVenue({ name: 'Custom Venue', type: 'live' });
      store.addTag({ name: 'Custom Tag', color: '#000000' });

      // Reset
      store.resetToDefaults();

      // Should not contain custom data
      expect(store.getVenueByName('Custom Venue')).toBeUndefined();
      expect(store.getTagByName('Custom Tag')).toBeUndefined();
    });
  });

  describe('constants', () => {
    it('provides currencies', async () => {
      const store = useReferenceStore();

      expect(store.currencies).toContain('USD');
      expect(store.currencies).toContain('EUR');
    });

    it('provides game types', async () => {
      const store = useReferenceStore();

      expect(store.gameTypes).toContain('NLH');
      expect(store.gameTypes).toContain('PLO');
    });
  });
});
