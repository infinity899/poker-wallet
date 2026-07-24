---
name: design-principles
description: Enforce a precise, minimal design system inspired by Linear, Notion, and Stripe. Use this skill when building dashboards, admin interfaces, or any UI that needs Jony Ive-level precision - clean, modern, minimalist with taste. Includes the Luminance theme - a dark-first, OKLCH-tokenized, ambient-depth direction - plus the modern CSS baseline (OKLCH, color-mix, container queries, :has, @starting-style, view transitions). Every pixel matters.
---

# Design Principles

This skill enforces precise, crafted design for enterprise software, SaaS dashboards, admin interfaces, and web applications. The philosophy is Jony Ive-level precision with intentional personality — every interface is polished, and each is designed for its specific context.

**Two things are non-negotiable before you write code:**

1. **Commit to a design direction** (Part 1). Don't default.
2. **Define tokens before components** (Part 2). Never hardcode a color, radius, or duration in a component.

---

## Part 1 — Design Direction (REQUIRED)

### Think About Context

- **What does this product do?** A finance tool needs different energy than a creative tool.
- **Who uses it?** Power users want density. Occasional users want guidance.
- **What's the emotional job?** Trust? Efficiency? Delight? Focus?
- **What would make this memorable?** Every product has a chance to feel distinctive.

### Choose a Personality

Enterprise/SaaS UI has more range than you think. Consider these directions:

**Precision & Density** — Tight spacing, monochrome, information-forward. For power users who live in the tool. Think Linear, Raycast, terminal aesthetics.

**Warmth & Approachability** — Generous spacing, soft shadows, friendly colors. For products that want to feel human. Think Notion, Coda, collaborative tools.

**Sophistication & Trust** — Cool tones, layered depth, financial gravitas. For products handling money or sensitive data. Think Stripe, Mercury, enterprise B2B.

**Boldness & Clarity** — High contrast, dramatic negative space, confident typography. For products that want to feel modern and decisive. Think Vercel, minimal dashboards.

**Utility & Function** — Muted palette, functional density, clear hierarchy. For products where the work matters more than the chrome. Think GitHub, developer tools.

**Data & Analysis** — Chart-optimized, technical but accessible, numbers as first-class citizens. For analytics, metrics, business intelligence.

**Luminance (Depth & Ambient Light)** — Dark-first. Tinted near-black canvas, elevation built from *light* rather than shadow, one high-chroma accent against fully desaturated surroundings. For products that should feel premium, focused, and current. Full spec in Part 2.

Pick one. Or blend two. But commit to a direction that fits the product.

### Choose a Color Foundation

**Don't default to warm neutrals.** Consider the product:

- **Warm foundations** (creams, warm grays) — approachable, comfortable, human
- **Cool foundations** (slate, blue-gray) — professional, trustworthy, serious
- **Pure neutrals** (true grays, black/white) — minimal, bold, technical
- **Tinted foundations** (slight color cast) — distinctive, memorable, branded

**Light or dark?** Dark modes aren't just light modes inverted. Dark feels technical, focused, premium. Light feels open, approachable, clean. Choose based on context, then design *that* mode first and derive the other — never invert.

**Accent color** — Pick ONE that means something. Blue for trust. Green for growth. Orange for energy. Violet for creativity. Don't just reach for the same accent every time.

### Choose a Layout Approach

The content should drive the layout:

- **Dense grids** for information-heavy interfaces where users scan and compare
- **Generous spacing** for focused tasks where users need to concentrate
- **Sidebar navigation** for multi-section apps with many destinations
- **Top navigation** for simpler tools with fewer sections
- **Split panels** for list-detail patterns where context matters

### Choose Typography

Typography sets tone. Don't always default:

- **System fonts** — fast, native, invisible (good for utility-focused products)
- **Geometric sans** (Geist, Inter) — modern, clean, technical
- **Humanist sans** (SF Pro, Satoshi) — warmer, more approachable
- **Monospace influence** — technical, developer-focused, data-heavy

Prefer **variable fonts** — one file, every weight, and optical sizing that actually responds to size.

---

## Part 2 — The Luminance Theme

A complete, copy-pasteable direction. Use it when the brief calls for "modern," "premium," or "dark," or as a reference for how thoroughly *any* theme should be specified before components get written.

### The Idea

Most dark UIs are a light UI with inverted values and the same drop shadows, which read as smudges on a dark canvas. Luminance inverts the physics instead: **surfaces get closer to the viewer by getting lighter, and catch a 1px highlight on their top edge** — light from above. Shadow is a supporting actor, not the mechanism.

Three rules define the look:

1. **The canvas is never pure black and never neutral.** `oklch(0.17 0.012 265)` — a hair of chroma so the whole UI has a temperature.
2. **Chroma is a budget.** Everything structural sits under `0.02` chroma. The accent spends the entire budget at `0.19`. That contrast is what makes one accent feel intentional instead of decorative.
3. **One hue knob rethemes everything.** All accent derivations reference `--accent-h`. Change one number, the product changes identity.

### Tokens

Define once at `:root`. Nothing below this layer hardcodes a color.

```css
:root {
  color-scheme: dark;

  /* ---- The hue knob. Change this one number to rebrand. ---- */
  --accent-h: 285;        /* 285 violet · 264 indigo · 235 azure · 155 emerald · 35 amber */
  --neutral-h: 265;       /* keep within ~30 of accent-h so surfaces feel related */

  /* ---- Surfaces: elevation = lightness ---- */
  --bg-canvas:   oklch(0.17 0.012 var(--neutral-h));
  --bg-surface:  oklch(0.21 0.014 var(--neutral-h));
  --bg-raised:   oklch(0.25 0.016 var(--neutral-h));
  --bg-overlay:  oklch(0.28 0.018 var(--neutral-h));
  --bg-inset:    oklch(0.14 0.010 var(--neutral-h));  /* wells, code blocks, table headers */

  /* ---- Foreground: four levels, always all four ---- */
  --fg:           oklch(0.97 0.004 var(--neutral-h));
  --fg-secondary: oklch(0.80 0.010 var(--neutral-h));
  --fg-muted:     oklch(0.65 0.012 var(--neutral-h));
  --fg-faint:     oklch(0.52 0.012 var(--neutral-h));

  /* ---- Edges ---- */
  --edge:           oklch(1 0 0 / 0.08);
  --edge-strong:    oklch(1 0 0 / 0.14);
  --edge-subtle:    oklch(1 0 0 / 0.05);
  --edge-highlight: oklch(1 0 0 / 0.10);   /* top-edge light catch — the whole trick */

  /* ---- Accent, fully derived ---- */
  --accent:       oklch(0.65 0.19 var(--accent-h));
  --accent-hover: oklch(from var(--accent) calc(l + 0.06) c h);
  --accent-press: oklch(from var(--accent) calc(l - 0.05) c h);
  --accent-quiet: oklch(0.65 0.19 var(--accent-h) / 0.14);  /* tinted fills, selected rows */
  --accent-ring:  oklch(0.65 0.19 var(--accent-h) / 0.55);
  --accent-fg:    oklch(0.99 0 0);

  /* ---- Semantic. On dark: lift L, ease off C, or they scream. ---- */
  --success: oklch(0.72 0.16 155);
  --danger:  oklch(0.66 0.19 25);
  --warning: oklch(0.78 0.14 75);
  --info:    oklch(0.70 0.13 235);
  /* Quiet variants for badge/banner backgrounds */
  --success-quiet: oklch(0.72 0.16 155 / 0.14);
  --danger-quiet:  oklch(0.66 0.19 25  / 0.14);
  --warning-quiet: oklch(0.78 0.14 75  / 0.14);
  --info-quiet:    oklch(0.70 0.13 235 / 0.14);

  /* ---- Radius: soft system, nested-aware ---- */
  --r-sm: 6px;
  --r-md: 8px;
  --r-lg: 12px;
  --r-xl: 16px;   /* containers only, never controls */
  --r-full: 9999px;

  /* ---- Motion ---- */
  --dur-micro: 120ms;   /* hover, press, checkbox */
  --dur-base:  200ms;   /* dropdowns, tabs, accordion */
  --dur-slow:  320ms;   /* modals, drawers, page-level */
  --ease-out:    cubic-bezier(0.16, 1, 0.30, 1);   /* expo-out: fast start, long settle */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  /* Critically-damped spring — physical, monotonic, no overshoot */
  --ease-snap: linear(
    0, 0.05 5%, 0.19 10%, 0.39 17.5%, 0.57 25%, 0.72 32.5%,
    0.83 40%, 0.90 47.5%, 0.95 55%, 0.975 62.5%, 0.99 72.5%, 1
  );

  /* ---- Ambient depth ---- */
  --lift-1:
    inset 0 1px 0 0 var(--edge-highlight),
    0 1px 2px -1px oklch(0 0 0 / 0.40);
  --lift-2:
    inset 0 1px 0 0 var(--edge-highlight),
    0 2px 4px -2px oklch(0 0 0 / 0.40),
    0 6px 16px -6px oklch(0 0 0 / 0.30);
  --lift-3:
    inset 0 1px 0 0 var(--edge-highlight),
    0 8px 24px -8px oklch(0 0 0 / 0.50),
    0 16px 48px -16px oklch(0 0 0 / 0.35);
}
```

**The light mode is derived, not inverted.** Lightness ramps reverse, chroma stays low, edges go dark — but the highlight inset disappears entirely, because light-from-above is meaningless on a light canvas. There, elevation comes from surface color separation plus a soft shadow.

Luminance is dark-first, so the block above lives in `:root` and light is the override. If the app already follows the Tailwind convention of toggling `.dark` on `<html>`, flip the mapping — put the light tokens in `:root` and the dark tokens under `:root.dark` — rather than introducing a second toggle class.

```css
:root.light {
  color-scheme: light;

  --bg-canvas:  oklch(0.975 0.004 var(--neutral-h));
  --bg-surface: oklch(1 0 0);
  --bg-raised:  oklch(1 0 0);
  --bg-overlay: oklch(1 0 0);
  --bg-inset:   oklch(0.965 0.005 var(--neutral-h));

  --fg:           oklch(0.22 0.015 var(--neutral-h));
  --fg-secondary: oklch(0.44 0.014 var(--neutral-h));
  --fg-muted:     oklch(0.58 0.012 var(--neutral-h));
  --fg-faint:     oklch(0.70 0.010 var(--neutral-h));

  --edge:           oklch(0 0 0 / 0.09);
  --edge-strong:    oklch(0 0 0 / 0.14);
  --edge-subtle:    oklch(0 0 0 / 0.05);
  --edge-highlight: transparent;          /* no light-catch on light surfaces */

  --accent:  oklch(0.55 0.19 var(--accent-h));   /* darker so white text still passes */
  --success: oklch(0.55 0.15 155);
  --danger:  oklch(0.55 0.20 25);
  --warning: oklch(0.62 0.14 75);
  --info:    oklch(0.55 0.14 235);

  --lift-1: 0 1px 2px oklch(0 0 0 / 0.05);
  --lift-2: 0 1px 3px oklch(0 0 0 / 0.07), 0 4px 12px -4px oklch(0 0 0 / 0.06);
  --lift-3: 0 8px 24px -8px oklch(0 0 0 / 0.12), 0 2px 6px oklch(0 0 0 / 0.06);
}
```

### Component Skeletons

Every component in a Luminance system is these primitives recombined. Match this structure.

```css
/* Surface — the base object. Cards, panels, popovers all start here. */
.surface {
  background: var(--bg-surface);
  border: 1px solid var(--edge);
  border-radius: var(--r-lg);
  box-shadow: var(--lift-1);
}

/* Primary action */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  padding-inline: 12px;
  padding-block: 8px;
  min-height: 32px;
  border-radius: var(--r-md);
  background: var(--accent);
  color: var(--accent-fg);
  font-weight: 500;
  box-shadow: inset 0 1px 0 0 oklch(1 0 0 / 0.15);
  transition: background var(--dur-micro) var(--ease-out);
}
.btn-primary:hover  { background: var(--accent-hover); }
.btn-primary:active { background: var(--accent-press); }

/* Secondary — surface-colored, edge-defined */
.btn-secondary {
  background: var(--bg-raised);
  color: var(--fg);
  border: 1px solid var(--edge-strong);
  box-shadow: var(--lift-1);
}
.btn-secondary:hover {
  background: color-mix(in oklab, var(--bg-raised), var(--fg) 6%);
}

/* Input — inset, not raised. Data goes INTO it. */
.input {
  background: var(--bg-inset);
  border: 1px solid var(--edge-strong);
  border-radius: var(--r-md);
  color: var(--fg);
  padding-inline: 12px;
  padding-block: 8px;
  transition: border-color var(--dur-micro) var(--ease-out);
}
.input::placeholder { color: var(--fg-faint); }
.input:focus-visible {
  border-color: var(--accent);
  outline: 2px solid var(--accent-ring);
  outline-offset: -1px;
}

/* Quiet status badge — tinted fill, colored text, no border */
.badge-success {
  background: var(--success-quiet);
  color: var(--success);
  border-radius: var(--r-sm);
  padding-inline: 6px;
  padding-block: 2px;
  font-size: 12px;
  font-weight: 500;
}

/* Selected row — accent tint plus a left rule, never a full accent fill */
.row[aria-selected='true'] {
  background: var(--accent-quiet);
  box-shadow: inset 2px 0 0 0 var(--accent);
}
```

### Luminance Rules

- **Elevation is monotonic.** canvas → surface → raised → overlay. A modal never sits on a color darker than the page behind it.
- **The highlight inset is the signature.** Every raised object gets `inset 0 1px 0 0 var(--edge-highlight)`. Inputs and wells get none — they're recessed.
- **The accent appears at most three times per screen.** Primary action, active nav item, one data emphasis. A fourth use means something else should be demoted.
- **Never `background: var(--accent)` on a large area.** High chroma at scale is fatiguing. Large areas get `--accent-quiet`.
- **Charts inherit `--fg-muted` for axes and gridlines**, and draw series from a ramp derived off `--accent-h` (rotate hue by 40–60° per series, hold L and C constant). Same-lightness series stay legible when printed or color-blind-simulated.
- **Canvas charts need the tokens resolved to sRGB first.** Chart.js and friends parse colors with libraries that don't understand `oklch()`, and reading `ctx.fillStyle` back does *not* convert — Chrome returns the authored color space verbatim. Paint one pixel and read it instead; the browser does the conversion and you get sRGB bytes plus alpha:

```js
ctx.fillStyle = cssColor; // e.g. "oklch(0.65 0.19 285 / 0.98)"
ctx.clearRect(0, 0, 1, 1);
ctx.fillRect(0, 0, 1, 1);
const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
```

---

## Part 3 — Modern CSS Baseline

Use current CSS. Most of what used to need JavaScript or a config layer is now a language feature.

### Color: OKLCH is the default

Author every color in OKLCH. It is perceptually uniform, so `l` maps to how bright a color *looks*, which sRGB hex never did.

```css
/* Ramps that step evenly, because L steps evenly */
--accent-400: oklch(0.72 0.17 264);
--accent-500: oklch(0.65 0.19 264);
--accent-600: oklch(0.58 0.19 264);

/* Derive instead of hand-picking */
--accent-hover:  oklch(from var(--accent) calc(l + 0.06) c h);  /* relative color */
--accent-subtle: color-mix(in oklab, var(--accent) 12%, var(--bg-surface));
--divider:       color-mix(in oklab, var(--fg) 10%, transparent);
```

- `color-mix(in oklab, …)` for mixing toward a neutral or transparent — no muddy midpoints.
- `color-mix(in oklch, …)` when you want the mix to travel through hue space.
- `oklch(from X …)` (relative color syntax) to build a whole state set from one token.
- `light-dark(a, b)` collapses two-mode tokens into one declaration — but it requires `color-scheme` on the element or an ancestor, and it can't be overridden by a class-based toggle. Use it when the app follows the OS only; use class-scoped token blocks when the user can pick a theme.

### Layout: container queries over breakpoints

A card doesn't care how wide the *window* is. It cares how wide *it* is.

```css
.card-grid { container-type: inline-size; container-name: grid; }

@container grid (min-width: 480px) {
  .card { grid-template-columns: auto 1fr; }
}
```

Reach for viewport breakpoints only for page-level chrome (sidebar vs. bottom nav). Everything reusable gets a container query — the same component then works in a sidebar, a modal, and a full-width page with no variant props.

Also current and worth using: `subgrid` for aligning nested card content across a row, `grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr))` for card grids that never overflow on mobile, and logical properties (`padding-inline`, `margin-block`, `border-inline-start`) throughout.

### State: `:has()` replaces state-mirroring classes

```css
/* Card with an error inside it */
.card:has([data-invalid]) { border-color: var(--danger); }

/* Label lights up when its input is focused — no JS, no wrapper class */
.field:has(.input:focus-visible) .label { color: var(--accent); }

/* Row shows its action bar only when something is checked */
.table:has(input[type='checkbox']:checked) .bulk-actions { display: flex; }
```

### Overlays: platform primitives first

- `<dialog>` + `showModal()` gives focus trapping, inert background, and Escape handling for free. Don't hand-roll a modal.
- The **Popover API** (`popover` attribute + `popovertarget`) gives light-dismiss and top-layer stacking for menus and tooltips.
- **CSS anchor positioning** (`anchor-name` / `position-anchor` / `position-area` / `position-try-fallbacks`) replaces positioning libraries — but check support tiers below and keep a fallback.

### Enter/exit animation without JS

```css
.popover {
  opacity: 0;
  translate: 0 -4px;
  transition:
    opacity var(--dur-base) var(--ease-out),
    translate var(--dur-base) var(--ease-out),
    display var(--dur-base) allow-discrete;
}
.popover:popover-open { opacity: 1; translate: 0 0; }

@starting-style {
  .popover:popover-open { opacity: 0; translate: 0 -4px; }
}
```

`@starting-style` supplies the "before-open" values; `transition-behavior: allow-discrete` (shorthand: the `allow-discrete` keyword) keeps `display` around for the exit. This removes the entire class of `isVisible` / `isMounted` state juggling.

To animate to intrinsic height (accordions, expanding panels):

```css
:root { interpolate-size: allow-keywords; }
.panel { height: 0; transition: height var(--dur-base) var(--ease-out); }
.panel[data-open] { height: auto; }
```

### View Transitions

For route changes and list reordering. In Nuxt, enable `experimental: { viewTransition: true }`; for imperative changes use `document.startViewTransition()`. Give shared elements a `view-transition-name` so they morph rather than cross-fade:

```css
.metric-card { view-transition-name: var(--card-id); }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) { animation: none !important; }
}
```

Keep them short (≤300ms) and never animate a transition on data refresh — only on navigation or deliberate reorder.

### Typography

```css
/* Fluid for marketing/hero type. NOT for app chrome —
   dashboards need predictable, fixed sizes. */
--text-display: clamp(2rem, 1.6rem + 2vw, 3.5rem);

h1, h2, h3 { text-wrap: balance; }   /* no orphan word on a heading */
p          { text-wrap: pretty; }    /* no orphan on the last line */

/* Variable fonts: one file, every weight, real optical sizing */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/InterVariable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}
/* Kill the swap reflow: a metric-matched fallback, tuned to the real face.
   size-adjust / ascent-override go on the FALLBACK, not the webfont. */
@font-face {
  font-family: 'Inter Fallback';
  src: local('Helvetica Neue'), local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
body {
  font-family: 'Inter', 'Inter Fallback', system-ui, sans-serif;
  font-optical-sizing: auto;
}

/* Data always */
.numeric { font-variant-numeric: tabular-nums; }
```

### Forms and scrolling details that read as craft

```css
textarea      { field-sizing: content; }        /* grows with content, no JS */
:root         { scrollbar-gutter: stable; }     /* no layout shift when scrollbars appear */
.scroll-panel { overscroll-behavior: contain; } /* no scroll chaining to the page */
.long-list > * { content-visibility: auto; contain-intrinsic-size: auto 56px; }
input, textarea { accent-color: var(--accent); }

/* Mobile: dvh, and respect the notch */
.app-shell { min-height: 100dvh; padding-bottom: env(safe-area-inset-bottom); }
```

### Cascade layers

Order your layers once, and specificity fights disappear.

```css
@layer reset, tokens, base, components, utilities;
```

### Support tiers — ship accordingly

| Tier | Features | How to use |
|---|---|---|
| **Safe** | OKLCH, `color-mix()`, container queries, `:has()`, `@layer`, `dvh`, `text-wrap`, `overscroll-behavior`, logical properties, `<dialog>` | Use directly. No fallback needed. |
| **Near-safe** | `@starting-style`, `allow-discrete`, Popover API, relative color syntax, `scrollbar-gutter` | Use, but make sure the un-animated / un-enhanced state is correct on its own. |
| **Progressive** | Anchor positioning, `field-sizing`, `interpolate-size`, View Transitions | Enhancement only. Wrap in `@supports`, ship a working baseline underneath. |

```css
@supports (anchor-name: --x) {
  .menu { position-anchor: --trigger; position-area: block-end span-inline-end; }
}
```

### Expressing tokens in Tailwind

**Tailwind v4** — CSS-first, tokens *are* the config:

```css
@import 'tailwindcss';
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-canvas:  oklch(0.17 0.012 265);
  --color-surface: oklch(0.21 0.014 265);
  --color-accent:  oklch(0.65 0.19 264);
  --radius-lg: 12px;
  --ease-out: cubic-bezier(0.16, 1, 0.30, 1);
}
```

**Tailwind v3** — point the config at CSS variables:

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // Bare var(): simple, but see the gotcha below.
        canvas: 'var(--bg-canvas)',
        // Raw channels: keeps opacity modifiers (bg-surface/50) working.
        surface: 'oklch(var(--bg-surface) / <alpha-value>)',
      },
    },
  },
};
```

⚠️ **v3 gotcha:** a color defined as a bare `var()` breaks opacity modifiers — `bg-accent/50` silently produces nothing. Either define the variable as raw channels (`--accent: 0.65 0.19 264;` + `oklch(var(--accent) / <alpha-value>)`) or, preferably, define explicit `--accent-quiet` style tokens and skip opacity modifiers for themed colors entirely.

---

## Part 4 — Core Craft Principles

These apply regardless of design direction. This is the quality floor.

### The 4px Grid

All spacing uses a 4px base grid: `4` (icon gaps) · `8` (within components) · `12` (between related elements) · `16` (section padding) · `24` (between sections) · `32` (major separation).

### Symmetrical Padding

**TLBR must match.** If top padding is 16px, left/bottom/right must also be 16px. Exception: when content naturally creates visual balance.

```css
/* Good */
padding: 16px;
padding-block: 12px; padding-inline: 16px;  /* only when horizontal needs more room */

/* Bad */
padding: 24px 16px 12px 16px;
```

### Radius: pick a system, then nest correctly

Sharp (4/6/8) feels technical. Soft (8/12/16) feels modern. Minimal (2/4/6) feels precise. Don't mix systems.

**Nested radius rule:** an inner element's radius = outer radius − the gap between them. A 12px card with 8px padding holds an 4px-radius child. Concentric corners are one of the clearest tells of a designed interface.

### Depth & Elevation Strategy

**Match your depth approach to your design direction.** Depth is a tool, not a requirement.

**Borders-only (flat)** — Clean, technical, dense. Linear and Raycast use almost no shadows — just subtle borders. This isn't lazy; it's intentional restraint.

**Subtle single shadows** — Soft lift without complexity. `0 1px 3px oklch(0 0 0 / 0.08)` can be enough.

**Layered shadows** — Rich, dimensional. Stripe and Mercury use this. Best for cards that should feel like physical objects.

**Surface color shifts** — Background tints establish hierarchy with no shadows at all. A card at `--bg-surface` on `--bg-canvas` already reads as elevated.

**Ambient light (Luminance)** — Lighter surface + `inset 0 1px 0` top highlight. Native to dark UIs. See Part 2.

Choose ONE and commit. Mixing flat borders on some cards with heavy shadows on others creates visual inconsistency.

**The craft is in the choice, not the complexity.** A flat interface with perfect spacing and typography is more polished than a shadow-heavy interface with sloppy details.

### Card Layouts Vary, Surface Treatment Stays Consistent

Monotonous card layouts are lazy design. A metric card doesn't have to look like a plan card doesn't have to look like a settings card. One might have a sparkline, another an avatar stack, another a progress ring, another a two-column split.

Design each card's internal structure for its specific content — but keep the surface treatment consistent: same border weight, elevation recipe, corner radius, padding scale, typography. Cohesion comes from the container chrome, not from forcing every card into one template.

### Isolated Controls

UI controls deserve container treatment. Date pickers, filters, dropdowns — these should feel like crafted objects sitting on the page, not plain text with click handlers.

**Never use native form elements for styled UI.** Native `<select>` and `<input type="date">` render OS-native pickers that cannot be styled. Build custom components — but build them on `<dialog>`, the Popover API, and real ARIA, not on divs.

**Custom select triggers must use `display: inline-flex` with `white-space: nowrap`** to keep text and chevron on the same row.

### Typography Hierarchy

- Headlines: 600 weight, tight letter-spacing (−0.02em)
- Body: 400–500 weight, standard tracking
- Labels: 500 weight, slight positive tracking for uppercase
- Scale: 11, 12, 13, 14 (base), 16, 18, 24, 32

### Monospace for Data

Numbers, IDs, codes, timestamps belong in monospace with `tabular-nums`. Mono signals "this is data."

### Iconography

Icons clarify, not decorate — if removing an icon loses no meaning, remove it. Give standalone icons presence with subtle background containers.

### Animation

- `120ms` micro-interactions · `200ms` standard · `320ms` overlays
- Default easing `cubic-bezier(0.16, 1, 0.30, 1)` — fast out, long settle
- Springs via `linear()` are fine **when they don't overshoot**. Enterprise UI can feel physical; it shouldn't feel bouncy.
- Animate `transform`, `opacity`, `translate`, `scale`, `filter`, and `clip-path`. Animating `width`/`top`/`left` costs layout on every frame.

### Contrast Hierarchy

Build a four-level system: foreground → secondary → muted → faint. Use all four consistently.

### Color for Meaning Only

Gray builds structure. Color only appears when it communicates: status, action, error, success. Decorative color is noise.

In data-heavy interfaces, ask whether each use of color earns its place. Score bars don't need to be color-coded by performance — one muted color works. Grade badges don't need traffic-light colors — typography can do the hierarchy. Look at how GitHub renders tables: almost entirely monochrome, color reserved for status and actionable elements.

---

## Part 5 — Navigation Context

Screens need grounding. A data table floating in space feels like a component demo, not a product. Include:

- **Navigation** — sidebar or top nav showing where you are
- **Location indicator** — breadcrumbs, page title, or active nav state
- **User context** — who's logged in, what workspace

When building sidebars, use the same background as the main content area. Supabase, Linear, and Vercel rely on a subtle border for separation rather than a different background color. This reduces visual weight and feels more unified.

---

## Part 6 — Accessibility & Motion Floor

Not optional, not a later pass.

**Focus** — Use `:focus-visible`, never `:focus`, and never `outline: none` without a replacement. Prefer `outline` + `outline-offset` over a box-shadow ring: it doesn't get clipped by `overflow: hidden` and it survives forced-colors mode.

```css
:where(a, button, [role='button'], input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--accent-ring);
  outline-offset: 2px;
  border-radius: inherit;
}
```

**Target size** — Interactive targets get at least 24×24 CSS px (WCAG 2.2 §2.5.8). Prefer 32px in dense desktop UI, 44px on touch. A 16px icon button needs padding, not a smaller hit area.

**Contrast** — Body text ≥ 4.5:1, large text and UI boundaries ≥ 3:1. OKLCH makes this tractable: for text on a surface, a lightness delta of roughly 0.45+ clears AA. Verify the real numbers, don't eyeball.

**Motion**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Also respect `prefers-reduced-transparency` (drop backdrop blurs) and `prefers-contrast: more` (promote `--edge` to `--edge-strong`).

**Forced colors** — In `@media (forced-colors: active)`, borders and outlines survive; background colors and shadows don't. Never let a shadow be the only thing communicating a boundary.

**Semantics** — A clickable div is a bug. Buttons are `<button>`, links are `<a href>`, toggles carry `aria-pressed`, disclosure carries `aria-expanded`, selected rows carry `aria-selected`. Toasts live in an `aria-live="polite"` region.

---

## Part 7 — Anti-Patterns

### Never Do This

- Dramatic drop shadows (`box-shadow: 0 25px 50px…`)
- Large border radius (16px+) on small elements
- Asymmetric padding without clear reason
- Pure white cards on colored backgrounds; pure `#000` canvas in dark mode
- Thick borders (2px+) for decoration
- Excessive spacing (margins > 48px between sections)
- Bouncy/overshooting animation in enterprise UI
- Gradients for decoration
- Multiple accent colors in one interface
- Hardcoded hex values inside components — everything comes from a token
- Inverting a light theme to produce a dark one
- Viewport breakpoints on a reusable component (use a container query)
- `outline: none` with no replacement focus indicator
- Animating `width`, `height`, `top`, or `left`
- Frosted glass everywhere — `backdrop-filter` is expensive and, past one or two surfaces, illegible

### Always Question

- "Did I think about what this product needs, or did I default?"
- "Is my depth strategy consistent and intentional?"
- "Are all elements on the grid, and are nested radii concentric?"
- "Could this be a container query instead of a breakpoint?"
- "Could `:has()` or `@starting-style` remove this JavaScript state?"
- "Does every color trace back to a token?"
- "Does this survive reduced motion, forced colors, and keyboard-only?"

---

## The Standard

Every interface should look designed by a team that obsesses over 1-pixel differences. Not stripped — *crafted*. And designed for its specific context.

Different products want different things. A developer tool wants precision and density. A collaborative product wants warmth and space. A financial product wants trust and sophistication. Let the product context guide the aesthetic.

The goal: intricate minimalism with appropriate personality. Same quality bar, context-driven execution — expressed in current CSS, from a token layer, with accessibility built in rather than retrofitted.
