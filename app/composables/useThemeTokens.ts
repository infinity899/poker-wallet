/**
 * Bridges the Luminance CSS token layer into JavaScript for canvas-based
 * consumers (Chart.js), so charts and DOM share one source of truth.
 *
 * Two problems this solves:
 *
 *  1. Chart.js renders to <canvas> and cannot read CSS classes, so chart
 *     colors used to be hardcoded — and were hardcoded to dark-mode slate,
 *     meaning axes and tooltips never adapted to light mode at all.
 *
 *  2. Chart.js parses colors with @kurkle/color, which does not understand
 *     `oklch()`. Every token is therefore resolved to sRGB via a canvas 2D
 *     context, whose `fillStyle` getter always serializes back to `#rrggbb`
 *     or `rgba(...)`. The browser does the color-space math; we just read it.
 *
 * Tokens are re-read whenever the theme flips, keyed off `themeStore.isDark`.
 */

/** Reused across calls — creating a canvas per color would be wasteful. */
let probeCtx: CanvasRenderingContext2D | null | undefined;

function getProbeCtx(): CanvasRenderingContext2D | null {
  if (probeCtx === undefined) {
    if (typeof document === 'undefined') {
      probeCtx = null;
    }
    else {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      probeCtx = canvas.getContext('2d', { willReadFrequently: true });
    }
  }
  return probeCtx;
}

const SENTINEL = '#000000';
const IS_BLACK = /^(?:#000000|#000|black|rgba?\(0,\s*0,\s*0(?:,\s*1)?\))$/i;

/**
 * Resolve any CSS color string (including `oklch()`) to an sRGB string that
 * Chart.js can parse. Returns the fallback if the browser rejects the input.
 *
 * Note we RASTERIZE rather than read `ctx.fillStyle` back: Chrome preserves the
 * authored color space when serializing, so `fillStyle` hands back
 * `oklch(0.65 0.19 264)` verbatim — which Chart.js's parser (@kurkle/color)
 * does not understand. Painting one pixel and reading it forces the browser to
 * do the color-space conversion for us and always yields sRGB bytes.
 */
export function toRenderableColor(css: string, fallback: string): string {
  const ctx = getProbeCtx();
  if (!ctx || !css) {
    return fallback;
  }

  // A rejected assignment leaves fillStyle at its previous value, so seed a
  // sentinel and treat "unchanged" as a parse failure.
  ctx.fillStyle = SENTINEL;
  ctx.fillStyle = css;
  if (ctx.fillStyle === SENTINEL && !IS_BLACK.test(css.trim())) {
    return fallback;
  }

  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data as unknown as [number, number, number, number];

  return a === 255
    ? `rgb(${r}, ${g}, ${b})`
    : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}

/**
 * Re-express a resolved sRGB color at a given alpha.
 *
 * `toRenderableColor` always hands back `#rrggbb` or `rgb(...)`, so parsing is
 * trivial and avoids asking canvas to understand `color-mix()`. Chart.js needs
 * this for area fills under line series.
 */
export function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const n = Number.parseInt(hex[1] as string, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(color);
  if (rgb) {
    const [r, g, b] = (rgb[1] as string).split(',').map(part => Number.parseFloat(part));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

export interface ThemeTokens {
  /** Axis tick labels and chart legend text. */
  tick: string;
  /** Gridlines. */
  grid: string;
  /** Card/plot background — used as the gap color between pie slices. */
  surface: string;
  /** Primary accent (violet). */
  accent: string;
  /** Profit. */
  success: string;
  /** Loss. */
  danger: string;
  warning: string;
  info: string;
  tooltip: {
    backgroundColor: string;
    titleColor: string;
    bodyColor: string;
    borderColor: string;
  };
  /** Categorical series palette, same-lightness, derived from the accent hue. */
  series: string[];
}

/** Values used before the DOM exists, or if a token fails to resolve. */
const FALLBACK: ThemeTokens = {
  tick: '#94a3b8',
  grid: 'rgba(120, 120, 135, 0.15)',
  surface: '#ffffff',
  accent: '#7c5cff',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  tooltip: {
    backgroundColor: '#1e1b2e',
    titleColor: '#f8fafc',
    bodyColor: '#cbd5e1',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  series: ['#7c5cff', '#c14bd0', '#d1477f', '#b8632c', '#6f8b1f', '#1e9160', '#2b87b8'],
};

/**
 * Categorical palette: rotate hue around the wheel from the accent, holding
 * lightness and chroma constant so no series visually outranks another and
 * the set survives CVD simulation and greyscale printing.
 */
function buildSeries(baseHue: number, count: number): string[] {
  const step = 360 / Math.max(count, 1);
  return Array.from({ length: count }, (_, i) =>
    toRenderableColor(
      `oklch(0.68 0.145 ${(baseHue + i * step) % 360})`,
      FALLBACK.series[i % FALLBACK.series.length] as string,
    ));
}

export function useThemeTokens() {
  const themeStore = useThemeStore();

  const tokens = computed<ThemeTokens>(() => {
    // Re-resolve whenever the theme flips.
    void themeStore.isDark;

    if (typeof document === 'undefined') {
      return FALLBACK;
    }

    const style = getComputedStyle(document.documentElement);
    /** Raw custom property value, with nested var() already substituted. */
    const raw = (name: string) => style.getPropertyValue(name).trim();
    /** Channel token (`0.21 0.014 265`) → renderable sRGB. */
    const ch = (name: string, fallback: string, alpha = 1) => {
      const channels = raw(name);
      return channels
        ? toRenderableColor(`oklch(${channels} / ${alpha})`, fallback)
        : fallback;
    };
    /** Already-a-color token (edges carry their own alpha). */
    const col = (name: string, fallback: string) =>
      toRenderableColor(raw(name), fallback);

    const accentHue = Number.parseFloat(raw('--accent-h')) || 264;

    return {
      tick: ch('--fg-muted', FALLBACK.tick),
      grid: col('--edge', FALLBACK.grid),
      surface: ch('--s-surface', FALLBACK.surface),
      accent: ch('--a-500', FALLBACK.accent),
      success: ch('--su-500', FALLBACK.success),
      danger: ch('--da-500', FALLBACK.danger),
      warning: ch('--wa-500', FALLBACK.warning),
      info: ch('--in-500', FALLBACK.info),
      tooltip: {
        // Overlay surface keeps elevation monotonic: a tooltip never lands on
        // a color darker than the card it floats above.
        backgroundColor: ch('--s-overlay', FALLBACK.tooltip.backgroundColor, 0.98),
        titleColor: ch('--fg', FALLBACK.tooltip.titleColor),
        bodyColor: ch('--fg-secondary', FALLBACK.tooltip.bodyColor),
        borderColor: col('--edge-strong', FALLBACK.tooltip.borderColor),
      },
      series: buildSeries(accentHue, 7),
    };
  });

  return { tokens };
}
