# Puzzle content style guide

Editorial rules for `scripts/puzzle-catalog.mjs`, `scripts/english-catalog.mjs`, and generated `data/puzzles.json`.

## Fields

| Field | Rule |
|-------|------|
| `word` | Exact answer string. `en`: A–Z only. `ko`: standard Korean spelling. |
| `script` | `ko` or `en` (set at build for Korean catalog). |
| `definition` | **One line**, plain Korean. What it means in AI/IT—not how to play. |
| `usage` | One or two sentences: how teams use the term **today** (products, APIs, ops). |
| `example` | Starts with **`예:`** then one **natural** sentence. |
| `startingHint` | Free hint; **must not** contain the answer (any casing) or spoil the word. |
| `etymology` | Only if **verifiable** from dictionaries, encyclopedias, or official naming docs. Otherwise write **`설이 있음`** or omit detail and state the documented part only. |
| `sources` | **1–2 HTTPS URLs** used to verify meaning and etymology (Wikipedia, Wiktionary, official docs, standards). |

## Examples

- **Korean entry (`script: ko`):** Example sentence is **Korean**. Product names, acronyms, and API paths in Latin are fine (`GPT`, `/v1/chat`, `JSON`).
- **English entry (`script: en`):** Example may be English (or mixed) because the answer is Latin letters.

Bad (ko): `예: The prompt used 1,200 tokens.`  
Good (ko): `예: 긴 문서는 토큰 한도 때문에 잘라서 넣었다.`

## Etymology

- Prefer named sources: paper title + year, company announcement, Greek/Latin roots from Wiktionary.
- Do **not** invent folk etymology or unsourced “~라고 알려짐” unless the `sources` link states it.
- Typos and garbled glosses (e.g. stray English fragments in Korean glosses) are not allowed.

## Workflow

1. Edit catalog `.mjs` files and/or `scripts/puzzle-sources.mjs`.
2. `node scripts/build-puzzles.mjs` — validates content and writes `data/puzzles.json`.
3. `node scripts/export-terms-csv.mjs` — refreshes review CSV under `/cursor/stores/self/handoff/`.
4. `npm test` — includes `puzzle-content.test.ts` content checks.
