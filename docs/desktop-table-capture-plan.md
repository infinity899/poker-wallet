# Desktop Table Capture — Implementation Plan

> Written 2026-08-28. Execute steps in order; each numbered step is one commit.
> Verify file/line references before editing — they drift.
> Two repos are involved: **this repo** (web app, Phase 0) and a **new repo `poker-wallet-desktop`** (Phases 1–3).

## Hand-off (for the agent executing this)

- **Execute exactly one phase or milestone per run**, in this order: Phase 0 (this repo) → Milestone 1a (desktop, capture-only) → Milestone 1b (desktop, extraction + insert) → Phase 2 → Phase 3. Do not start the next one in the same run.
- Read *Conventions & guardrails* and *Data contract* in full before writing code. They override `CLAUDE.md` where they disagree.
- One commit per numbered step, message `feat(desktop-capture): <step title>`. Do not push.
- When a step says *Verify*, actually run the commands and report their output. A phase is not done until its Verify list passes; if an item cannot be verified without the user (applying SQL, granting Screen Recording, a real poker client), say so explicitly and list what the user must do.
- Do not widen scope: nothing in *Out of scope* gets built, no toggles that the plan says don't exist, no extra models in the dropdown.
- If a file/line reference has drifted, find the current location and continue; if a **decision** seems wrong, stop and ask rather than deviating.

## Context

Online tournaments are entered by hand today. The goal: a desktop companion app where the user **clicks an open poker-table window** and the tournament is created in Poker Wallet as `in_progress`, ready to be completed (winnings / finish) later from the web app or phone.

### Locked product decisions (confirmed with the user)
- **Extraction is vision-first from day one ("option C").** A screenshot of the clicked window is sent to Claude, which returns structured tournament fields. No window-title regexes, no hand-history parsing. This works for every client (PokerStars, GGPoker, 888, Winamax, …) with one code path. Title parsing may be added later *only* as a hint fed alongside the image, never as a replacement.
- **One row per tournament.** The desktop app never creates the `isSession` batch rows the web app's "Log Session" modal creates.
- **Human-in-the-loop by default.** Extraction fills a review form; the user presses *Add*. A "trust high-confidence extractions" toggle can skip the review later (Phase 3).
- **Every capture is saved to disk automatically** (user requirement — no manual screenshots, ever). Clicking a table writes the PNG plus a sidecar JSON to a user-visible folder. This is both the fixture pipeline for prompt tuning and an audit trail. Ships **first**, as a capture-only build (milestone 1a), before any Claude call exists.
- **Results are completed in the web app** (existing `in_progress` → *Complete Session* flow in `app/pages/tournaments/[id].vue:307`). Phase 3 adds an optional vision-based "Finish" from the desktop app.
- **macOS and Windows are both first-class targets** (user requirement). Every capture/permission/build step below is written for both; nothing may be mac-only.
- **Cheap model by default** (user requirement): `claude-sonnet-5` at effort `low`, switchable in Settings. See *Model selection* below.
- **Sites: PokerStars and GGPoker** (confirmed). Other sites still work through the vision path; these two drive the picker sort order and the fixture set.
- **Re-entry rule (confirmed):** capturing the **same table again** means the user re-entered. A second capture with an existing `external_id` does not error — it increments `entries` on the existing row after a one-click confirm. See *Re-entry handling* in step 1.4.
- **The user signs in with Google.** The desktop app uses email + password, so Phase 0 adds a *Set password* section to the web app's Settings (step 0.5). Same Supabase user, same `user_id`; RLS unchanged.
- **Desktop repo is scaffolded locally first** at `~/Projects/poker-wallet-desktop`; the GitHub remote is added later.
- API costs are the user's own (≈ $0.005 per capture on Sonnet 5, ≈ $0.003 on Haiku 4.5, ≈ $0.012 on Opus 5).

### Locked technical decisions
- **Desktop stack: Electron + electron-vite + Vue 3 + TypeScript.** Same UI stack as the web app. Screenshots come from Electron's built-in `desktopCapturer` — **no native modules**. Tauri was rejected because per-window capture needs Rust crates and a second toolchain for no gain in a personal tool.
- **Delivery: direct Supabase insert** from the desktop app using the same Supabase project, `@supabase/supabase-js`, and `signInWithPassword` (the web app already supports email/password at `app/pages/auth/login.vue:123`). RLS (`auth.uid() = user_id`) already protects the table. No web-app API is needed.
- **All Claude and Supabase calls run in the Electron main process.** The renderer never sees the Anthropic key or the Supabase session. The renderer talks to main through a `contextBridge` API only.
- **Model selection is a Settings dropdown, default `claude-sonnet-5`.** Extraction is a read-what-you-see task, not reasoning, so the cheap tier is the right default; the user can step up if a site's UI proves hard to read. All models go through `client.messages.parse` with `zodOutputFormat`. Never pass `thinking` (Sonnet 5 / Opus 5 run adaptive thinking when it is omitted; Haiku 4.5 runs without). Refusal fallbacks are deliberately **not** enabled (a poker-table screenshot has no refusal surface); handle `stop_reason === 'refusal'` and `parsed_output === null` as ordinary "extraction failed" errors.

  | Setting label | Model ID | `output_config.effort` | ≈ cost / capture | When |
  |---|---|---|---|---|
  | Fast & cheap (default) | `claude-sonnet-5` | `'low'` | $0.005 | Everyday use |
  | Cheapest | `claude-haiku-4-5` | **omit** — `effort` returns 400 on Haiku 4.5 | $0.003 | Clean, high-contrast clients (PokerStars) |
  | Most accurate | `claude-opus-5` | `'medium'` | $0.012 | Cluttered or unfamiliar clients |

  Cost assumes a 1600×1200 PNG (~1.6K image tokens) + ~300 prompt tokens + ~150 output tokens. The fixture harness (step 1.8) prints per-model accuracy so the default can be changed with evidence.
- **Identity via `external_id`** — a new nullable column on `tournaments` with a unique partial index per user. The desktop app always sets it; the web app only reads it. The index is what makes the re-entry rule safe: a second insert can never create a duplicate row, so the only possible outcomes of a repeat capture are *re-entry* or *ignore*.
- **Money is stored in USD**, exactly like the web app: `buy_in`/`fee` in USD plus `original_currency`/`original_buy_in`/`original_fee`/`exchange_rate`. The desktop app fetches the same `https://v6.exchangerate-api.com/v6/<KEY>/latest/USD` endpoint the web app uses (`app/composables/useExchangeRates.ts:81`) so both sides convert identically.

## Conventions & guardrails (READ FIRST)

### This repo (web app)
These correct `CLAUDE.md`, which is stale. Verified against the code:
- **No VeeValidate/Zod in forms.** Forms are `reactive()` objects + hand-written `validate()`; copy `app/pages/tournaments/new.vue`.
- **`app/utils/caseMapping.ts` is dead** — every DB field is mapped by hand in **two** places: `app/composables/useDatabase.ts` (`dbTournamentToTournament`, `tournamentToDbTournament`) and the `toDatabase` callback in `app/adapters/tournamentAdapter.ts`. A field missing from either silently disappears.
- **`useDatabase.ts` is legacy for everything except the converters** — adding lines to the two tournament converters is allowed; do not add anything else there.
- **Do NOT touch** `LocalStorageAdapter.ts`, `SupabaseAdapter.ts`, `adapters/types.ts`.
- **Typecheck**: `npx vue-tsc -p .nuxt/tsconfig.app.json --noEmit` (plain `vue-tsc --noEmit` checks nothing). Lint: `npm run lint`. Tests: `npm run test:run`.
- ESLint: `curly: all`, semicolons, single quotes, 2-space indent, explicit return types on exported utils.
- **SQL migrations are applied by hand** in the Supabase SQL editor. Naming: `supabase/migrations/YYYYMMDD_snake_description.sql`. Mirror the style of `20260725_add_trips_expenses.sql`.
- **Demo mode must keep working**: `LocalStorageAdapter` stores whatever object it's given, so new optional fields need no demo-mode work — but never make them required on `Tournament`.

### Desktop repo
- TypeScript strict, ESM. Same lint config as the web app (`@antfu/eslint-config`) so the two repos read alike.
- **Main process owns secrets.** `ANTHROPIC_API_KEY`, `EXCHANGE_RATE_API_KEY` and the Supabase session are stored via `electron-store` with values wrapped in `safeStorage.encryptString` / `decryptString`. Never `process.env` in the renderer, never a key in `localStorage`.
- **Every IPC handler returns the web app's `Result<T>` shape** — `{ success: true, data } | { success: false, error: { message } }` — so the renderer never throws across the bridge. (Plain `Error` objects don't survive `structuredClone`; send `{ message }`.)
- **Zod schemas use `.nullable()`, never `.optional()`.** Structured outputs require every property to be present.
- Do not bundle `@anthropic-ai/sdk` or `@supabase/supabase-js` into the renderer (electron-vite externalizes main-process deps automatically; keep imports in `src/main/` only).

---

## Data contract (shared between both repos)

### New DB columns (`tournaments`)
| column | type | notes |
|---|---|---|
| `external_id` | `TEXT NULL` | `"<siteSlug>:<siteTournamentId>"` when the site's numeric ID is visible, else `"<siteSlug>:<YYYY-MM-DD>:<sha1(name+buyIn+fee).slice(0,10)>"` |
| `source` | `TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','desktop'))` | provenance badge + future filtering |

Unique partial index: `CREATE UNIQUE INDEX tournaments_user_external_id_idx ON tournaments(user_id, external_id) WHERE external_id IS NOT NULL;`

### Site slugs (fixed union, both repos)
`pokerstars | ggpoker | 888poker | winamax | partypoker | unibet | other`. Display names for the web app's `site` column: `PokerStars`, `GGPoker`, `888poker`, `Winamax`, `PartyPoker`, `Unibet`, `Other`. These display names match `public/data/reference.json` where they overlap; if the user's `reference_data.sites` lacks one, the desktop app still writes it — the web app treats `site` as free text.

### Insert payload the desktop app writes (snake_case = `DbTournament` Insert shape, `app/types/database.types.ts:38`)
```ts
{
  user_id,                       // from the Supabase session
  date,                          // local YYYY-MM-DD at capture time
  type: 'online',
  currency: originalCurrency,    // legacy display column — set to the original currency like new.vue does
  name,
  buy_in,  fee,                  // USD
  entries: 0,
  winnings: 0,
  venue: null,
  site: displayName,
  sites: null,
  field_size: fieldSize ?? null,
  finish_position: null,
  cashed: null,
  notes: extraction.notes || null,
  tags: [],
  status: 'in_progress',
  is_session: null, session_count: null,
  original_currency, original_buy_in, original_fee, original_winnings: 0, exchange_rate,
  external_id, source: 'desktop',
}
```

### Extraction schema (desktop `src/shared/extraction.ts`)
```ts
import { z } from 'zod';

export const SITE_SLUGS = ['pokerstars', 'ggpoker', '888poker', 'winamax', 'partypoker', 'unibet', 'other'] as const;
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'RON'] as const;

export const TableExtractionSchema = z.object({
  isTournamentTable: z.boolean(),                 // false → cash game / lobby / not poker
  site: z.enum(SITE_SLUGS),
  tournamentName: z.string().nullable(),          // e.g. "Sunday Million", "Bounty Hunters $54"
  siteTournamentId: z.string().nullable(),        // numeric ID if visible anywhere (title bar, lobby)
  buyIn: z.number().nullable(),                   // prize-pool portion in the table's currency
  fee: z.number().nullable(),                     // rake portion; null if only a total is visible
  currency: z.enum(CURRENCIES).nullable(),
  game: z.string().nullable(),                    // "NLH", "PLO", ...
  fieldSize: z.number().int().nullable(),         // "1,234 players" if visible
  confidence: z.enum(['high', 'medium', 'low']),
  notes: z.string(),                              // what was ambiguous, empty string if nothing
});
export type TableExtraction = z.infer<typeof TableExtractionSchema>;
```

### Extraction prompt (desktop `src/main/prompts.ts`) — frozen text, cache-friendly
```
You extract poker tournament registration details from a screenshot of an online poker client window.

Return only what is visible. Never invent a value: use null when a field is not shown.

Conventions you may rely on:
- PokerStars: the title bar reads like "$5.50 NLHE [Turbo] - Blinds 25/50 - Tournament 3456789012 Table 12".
  A single amount like "$5.50" is the TOTAL cost; the buy-in/fee split is shown as "$5+$0.50" only in the lobby.
  If only the total is visible, put the total in buyIn and set fee to null, and say so in notes.
- GGPoker: the tournament name and buy-in are shown in the table header; IDs are rarely visible.
- "A+B" formats ("€10+€1", "$100 + $9") mean buyIn = A, fee = B.
- Currency symbols: $ → USD, € → EUR, £ → GBP, C$ → CAD, lei/RON → RON.
- A cash-game table (blinds only, no tournament name or ID) or a lobby list is NOT a tournament table: set isTournamentTable=false.

Set confidence to "high" only when buyIn, currency and either the name or the site ID are read clearly.
```
(Any change to this text invalidates the prompt cache prefix — fine, it is short; it is frozen for consistency, not cost.)

---

## Phase 0 — Web app (this repo)

### Step 0.1 — Migration
Create `supabase/migrations/20260828_add_tournament_external_id.sql`:
```sql
-- Desktop table-capture support.
-- APPLY MANUALLY in the Supabase SQL editor - this project has no CLI migration runner.
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'desktop'));

CREATE UNIQUE INDEX IF NOT EXISTS tournaments_user_external_id_idx
  ON tournaments(user_id, external_id)
  WHERE external_id IS NOT NULL;
```
Also append the two columns to the `tournaments` table in `supabase/schema.sql` (fresh installs) — keep the comment style of the surrounding columns.

### Step 0.2 — Types
- `app/types/tournament.ts`: add `export type TournamentSource = 'manual' | 'desktop';` and on `Tournament`: `externalId?: string;` and `source?: TournamentSource;` (both optional — demo data lacks them).
- `app/types/database.types.ts` `DbTournament`: `external_id: string | null;` and `source: 'manual' | 'desktop';`.

### Step 0.3 — Field mapping (both directions, both files)
- `app/composables/useDatabase.ts` `dbTournamentToTournament`: `externalId: dbTournament.external_id ?? undefined,` and `source: dbTournament.source ?? 'manual',`.
- `app/composables/useDatabase.ts` `tournamentToDbTournament`: `external_id: tournament.externalId ?? null,` and `source: tournament.source ?? 'manual',`.
- `app/adapters/tournamentAdapter.ts` `toDatabase` callback: add the two `if (x !== undefined)` blocks following the existing pattern (`result.external_id = …`, `result.source = …`).

### Step 0.4 — Provenance badge
In `app/pages/tournaments/[id].vue`, next to the status pill in the header, render a small neutral pill `Added from desktop` when `tournament.source === 'desktop'`. Use the existing pill classes in that file (grep `rounded-full` there). Also show the same pill in `app/components/tournaments/TournamentsList.vue`'s in-progress section (line ~74 filters in-progress out of the main list; find where in-progress rows are rendered and add the pill there). No other UI changes.

### Step 0.5 — *Set password* section in Settings (needed because the user signs in with Google)
- New component `app/components/settings/SettingsPassword.vue`, mounted in `app/components/settings/Settings.vue` between `<SettingsDataMode />` and `<SettingsCurrency />`. Copy the card/heading markup of `SettingsTheme.vue` (`.card p-5`, `h2.text-sm.font-semibold`).
- Render only when `!authStore.isDemoMode`. Heading: *Desktop app password*. One sentence of copy: "The desktop companion signs in with your email and a password. Set one here — Google sign-in keeps working."
- Two inputs (`class="input"`): *New password*, *Confirm password*; hand-written `validate()` (min 8 chars, must match), errors under the inputs like `tournaments/new.vue`.
- Submit: `const { error } = await useSupabaseClient().auth.updateUser({ password: form.password })` → `toast.success('Password set')` / `toast.error(error.message)`. Clear the fields on success.
- Show the account email read-only above the inputs (`useSupabaseUser().value?.email`) so the user knows which email to type into the desktop app.

### Step 0.6 — Verify
- `npx vue-tsc -p .nuxt/tsconfig.app.json --noEmit`, `npm run lint`, `npm run test:run` all clean.
- Set a password in Settings while signed in with Google → sign out → sign in at `/auth/login` with email + that password → same data visible (same `user_id`).
- Apply the migration in Supabase; insert a row by hand via the SQL editor with `external_id = 'pokerstars:1'`, `source = 'desktop'`, `status = 'in_progress'`; confirm it appears under in-progress in the web app with the badge and that *Complete Session* still works on it.
- Insert the same `external_id` again for the same user → must fail with a unique violation (`23505`).

---

## Phase 1 — Desktop repo: capture → extract → review → insert

### Step 1.1 — Scaffold
```bash
cd ~/Projects
npm create electron-vite@latest poker-wallet-desktop -- --template vue-ts
cd poker-wallet-desktop
git init && git add -A && git commit -m "scaffold electron-vite vue-ts"   # remote added later
npm i @anthropic-ai/sdk @supabase/supabase-js zod electron-store
npm i -D @antfu/eslint-config eslint vitest electron-builder
```
`electron-builder` config in `package.json`: `mac: { target: 'dmg' }`, `win: { target: 'nsis' }`, both unsigned for now. Tray icon assets: `build/tray.png` (22 px template image, mac) and `build/tray.ico` (Windows) — pick by `process.platform`. `npm run build:mac` / `npm run build:win` scripts; each platform builds its own installer (no cross-building).
Target layout (electron-vite's three-process layout):
```
src/
├── main/
│   ├── index.ts          # app lifecycle, BrowserWindow, Tray, globalShortcut, ipcMain.handle registrations
│   ├── capture.ts        # listWindows(), captureWindow(sourceId) → PNG Buffer  (desktopCapturer)
│   ├── captureStore.ts   # saveCapture(png, meta) → writes PNG + sidecar JSON to the captures folder
│   ├── extract.ts        # extractFromImage(png) → Result<TableExtraction>            (Anthropic)
│   ├── models.ts         # EXTRACTION_MODELS table: id, label, effort (see Model selection)
│   ├── wallet.ts         # Supabase client: signIn, signOut, session restore, insertTournament, listInProgress, updateTournament
│   ├── rates.ts          # getUsdRate(currency) with 24h cache (exchangerate-api)
│   ├── settings.ts       # electron-store + safeStorage — see contract below
│   ├── externalId.ts     # buildExternalId(extraction, date)
│   └── prompts.ts        # SYSTEM_PROMPT (frozen)
├── preload/index.ts      # contextBridge.exposeInMainWorld('api', {...})  — one function per ipcMain.handle
├── renderer/
│   ├── App.vue           # tabs: Capture | In progress | Settings
│   ├── components/
│   │   ├── WindowPicker.vue    # grid of window thumbnails; click = capture+extract
│   │   ├── ReviewForm.vue      # editable extraction → Add button
│   │   ├── InProgressList.vue  # rows from Supabase (Phase 3 uses this for Finish)
│   │   └── SettingsForm.vue    # keys + Supabase login
│   └── api.d.ts          # type of window.api (import shared types)
└── shared/
    ├── extraction.ts     # TableExtractionSchema (above)
    ├── result.ts         # Result<T> type (copy from web app app/types/result.ts)
    └── types.ts          # SiteSlug, SITE_DISPLAY_NAMES, NewTournamentPayload (snake_case insert shape above), IPC payload types
```

#### `settings.ts` contract (used by every other main module)
```ts
// Plain settings (electron-store, unencrypted)
interface Settings {
  model: ExtractionModelId;          // default DEFAULT_MODEL
  capturesDir: string | null;        // null → default under app.getPath('pictures')
  supabaseUrl: string;               // default: production project URL (hard-coded constant)
  supabaseAnonKey: string;           // default: production anon key (hard-coded constant; it is public by design)
}
export function getSetting<K extends keyof Settings>(key: K): Settings[K];
export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;

// Secrets (stored as base64 of safeStorage.encryptString(); decrypted on read)
type SecretKey = 'anthropicKey' | 'exchangeKey' | 'supabaseSession';
export function getSecret(key: SecretKey): string | null;
export function setSecret(key: SecretKey, value: string | null): void;   // null deletes
```
`safeStorage.isEncryptionAvailable()` must be true before any `setSecret`; if it is false (rare — Linux without a keyring), refuse to store secrets and show an error in Settings rather than falling back to plaintext.

### Step 1.2 — `capture.ts`
```ts
import { desktopCapturer, systemPreferences } from 'electron';

const POKER_APP_PATTERNS = [/pokerstars/i, /ggpoker|gg poker/i, /888/i, /winamax/i, /party ?poker/i, /unibet/i];

export interface CapturableWindow { id: string; name: string; thumbnailDataUrl: string; isLikelyPoker: boolean }

export function screenPermissionStatus(): 'granted' | 'denied' | 'not-determined' | 'n/a' {
  return process.platform === 'darwin' ? systemPreferences.getMediaAccessStatus('screen') : 'n/a';
}

export async function listWindows(): Promise<CapturableWindow[]> {
  const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 320, height: 200 }, fetchWindowIcons: false });
  return sources
    .filter(s => s.name.trim() !== '')
    .map(s => ({ id: s.id, name: s.name, thumbnailDataUrl: s.thumbnail.toDataURL(), isLikelyPoker: POKER_APP_PATTERNS.some(p => p.test(s.name)) }))
    .sort((a, b) => Number(b.isLikelyPoker) - Number(a.isLikelyPoker));
}

export async function captureWindow(sourceId: string): Promise<Buffer> {
  // thumbnailSize is a bounding box; the window is captured at native size and scaled to fit.
  // 1600x1200 keeps title-bar text legible and stays under Claude's 1568px long-edge resize.
  const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 1600, height: 1200 } });
  const source = sources.find(s => s.id === sourceId);
  if (!source) { throw new Error('Window is no longer open'); }
  return source.thumbnail.toPNG();
}
```
- **macOS**: `getSources` returns windows with **empty names** until Screen Recording permission is granted. The Settings tab must show `screenPermissionStatus()` and a button that calls `shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture')`. The app must be **restarted** after granting — say so in the UI.
- **Windows**: no permission prompt; `screenPermissionStatus()` returns `'n/a'` and the Settings row is hidden. Known risk: some GPU-composited windows come back as a **black thumbnail** from `desktopCapturer`. Mitigation, implemented in Phase 1 only if a fixture shows it: detect an all-black PNG (sample 64 pixels via `nativeImage.getBitmap()`), and fall back to `getSources({ types: ['screen'] })` + a crop rectangle chosen by the user in a one-off overlay. PokerStars (Qt) and GGPoker (Chromium) are expected to capture normally.
- Poll `listWindows()` every 2 s while the Capture tab is visible; stop when hidden.

### Step 1.2b — `captureStore.ts` (automatic screenshot saving)
```ts
import { app } from 'electron';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface CaptureMeta {
  windowTitle: string;
  platform: NodeJS.Platform;
  capturedAt: string;            // ISO
  extraction?: TableExtraction;  // filled in later by extract.ts when it ran
  model?: string;
  usage?: { input_tokens: number; output_tokens: number };
}

export function capturesDir(): string {
  // User-visible on purpose: ~/Pictures/Poker Wallet Captures (mac) / %USERPROFILE%\Pictures\Poker Wallet Captures (win)
  return getSetting('capturesDir') ?? path.join(app.getPath('pictures'), 'Poker Wallet Captures');
}

export async function saveCapture(png: Buffer, meta: CaptureMeta): Promise<{ pngPath: string; jsonPath: string }> {
  const dir = capturesDir();
  await mkdir(dir, { recursive: true });
  const stamp = meta.capturedAt.replace(/[:.]/g, '-');
  const slug = meta.windowTitle.replace(/[^a-z0-9]+/gi, '_').slice(0, 60) || 'window';
  const base = path.join(dir, `${stamp}__${slug}`);
  await writeFile(`${base}.png`, png);
  await writeFile(`${base}.json`, JSON.stringify(meta, null, 2));
  return { pngPath: `${base}.png`, jsonPath: `${base}.json` };
}

export async function updateCaptureMeta(jsonPath: string, patch: Partial<CaptureMeta>): Promise<void> { /* read, merge, write */ }
```
- **Always on.** There is no toggle to disable saving; Settings only lets the user change the folder and has *Open folder* (`shell.openPath(capturesDir())`). Old captures are never auto-deleted (a 1600×1200 PNG is ~300 KB; a heavy month is ~100 MB).
- Order of operations in the `capture:extract` IPC handler: `captureWindow` → `saveCapture` (PNG + JSON with no extraction yet) → return the preview to the renderer immediately → `extractFromImage` → `updateCaptureMeta` with the extraction/model/usage. If extraction fails or the API key is missing, **the screenshot is still on disk** — that is the whole point.
- The `WindowPicker` card also gets a secondary *Save only* action (no Claude call) for collecting negative cases (cash tables, lobbies) without paying for extraction.

### Step 1.3 — `extract.ts`
```ts
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { TableExtractionSchema, type TableExtraction } from '../shared/extraction';
import type { Result } from '../shared/result';
import { SYSTEM_PROMPT } from './prompts';
import { getSecret } from './settings';

// models.ts
export const EXTRACTION_MODELS = {
  'claude-sonnet-5': { label: 'Fast & cheap (default)', effort: 'low' },
  'claude-haiku-4-5': { label: 'Cheapest', effort: undefined },   // effort is rejected on Haiku 4.5
  'claude-opus-5': { label: 'Most accurate', effort: 'medium' },
} as const;
export type ExtractionModelId = keyof typeof EXTRACTION_MODELS;
export const DEFAULT_MODEL: ExtractionModelId = 'claude-sonnet-5';

// extract.ts
export async function extractFromImage(png: Buffer, windowTitle: string): Promise<Result<TableExtraction>> {
  const apiKey = getSecret('anthropicKey');
  if (!apiKey) { return { success: false, error: { message: 'Anthropic API key not set (Settings)' } }; }
  const modelId = getSetting('model') ?? DEFAULT_MODEL;
  const { effort } = EXTRACTION_MODELS[modelId];
  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.parse({
      model: modelId,
      max_tokens: 2048,
      output_config: { ...(effort ? { effort } : {}), format: zodOutputFormat(TableExtractionSchema) },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: png.toString('base64') } },
          { type: 'text', text: `Window title: ${windowTitle}\nExtract the tournament details.` },
        ],
      }],
    });
    if (response.stop_reason === 'refusal') { return { success: false, error: { message: 'Model declined to read this image' } }; }
    if (!response.parsed_output) { return { success: false, error: { message: 'Could not parse extraction' } }; }
    return { success: true, data: response.parsed_output };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) { return { success: false, error: { message: 'Invalid Anthropic API key' } }; }
    if (e instanceof Anthropic.RateLimitError) { return { success: false, error: { message: 'Rate limited — try again in a moment' } }; }
    if (e instanceof Anthropic.APIError) { return { success: false, error: { message: `Claude API error ${e.status}: ${e.message}` } }; }
    return { success: false, error: { message: e instanceof Error ? e.message : 'Extraction failed' } };
  }
}
```
- The window title is passed as a **hint** text block after the image, not parsed by code.
- Log `response.usage` (input/output/cache_read tokens) and the model ID at debug level so per-capture cost is visible.
- Changing the model invalidates the prompt cache (caches are model-scoped) — irrelevant at this volume, noted so nobody "fixes" it.

### Step 1.4 — `wallet.ts` (Supabase)
- `createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: true } })`; persist `session` (access + refresh token JSON) in `settings.ts` encrypted; on startup call `supabase.auth.setSession(saved)` and re-save the refreshed session from `onAuthStateChange`.
- `signIn(email, password)` → `signInWithPassword`. OAuth (Google/GitHub) is out of scope for v1 — a user who only has OAuth must set a password once in the web app's settings (Supabase supports `updateUser({ password })`).
- `findByExternalId(externalId): Promise<Result<ExistingRow | null>>` — `select('id, name, entries, status, date, created_at').eq('user_id', uid).eq('external_id', externalId).maybeSingle()`.
- `insertTournament(payload: NewTournamentPayload): Promise<Result<{ id: string }>>` — `from('tournaments').insert(payload).select('id').single()`. Map Postgres error code `23505` to `{ code: 'DUPLICATE' }` so the caller can fall into the re-entry path even if the pre-check raced.
- `addReentry(id): Promise<Result<{ entries: number }>>` — `update({ entries: existing.entries + 1 }).eq('id', id).eq('user_id', uid).select('entries').single()`. **Only `entries` changes** — buy-in/fee/rate stay as recorded at first registration; the web app already multiplies cost by `(entries + 1)` (`calculateTournamentResult`, `app/types/tournament.ts`).

**Re-entry handling (confirmed rule: same table captured again = re-entry).** The `wallet:add` handler:
1. `findByExternalId(form.externalId)`. If **null** → insert as usual → `{ outcome: 'created' }`.
2. If a row **exists** and `status === 'in_progress'` → return `{ outcome: 'exists', existing }` to the renderer **without writing**. The renderer shows a dialog: *"Already registered today — count this as a re-entry?"* with buttons **Re-entry** (default) and **Ignore**. Re-entry → `wallet:reentry(existing.id)` → `addReentry` → toast *"Re-entry #2 recorded"* (`entries + 1`). Ignore → nothing written.
3. If a row exists and `status === 'completed'` → dialog *"This tournament is already completed. Register a new one?"* — Yes inserts with `external_id` suffixed `#2` (`pokerstars:123456#2`) so the unique index still holds; No does nothing.
4. Accidental double-clicks: if the existing row was created **< 30 s ago**, skip the dialog and show *"Already added"* instead — a real re-entry takes longer than that.
5. The capture's sidecar JSON gets `action: 'created' | 'reentry' | 'ignored' | 'duplicate'` and `tournamentId` appended via `updateCaptureMeta`.
- `listInProgress()` — `select('id, date, name, site, buy_in, fee, original_currency, external_id').eq('user_id', uid).eq('status', 'in_progress').order('date', { ascending: false })`.
- `updateTournament(id, patch)` — used by Phase 3.

### Step 1.5 — `rates.ts` + `externalId.ts`
- `getRate(currency)`: `USD → 1`. Otherwise fetch `https://v6.exchangerate-api.com/v6/${key}/latest/USD`, read `conversion_rates[currency]` (units of `currency` per 1 USD), cache the whole response in `electron-store` for 24 h. **Match the web app exactly** (verified in `app/composables/useExchangeRates.ts:176-189` and `app/pages/tournaments/new.vue:473`): the stored `exchange_rate` is the raw `conversion_rates[currency]` value (currency units per USD — the "1 originalCurrency = X USD" comment on the `Tournament` type is wrong), and `toUSD(amount) = amount / rate`. If the key is missing or the fetch fails, return `success:false` — never silently store unconverted money.
- `buildExternalId(x: TableExtraction, date: string)`: `${x.site}:${x.siteTournamentId}` if the ID is present, else `${x.site}:${date}:${sha1(`${x.tournamentName}|${x.buyIn}|${x.fee}`).slice(0, 10)}` (Node `crypto`).

### Step 1.6 — IPC surface (`preload/index.ts`)
```ts
contextBridge.exposeInMainWorld('api', {
  listWindows:        () => ipcRenderer.invoke('windows:list'),
  captureAndExtract:  (sourceId: string) => ipcRenderer.invoke('capture:extract', sourceId), // → Result<{ extraction, previewDataUrl }>
  addTournament:      (form: ReviewFormValues) => ipcRenderer.invoke('wallet:add', form),      // → Result<{ id }>
  listInProgress:     () => ipcRenderer.invoke('wallet:inProgress'),
  auth:               { status: () => …, signIn: (email, password) => …, signOut: () => … },
  settings:           { get: () => …, set: (patch) => …, screenPermission: () => …, openScreenPermission: () => … },
});
```
`ReviewFormValues` = `{ date, name, site: SiteSlug, currency, buyIn, fee, fieldSize: number | null, notes, externalId }` — the **renderer's edited values**, so main builds the payload from what the user confirmed, not from the raw extraction. Main computes the rate, USD amounts and inserts. Add `reentry: (id: string) => ipcRenderer.invoke('wallet:reentry', id)` for the re-entry path; `addTournament` resolves to `Result<{ outcome: 'created', id } | { outcome: 'exists', existing }>`.

### Step 1.7 — Renderer
- `WindowPicker.vue`: grid of thumbnails, likely-poker windows first with a small badge; click → spinner on that card → `captureAndExtract` → open `ReviewForm` with the preview image on the left and fields on the right.
- `ReviewForm.vue`: fields prefilled from the extraction; `confidence` shown as a colored chip; `notes` shown as a hint under the form; `isTournamentTable === false` renders a warning banner but still allows adding. `fee === null` leaves the field empty with placeholder "not visible — check lobby". *Add* → `addTournament` → `created`: success toast + jump to In-progress tab; `exists`: the re-entry dialog from step 1.4 (Re-entry / Ignore).
- `InProgressList.vue` rows show `entries` as a badge (*"2 entries"*) when `> 0` so a re-entry is visibly recorded.
- `InProgressList.vue`: read-only list for v1.
- `SettingsForm.vue`: Supabase URL + anon key (defaults hard-coded to the production project so the user only pastes them once if they change), email/password login, Anthropic key, **model dropdown** (labels from `EXTRACTION_MODELS`, default Sonnet 5), exchange-rate key, **captures folder** with *Open folder*, screen-permission status (macOS only).
- Global shortcut `CommandOrControl+Shift+P` shows/focuses the app on the Capture tab. Tray icon with *Capture…* / *Quit*. Closing the window hides it instead of quitting.

### Step 1.8 — Fixture harness (do this before polishing the UI)
- `test/fixtures/*.png` + sibling `*.json` — **copied straight from the captures folder** (step 1.2b) — no manual screenshots. Target set: PokerStars table, PokerStars lobby, GG table, a cash table as a negative case, anything else the user plays. `scripts/import-fixtures.ts <captures-dir>` copies the newest N pairs in and strips `extraction`/`usage` from the JSON so they can't leak the previous answer into the expected file.
- `scripts/extract-fixture.ts` (run with `npx tsx scripts/extract-fixture.ts test/fixtures/ps-table.png "window title here" [--model claude-haiku-4-5]`): calls `extractFromImage` directly and prints the JSON + token usage + cost. This is how the prompt and the default model get tuned — no Electron needed. Run every fixture through all three models once and record the result in `test/fixtures/README.md` before changing the default.
- `test/extraction.spec.ts` (vitest): for each fixture with a sibling `*.expected.json`, assert `site`, `buyIn`, `currency` and `isTournamentTable` match. Mark the suite `describe.skipIf(!process.env.ANTHROPIC_API_KEY)` so CI without a key passes.

### Step 1.9 — Verify Phase 1

**Milestone 1a — capture-only build (ship this first, before 1.3–1.7).** Steps 1.1, 1.2, 1.2b, the `WindowPicker`, and a Settings tab with only the captures folder. No API key, no Supabase.
1. `npm run dev` on **macOS** → grant Screen Recording → restart → poker client windows appear first in the picker with readable thumbnails. Repeat on **Windows** → no permission step, same result, thumbnails are not black.
2. Click a table → a PNG and a JSON with the same basename appear in *Pictures/Poker Wallet Captures* within a second; the PNG opens and the title-bar text is legible; the JSON has `windowTitle`, `platform`, `capturedAt`.
3. Click a lobby and a cash table with *Save only* → files appear, no error.
4. The user plays a normal session with the build running and clicks every table once → the captures folder is the fixture set for 1.8.

**Milestone 1b — full flow.**
5. Click a PokerStars tournament table → within ~5 s the review form shows site = PokerStars, correct buy-in/currency, `confidence` high; `notes` explains any missing split. The sidecar JSON now also contains `extraction`, `model`, `usage`.
6. Add → row appears in the web app under in-progress with the *Added from desktop* badge, `source = 'desktop'`, `external_id` populated, USD amounts equal to what the web app would store for the same original amount (compare with a manual entry in the web app at the same rate).
7. Click the same table again within 30 s → "Already added" (no dialog). Wait a minute, click it again → re-entry dialog → **Re-entry** → the web app shows the same row with `entries = 1` and cost doubled; **Ignore** → nothing changes.
8. Click a cash-game table → banner "This doesn't look like a tournament table".
9. Kill the app, relaunch → still signed in (session restored from encrypted store) — on both platforms (`safeStorage` uses Keychain on mac, DPAPI on Windows).
10. Switch the model to Haiku 4.5 in Settings → capture succeeds (no 400 from a stray `effort`); switch to Opus 5 → succeeds.

---

## Phase 2 — Quality of life
- **Auto-refresh in the web app**: subscribe to Supabase Realtime `postgres_changes` on `tournaments` filtered by `user_id` in `useTournamentsStore.initialize()` (Supabase mode only) and call `reload()` on insert/update, so a tournament added from the desktop appears on an open phone/browser without a refresh. Guard with a feature flag in `useAuthStore` settings if it proves noisy.
- **Batch capture**: multi-select several tables → one extraction call per window in parallel (`Promise.allSettled`) → a multi-row review table → one *Add all*.
- **Pre-fill from site preferences**: remember the last used currency per site so `currency: null` extractions default sensibly.
- **Cost meter**: sum `usage` per day in the Settings tab.

## Phase 3 — Finish from the desktop (vision, again)
- Second schema `ResultExtractionSchema = { finishPosition: int|null, fieldSize: int|null, winnings: number|null, currency: enum|null, busted: boolean, confidence, notes }` and a second frozen prompt for bust popups / lobby "You finished 12th" panels / GG result cards.
- `InProgressList.vue` row → *Finish…* → window picker → `captureAndExtractResult` → review → `updateTournament(id, { winnings, original_winnings, finish_position, field_size, cashed: winnings > 0, status: 'completed' })`. Winnings are converted with **today's rate** (`amount / getRate(currency)`) and `exchange_rate` is overwritten with today's rate — this matches the web app's Complete flow, which calls `currencyStore.getCurrentRate()` / `toUSD()` at completion time (`app/pages/tournaments/[id].vue:473-548`) rather than reusing the stored rate.
- "Trust high-confidence" toggle in Settings: when on, a `confidence === 'high'` registration is inserted immediately with a toast that offers *Undo* (delete the row) for 10 s.

## Out of scope (explicitly)
- Hand-history / tournament-summary file parsing, window-title regex extraction, lobby-based re-entry detection (re-entries are recorded by re-capturing the table — see step 1.4), multi-user sharing, code-signing / notarization / auto-update on either platform (unsigned `electron-builder` installers for now — Windows SmartScreen and macOS Gatekeeper will warn on first launch).

## Open questions
None. All product questions were answered on 2026-08-28 (sites, Google sign-in → set-password, local scaffold, re-entry = re-capture).
