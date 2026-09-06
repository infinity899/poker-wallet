import { isChildPath, rememberScroll } from '~/utils/scrollMemory';

/**
 * Snapshot the window scroll offset before leaving a list page for one of its
 * child routes. `beforeEach` runs while the outgoing page is still in the DOM,
 * so the offset is accurate; by the time `scrollBehavior` runs the new page is
 * already rendered. See `app/router.options.ts` for the restore side.
 */
export default defineNuxtPlugin(({ $router }) => {
  $router.beforeEach((to, from) => {
    if (from.matched.length > 0 && isChildPath(to.path, from.path)) {
      rememberScroll(from.path, { left: window.scrollX, top: window.scrollY });
    }
  });
});
