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
        <rect x="10.5" y="0.4" width="3" height="4.4" rx="1.5" />
        <rect x="10.5" y="19.2" width="3" height="4.4" rx="1.5" />
        <rect x="0.4" y="10.5" width="4.4" height="3" rx="1.5" />
        <rect x="19.2" y="10.5" width="4.4" height="3" rx="1.5" />
      </g>
      <circle
        cx="12"
        cy="12"
        r="6.5"
        fill="none"
        stroke="black"
        stroke-width="1.8"
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
