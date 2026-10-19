# Testing guide

## Principle

Automated tests should behave like a player, not like a unit test of internal state.

- **Assert visible UI**: preview syllable tiles (`#board-preview .tile-syllable`), jamo cells on the active row (`#board-guesses .row .tile-jamo`), status line (`.draft-preview`), inline hints (`#input-message`, `#message`), tile colors after submit (`.correct`, `.present`, `.absent`), and win/lose copy (`.definition`, `.fail`).
- **Simulate real input paths**: DOM `compositionstart` / `compositionupdate` / `compositionend` + `input` with `isComposing`, Chromium CDP `Input.imeSetComposition`, on-screen jamo keys, QWERTY-to-Hangul in the text field, backspace, and Enter/submit.
- **Do not** rely on private JS variables, draft buffers, or “handler ran” unless there is no visible effect.

When a regression would *look* broken to the user but tests still pass, add or tighten a journey test before fixing the bug.

## Commands

```bash
npm test          # Vitest unit tests
npm run build     # Typecheck + production bundle
npm run test:e2e  # Playwright (starts preview on :4173)
```

E2E uses `http://127.0.0.1:4173/ai-kkodle/` (production build). Daily puzzle content depends on Seoul calendar date; journey tests that need a fixed word use practice mode (`?mode=practice&practiceSeed=…`) or the documented daily word for the test fixture date.

## E2E layout

| File | Role |
|------|------|
| `e2e/user-journey.spec.ts` | End-to-end typing journeys and visible board state (IME mid-composition, jamo keyboard, QWERTY, backspace, win/lose). |
| `e2e/ime.spec.ts` | IME invariants (no input rewrite mid-compose) and Chromium CDP / WebKit composition. |
| `e2e/play.spec.ts` | Shell UX: how-to, hints, keyboard presence, smoke submit. |
| `e2e/mobile.spec.ts` | Touch-primary on-screen keyboard (Pixel / iPhone projects). |
| `e2e/scripts.spec.ts` | Korean vs English puzzle scripts. |
| `e2e/board-layout.spec.ts` | Preview / syllable layout. |
| `e2e/success-screen.spec.ts` | Win screen content snapshot. |

## Manual QA checklist (real devices)

Run a production or preview build on hardware you care about.

### Desktop (Chrome, Edge, Safari) — Korean IME

1. Open the game, focus the guess field, switch to Korean IME.
2. Type a two-syllable word slowly; while the **second** syllable is still underlined (composing), confirm the **top preview** shows both syllables and the **jamo row** matches, and `.draft-preview` counts match what you see in the field.
3. Finish composition; confirm the field value is unchanged except for normal IME commit and submit works.
4. Type via QWERTY (`ghksrkr` → `환각` on the daily word length); confirm conversion message and preview.
5. Win once and lose once (wrong guesses until game over); confirm colors and result copy.

### Android (Gboard or Samsung keyboard)

1. Use “휴대폰 키보드로 입력” if the on-screen jamo keyboard is primary.
2. Type syllable-by-syllable; after each syllable commits, preview and jamo row should update **before** you start the next syllable.
3. Backspace mid-word; preview and row should step back visibly.
4. Submit a full guess; no jamo-length error when syllable count matches the puzzle.

### iOS (Safari)

1. Repeat Korean IME mid-composition preview check (step 2 above).
2. Confirm no focus trap between board tap and input.

## What automation does not cover well

| Gap | Why |
|-----|-----|
| Real macOS / Windows IME drivers | Playwright synthesizes DOM/CDP events; OS composition timing can differ slightly. |
| Physical Gboard key caps and autocorrect | We simulate `input` / composition events, not the full keyboard app. |
| Safari desktop vs iOS WebKit differences | Only selected WebKit projects run in CI. |
| Session replay / analytics | Not asserted in E2E. |
| Amplitude experiment variants | Flags may differ in production; E2E uses default local flags unless stubbed. |

Treat the manual checklist as required before large input-handling changes ship.
