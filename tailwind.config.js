/** @type {import('tailwindcss').Config} */

/*
 * LUMINANCE THEME — token bindings
 * See .claude/skills/design/SKILL.md Part 2 for the full spec.
 *
 * Every color below resolves to a CSS custom property declared in
 * app/assets/css/tailwind.css. Two binding styles are used, deliberately:
 *
 *   1. CHANNEL tokens — `oklch(var(--x) / <alpha-value>)`
 *      The variable stores raw OKLCH channels ("0.21 0.014 265"), NOT a color.
 *      This is what keeps Tailwind opacity modifiers working: `bg-surface/50`
 *      compiles to `oklch(0.21 0.014 265 / 0.5)`. A bare `var()` color would
 *      silently drop the modifier — the repo has ~55 of them, so this matters.
 *
 *   2. BAKED-ALPHA tokens — bare `var(--edge)`
 *      Edges are translucent by design so they adapt over any surface, which
 *      means alpha is already spent and cannot also be driven by <alpha-value>.
 *      => Never use an opacity modifier on a border-* token (border-border/50
 *         will not work). Use border-border-subtle / -strong instead.
 *
 * The `-dark` suffixed keys are ALIASES onto the same flipping variables as
 * their light counterparts. The token layer already swaps values under
 * `:root.dark`, so `bg-surface dark:bg-surface-dark-secondary` resolves
 * correctly in both modes with no component edits required.
 */

/** Channel token → color function with opacity-modifier support. */
const ch = name => `oklch(var(${name}) / <alpha-value>)`;

/** Full 50–950 scale from a token prefix, e.g. ramp('--a') → { 50: …--a-50 }. */
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
function ramp(prefix) {
  return Object.fromEntries(SHADES.map(shade => [shade, ch(`${prefix}-${shade}`)]));
}

export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        /* ---- Surfaces. Elevation = lightness. canvas → surface → raised → overlay ---- */
        surface: {
          'DEFAULT': ch('--s-surface'),
          'secondary': ch('--s-canvas'),
          'tertiary': ch('--s-raised'),
          'inset': ch('--s-inset'),
          'overlay': ch('--s-overlay'),
          // dark-mode aliases → same flipping vars
          'dark': ch('--s-canvas'),
          'dark-secondary': ch('--s-surface'),
          'dark-tertiary': ch('--s-raised'),
          'dark-quaternary': ch('--s-overlay'),
        },

        /* ---- Edges. Translucent, baked alpha — no opacity modifiers. ---- */
        border: {
          'DEFAULT': 'var(--edge)',
          'strong': 'var(--edge-strong)',
          'subtle': 'var(--edge-subtle)',
          'dark': 'var(--edge)',
          'dark-strong': 'var(--edge-strong)',
          'dark-subtle': 'var(--edge-subtle)',
        },

        /* ---- Foreground: four levels, always all four ---- */
        foreground: {
          'DEFAULT': ch('--fg'),
          'secondary': ch('--fg-secondary'),
          'muted': ch('--fg-muted'),
          'faint': ch('--fg-faint'),
          'dark': ch('--fg'),
          'dark-secondary': ch('--fg-secondary'),
          'dark-muted': ch('--fg-muted'),
          'dark-faint': ch('--fg-faint'),
        },

        /*
         * Neutral ramp. Static (does not flip) because it is used in explicit
         * light/dark pairs — `text-gray-900 dark:text-gray-100`. Retinted onto
         * the Luminance neutral hue and tuned so gray-900/800/700 land on the
         * surface/raised/overlay elevation steps, which makes the ~370 raw
         * gray-* usages correct by construction rather than merely tolerable.
         */
        gray: ramp('--n'),
        // slate is used interchangeably with gray in a few components
        slate: ramp('--n'),

        /*
         * Accent — violet. Deliberately NOT green: `success` owns green so a
         * profit figure never reads as a call-to-action. One hue knob
         * (--accent-h) drives the whole ramp.
         */
        accent: ramp('--a'),

        /* ---- Semantic ---- */
        success: ramp('--su'), // profit
        danger: ramp('--da'), // loss
        warning: ramp('--wa'), // caution
        info: ramp('--in'), // informational

        /*
         * ALIASES for color families the components already reference but that
         * this config never defined, or that bypass the token layer.
         *
         * `primary-*` is the important one: 40 usages across the app, and it was
         * never a key here, so every one compiled to nothing. A
         * `border-2 border-primary-500` fell back to currentColor — which is why
         * the selected data-storage card drew a harsh white ring in dark mode.
         *
         * The rest are Tailwind defaults that DO render, but in stock sRGB, so
         * they clash with the retinted Luminance neutrals. Pointing them at the
         * nearest semantic ramp brings ~140 off-system usages onto the tokens
         * without editing a single component.
         */
        primary: ramp('--a'), // selection / primary action === accent
        purple: ramp('--a'),
        violet: ramp('--a'),
        blue: ramp('--in'),
        sky: ramp('--in'),
        amber: ramp('--wa'),
        yellow: ramp('--wa'),
        red: ramp('--da'),
        rose: ramp('--da'),
        green: ramp('--su'),
        emerald: ramp('--su'),
        teal: ramp('--su'),
      },

      screens: {
        xs: '475px',
      },

      fontFamily: {
        sans: ['Inter', 'Inter Fallback', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px
        'xs': ['0.75rem', { lineHeight: '1rem' }], // 12px
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }], // 13px
        'base': ['0.875rem', { lineHeight: '1.5rem' }], // 14px
        'lg': ['1rem', { lineHeight: '1.5rem' }], // 16px
        'xl': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
        '3xl': ['2rem', { lineHeight: '2.5rem' }], // 32px
      },

      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
      },

      /* Soft radius system (6/8/10/12/16) — nested-radius aware. */
      borderRadius: {
        'sm': 'var(--r-sm)', // 6px
        'DEFAULT': 'var(--r-md)', // 8px
        'md': 'var(--r-md-plus)', // 10px
        'lg': 'var(--r-lg)', // 12px
        'xl': 'var(--r-xl)', // 16px
        '2xl': 'var(--r-2xl)', // 20px
      },

      /*
       * Ambient depth. Each lift carries the `inset 0 1px 0` top highlight that
       * is the Luminance signature in dark mode; in light mode that inset
       * resolves to transparent and a soft shadow does the work instead.
       * dark-* keys alias the same vars — the vars already flip.
       */
      boxShadow: {
        'xs': 'var(--lift-1)',
        'sm': 'var(--lift-1)',
        'DEFAULT': 'var(--lift-2)',
        'md': 'var(--lift-2)',
        'lg': 'var(--lift-3)',
        'xl': 'var(--lift-3)',
        'lift-1': 'var(--lift-1)',
        'lift-2': 'var(--lift-2)',
        'lift-3': 'var(--lift-3)',
        'dark-xs': 'var(--lift-1)',
        'dark-sm': 'var(--lift-1)',
        'dark-DEFAULT': 'var(--lift-2)',
        'none': 'none',
      },

      spacing: {
        4.5: '1.125rem', // 18px
        13: '3.25rem', // 52px
        15: '3.75rem', // 60px
        18: '4.5rem', // 72px
      },

      transitionTimingFunction: {
        'out-expo': 'var(--ease-out)',
        'in-out-smooth': 'var(--ease-in-out)',
        'snap': 'var(--ease-snap)',
      },

      transitionDuration: {
        micro: '120ms',
        base: '200ms',
        slow: '320ms',
      },

      animation: {
        'fade-in': 'fadeIn var(--dur-micro) var(--ease-out)',
        'slide-up': 'slideUp var(--dur-base) var(--ease-out)',
        'slide-down': 'slideDown var(--dur-base) var(--ease-out)',
        'scale-in': 'scaleIn var(--dur-base) var(--ease-out)',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
