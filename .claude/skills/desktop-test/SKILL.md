---
name: desktop-test
description: Get the latest poker-wallet-desktop code running as a testable app on macOS in one go - build, install to /Applications, reset the Screen Recording grant, launch - and diagnose "I changed the desktop app but see nothing" (wrong copy running, no permission prompt, badge missing). Use when the user wants to test, run, install, or see a change in the desktop capture app, or says a desktop change is not showing up.
---

# Desktop app: build → install → test (macOS)

The desktop companion lives in `~/Projects/poker-wallet-desktop` (NOT this web repo). Every
rebuild is a new app to macOS (ad-hoc signature), so the Screen Recording grant must be redone
each time. Everything except one Allow click is scripted.

## Do this

1. Run the fast path from the desktop repo:
   ```bash
   cd ~/Projects/poker-wallet-desktop && npm run install:mac
   ```
   It builds, quits every running copy, replaces `/Applications/Poker Wallet.app`, resets the
   stale grant, and launches the app with `open`, logging main-process output to
   `$TMPDIR/poker-wallet-desktop.log`.
2. Tell the user the ONE manual step, exactly this:
   - In the app open the **Capture** tab → macOS asks to record the screen → **Allow**.
   - Quit from the tray icon → reopen from `/Applications` (Spotlight "Poker Wallet").
   - Settings → Screen recording → **Re-check** should say granted. Then capture.
3. After the user captures, verify instead of guessing:
   ```bash
   pgrep -fl "Poker Wallet" | grep -v Helper          # exactly ONE main process, in /Applications
   grep -E "window-match|window-tracker|extract|auto-add" "$TMPDIR/poker-wallet-desktop.log" | tail
   f=$(ls -t ~/Pictures/Poker\ Wallet\ Captures/*.json | head -1); python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print({k:d.get(k) for k in ['source','windowId','action','extractionError']})" "$f"
   pgrep -fl poker-wallet-window-tracker              # running <=> at least one badge exists
   ```

## The three rules (each cost an hour once)

- **Exactly one copy, in `/Applications`.** A `dist/` copy running next to an installed one
  silently fights it for the `Cmd+Shift+C` hotkey and the grant; captures go through whichever
  won - often the OLD build - so "nothing changed". Check with `pgrep` before anything else.
- **Launch with `open`/Spotlight/Dock, never the binary from a terminal.** A terminal-launched
  app never gets the permission prompt (the terminal becomes the responsible process). Use
  `open --stdout FILE --stderr FILE` when you want the log.
- **The grant is per exact build.** After a rebuild the System Settings toggle can show ON while
  the app reports *Denied* - that entry is for the previous build. `tccutil reset ScreenCapture
  com.pokerwallet.desktop`, then let the app ask; do not add it by hand with the + button.

## Symptoms → cause

| Symptom | Cause | Fix |
|---|---|---|
| Capture does nothing, picker grid empty | No Screen Recording grant (titles come back empty, picker hides unnamed windows) | Rule 3 |
| Toggle ON in System Settings but app says Denied | Grant belongs to previous build, or app not restarted after granting | Rule 3, then quit & reopen |
| No permission prompt ever appears | App launched from a terminal, or a second copy is running | Rules 1 & 2 |
| Tournament added but no badge on the table | Sidecar `windowId` is null: hotkey capture could not be matched to a window, or an old build handled it | Read the `[window-match]` log line; try the picker route (it knows its window) |
| Badge exists but wrong place / invisible | Tracker not running, or table covered by another app (badge hides on purpose) | `pgrep -fl poker-wallet-window-tracker`; `POKER_WALLET_BADGE_DEMO=<CGWindowID> npm run dev` to test the overlay alone |

`npm run dev` cannot capture on macOS 15+ (no grantable identity); it is only for renderer UI
work and the badge demo above. Windows has no permission step at all.
