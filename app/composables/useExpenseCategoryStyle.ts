import type { ExpenseCategory } from '~/types';

/**
 * Fixed categorical palette. Keyed BY CATEGORY, not by slice index, so "Food"
 * stays amber whether it is the biggest slice or the smallest — category
 * identity is stable, which is why this map stays static while the chart series
 * palette in `useThemeTokens` is derived from the accent hue.
 *
 * Every entry is oklch(0.66 0.145 H), gamut-clipped to sRGB: one lightness and
 * one chroma across the set, so no category visually outranks another and the
 * palette holds up under CVD simulation. "Other" drops to near-zero chroma
 * because it is a residual, not a category.
 *
 * These are hex values bound with :style, never Tailwind classes — a dynamic
 * category->class map would be purged out of the stylesheet.
 */
export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  travel: '#4296e7', // blue — oklch(0.66 0.145 250)
  accommodation: '#31ab6a', // emerald — oklch(0.66 0.145 155)
  food: '#c38401', // amber — oklch(0.66 0.145 75)
  transport: '#997ee1', // violet — oklch(0.66 0.145 295)
  fees: '#d2699f', // pink — oklch(0.66 0.145 350)
  entertainment: '#01a4b9', // cyan — oklch(0.66 0.145 210)
  other: '#83868e', // neutral — oklch(0.62 0.012 265)
};

/** Fixed order for the category select. Breakdowns render sorted by amount instead. */
export const EXPENSE_CATEGORY_ORDER: ExpenseCategory[] = [
  'travel',
  'accommodation',
  'food',
  'transport',
  'fees',
  'entertainment',
  'other',
];
