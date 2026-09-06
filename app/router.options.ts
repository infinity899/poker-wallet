import type { RouterConfig } from '@nuxt/schema';
import type { RouteLocationNormalized } from 'vue-router';
import type { ScrollPosition } from '~/utils/scrollMemory';
import { START_LOCATION } from 'vue-router';
import { isChildPath, takeScroll } from '~/utils/scrollMemory';

/**
 * Mirrors Nuxt's default scroll behaviour, with one addition: coming back up
 * from a child route (edit / complete / new) to its parent list restores the
 * offset recorded by `plugins/scroll-memory.client.ts` instead of jumping to
 * the top. Browser back/forward keeps using the router's own saved position.
 */
export default {
  scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp();

    if (to.path.replace(/\/$/, '') === from.path.replace(/\/$/, '')) {
      if (from.hash && !to.hash) {
        return { left: 0, top: 0 };
      }
      if (to.hash) {
        return { el: to.hash, top: hashScrollMarginTop(to.hash), behavior: 'auto' };
      }
      return false;
    }

    const scrollToTop = typeof to.meta.scrollToTop === 'function'
      ? to.meta.scrollToTop(to, from)
      : to.meta.scrollToTop;
    if (scrollToTop === false) {
      return false;
    }

    const position = calculatePosition(to, from, savedPosition);
    if (from === START_LOCATION) {
      return position;
    }

    // Wait for the incoming page to render so the list is tall enough to
    // scroll to the remembered offset.
    const hookToWait = nuxtApp._runningTransition ? 'page:transition:finish' : 'page:loading:end';
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce(hookToWait, () => {
        requestAnimationFrame(() => resolve(position));
      });
    });
  },
} satisfies RouterConfig;

function calculatePosition(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  savedPosition: ScrollPosition | null,
): { left: number; top: number } | { el: string; top: number; behavior: ScrollBehavior } {
  if (savedPosition) {
    return savedPosition;
  }
  if (isChildPath(from.path, to.path)) {
    const remembered = takeScroll(to.path);
    if (remembered) {
      return remembered;
    }
  }
  if (to.hash) {
    return { el: to.hash, top: hashScrollMarginTop(to.hash), behavior: 'auto' };
  }
  return { left: 0, top: 0 };
}

function hashScrollMarginTop(selector: string): number {
  try {
    const elem = document.querySelector(selector);
    if (elem) {
      return (Number.parseFloat(getComputedStyle(elem).scrollMarginTop) || 0)
        + (Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
    }
  }
  catch {}
  return 0;
}
