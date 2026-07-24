<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :role="label ? 'img' : undefined"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <title v-if="label">{{ label }}</title>

    <!--
      Poker chip, cut as a single mask rather than assembled from strokes.

      Everything the mask paints white is kept, black is removed:
        · the r=10 body disc
        · four edge notches on the compass points
        · a thin inset ring line

      Drawing it as one masked rect of `currentColor` keeps the mark SOLID, which
      is what survives 20px — an earlier stroke-built version was a thin broken
      ring around a floating dot and read as a camera aperture once scaled down.

      Proportions are shared with public/favicon.svg (bold bands, generous ring
      gap) so the tab icon and the in-app mark are the same logo. Change one,
      change both, then re-run scripts/generate-favicons.mjs.
    -->
    <mask
      :id="maskId"
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="24"
      height="24"
    >
      <rect
        width="24"
        height="24"
        fill="black"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="white"
      />
      <g fill="black">
        <rect x="10.15" y="-0.5" width="3.7" height="6" rx="1.85" />
        <rect x="10.15" y="18.5" width="3.7" height="6" rx="1.85" />
        <rect x="-0.5" y="10.15" width="6" height="3.7" rx="1.85" />
        <rect x="18.5" y="10.15" width="6" height="3.7" rx="1.85" />
      </g>
      <circle
        cx="12"
        cy="12"
        r="6.6"
        fill="none"
        stroke="black"
        stroke-width="2.45"
      />
    </mask>

    <rect
      width="24"
      height="24"
      fill="currentColor"
      :mask="`url(#${maskId})`"
    />
  </svg>
</template>

<script setup lang="ts">
/**
 * App mark — a poker chip. Draws in `currentColor` only, so it inherits
 * whatever surface it sits on instead of pinning a hex outside the token layer.
 *
 * Decorative by default: next to the "Poker Wallet" wordmark in the sidebar it
 * would only be a duplicate announcement. Pass `label` where the mark carries
 * the app identity alone (the mobile header, whose heading is the *page* title)
 * and it becomes role="img" with an accessible name.
 */
withDefaults(defineProps<{
  size?: number | string;
  label?: string;
}>(), {
  size: 20,
  label: '',
});

/* Per-instance id: the sidebar and mobile header can both be mounted, and two
   masks sharing an id would collide. */
const maskId = `chip-${useId()}`;
</script>
