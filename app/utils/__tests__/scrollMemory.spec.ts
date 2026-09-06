import { beforeEach, describe, expect, it } from 'vitest';
import { clearScrollMemory, isChildPath, rememberScroll, takeScroll } from '../scrollMemory';

describe('scrollMemory', () => {
  beforeEach(() => {
    clearScrollMemory();
  });

  describe('isChildPath', () => {
    it('detects edit and new routes under a list', () => {
      expect(isChildPath('/tournaments/abc', '/tournaments')).toBe(true);
      expect(isChildPath('/tournaments/new', '/tournaments')).toBe(true);
      expect(isChildPath('/sessions/1', '/sessions/')).toBe(true);
    });

    it('rejects siblings, the same path, and prefix look-alikes', () => {
      expect(isChildPath('/tournaments', '/tournaments')).toBe(false);
      expect(isChildPath('/sessions/1', '/tournaments')).toBe(false);
      expect(isChildPath('/tournaments-archive', '/tournaments')).toBe(false);
      expect(isChildPath('/tournaments', '/tournaments/abc')).toBe(false);
    });

    it('treats every other route as a child of the root', () => {
      expect(isChildPath('/sessions', '/')).toBe(true);
      expect(isChildPath('/', '/')).toBe(false);
    });
  });

  describe('rememberScroll / takeScroll', () => {
    it('returns the remembered position once, then forgets it', () => {
      rememberScroll('/tournaments', { left: 0, top: 1200 });
      expect(takeScroll('/tournaments')).toEqual({ left: 0, top: 1200 });
      expect(takeScroll('/tournaments')).toBeNull();
    });

    it('ignores trailing slashes', () => {
      rememberScroll('/sessions/', { left: 0, top: 300 });
      expect(takeScroll('/sessions')).toEqual({ left: 0, top: 300 });
    });

    it('keeps lists independent', () => {
      rememberScroll('/sessions', { left: 0, top: 300 });
      rememberScroll('/tournaments', { left: 0, top: 900 });
      expect(takeScroll('/tournaments')).toEqual({ left: 0, top: 900 });
      expect(takeScroll('/sessions')).toEqual({ left: 0, top: 300 });
    });
  });
});
