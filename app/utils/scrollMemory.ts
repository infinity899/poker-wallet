/**
 * Remembers where a list page was scrolled to when the user descends into one
 * of its child routes (e.g. /tournaments -> /tournaments/abc to edit or
 * complete an entry) so that returning to the parent lands on the same rows.
 *
 * Vue Router only restores scroll on browser back/forward. Our edit pages
 * navigate back with a forward `router.push('/tournaments')`, which would
 * otherwise reset the list to the top like a page refresh.
 */

export interface ScrollPosition {
  left: number;
  top: number;
}

const positions = new Map<string, ScrollPosition>();

function normalize(path: string): string {
  return path.replace(/\/$/, '') || '/';
}

/** True when `child` is nested directly or indirectly under `parent`. */
export function isChildPath(child: string, parent: string): boolean {
  const p = normalize(parent);
  const c = normalize(child);
  if (p === '/') {
    return c !== '/';
  }
  return c.startsWith(`${p}/`);
}

/** Store the position of `path`; only meaningful when heading into a child. */
export function rememberScroll(path: string, position: ScrollPosition): void {
  positions.set(normalize(path), position);
}

/** Take the stored position for `path` (one-shot), or null if none. */
export function takeScroll(path: string): ScrollPosition | null {
  const key = normalize(path);
  const position = positions.get(key) ?? null;
  positions.delete(key);
  return position;
}

/** Test helper. */
export function clearScrollMemory(): void {
  positions.clear();
}
