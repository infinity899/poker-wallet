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
      Poker chip. The notched rim is ONE circle whose dash pattern cuts the four
      gaps — cheaper and crisper at 20px than masked-out shapes, and it stays a
      single path so it never develops seams while scaling.

      r=8.3, so circumference = 2*PI*8.3 = 52.15. Four dashes + four gaps:
      gap 3.62 (25 degrees), dash (52.15 - 4*3.62) / 4 = 9.42. The offset of
      11.23 (= 9.42 + 3.62/2) centres a gap at 3 o'clock, putting the notches on
      the compass points rather than wherever the path happened to start.
    -->
    <circle
      cx="12"
      cy="12"
      r="8.3"
      stroke="currentColor"
      stroke-width="3.4"
      stroke-dasharray="9.42 3.62"
      stroke-dashoffset="11.23"
    />
    <circle
      cx="12"
      cy="12"
      r="3.4"
      fill="currentColor"
    />
  </svg>
</template>

<script setup lang="ts">
/**
 * App mark. Draws in `currentColor` only, so it inherits whatever surface it
 * sits on instead of pinning a hex outside the token layer.
 *
 * Decorative by default: next to the "Poker Wallet" wordmark in the sidebar it
 * would just be a duplicate announcement. Pass `label` where the mark carries
 * the app identity on its own (the mobile header, whose heading is the *page*
 * title), and it becomes role="img" with an accessible name.
 */
withDefaults(defineProps<{
  size?: number | string;
  label?: string;
}>(), {
  size: 20,
  label: '',
});
</script>
