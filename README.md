# AI 제품 꼬들 (자모 Wordle)

**AI·IT 용어**를 **자모(초성·중성·종성) 단위**로 맞히며 뜻·쓰임·예문·어원을 배우는 무료 브라우저 게임입니다. AI에 관심 있는 누구나 즐길 수 있도록, 생성 AI 용어와 그를 이해하는 데 필요한 IT 기초 용어를 다룹니다. Amplitude Analytics, Session Replay, Experiment 데모에도 사용할 수 있습니다.

> **이름 제안 (아직 변경하지 않음):** 공개 제품으로 키울 때는 **「AI 어휘 꼬들」**, **「자모 AI 사전 퀴즈」**, **「Hangul AI Lexicon」** 같은 이름이 PM/PO 한정 느낌을 줄이고 범위를 분명히 합니다.

## 로컬 실행

```bash
npm install
cp .env.example .env   # 선택 — 키 없이도 플레이 가능
npm run dev
```

```bash
npm run build    # 프로덕션 빌드
npm run preview  # dist 미리보기
npm test         # 자모·퍼즐·콘텐츠 품질 테스트
npm run test:e2e # Playwright
```

## 자모 길이 설계 (variable-length)

한글 단어는 음절 수와 관계없이 **자모 개수가 달라집니다**. **정답 단어마다 자모 칸 수가 정해지는 가변 보드**를 사용합니다.

**자모 셈 규칙 (`es-hangul` `disassemble` — 정답·추측 동일):**

| 경우 | 예 | 자모 칸 |
|------|-----|--------|
| 일반 음절 | `토` | ㅌ·ㅗ |
| `disassemble`이 쪼개는 모음 | `회` | ㅎ·**ㅗ·ㅣ** (3칸) |
| 겹받침 | `값` | ㄱ·ㅏ·ㅂ·ㅅ |

플레이어는 **자모 칸 수를 채운 뒤 제출**하거나 **음절 수가 맞는 한글 단어**를 IME로 입력합니다 (**아무 단어나 입력 가능**).

**힌트:** **시작 힌트**(`startingHint`)는 정답 단어를 직접 드러내지 않는 단서입니다. 맞히면 **의미·쓰임·예문·어원**을 볼 수 있습니다. 💡 버튼으로 자모·첫 음절 힌트 2개를 더 받을 수 있으며, 데일리 모드에서는 Experiment `hint_after_attempt` 이후에 추가 힌트 버튼이 열립니다.

## 게임 모드

| 모드 | 설명 |
|------|------|
| **데일리** | Asia/Seoul 달력 날짜 기준 전 세계 동일 퍼즐. `date` 필드가 있으면 해당일 우선, 없으면 앵커(2025-01-01 KST)부터 로테이션. |
| **연습** | 무제한. 「새 단어」로 다른 시드. 기본 난이도는 **2–3음절** 단어만. |

## 퍼즐 데이터 — 형식과 추가 방법

**소스:** `scripts/puzzle-catalog.mjs` (편집) → `node scripts/build-puzzles.mjs` → `data/puzzles.json` (빌드 결과)

각 항목 필드:

| 필드 | 설명 |
|------|------|
| `word` | 정답 한글 단어 |
| `category` | `ai` \| `it-foundation` |
| `definition` | 한 줄 의미 |
| `usage` | AI/IT 현장에서 어떻게 쓰이는지 |
| `example` | `예:`로 시작하는 짧은 예문 |
| `startingHint` | 시작 힌트 (**정답 단어·부분 문자열 포함 금지**) |
| `etymology` | 어원 (영어·그리스·라틴·인명 등) |
| `origin` | `loanword` \| `korean` |
| `englishSource` | loanword일 때 영어 표기 |
| `date` | (선택) `YYYY-MM-DD` 서울 기준 **데일리 고정일** |

### 새 용어 추가

1. `scripts/puzzle-catalog.mjs`의 `PUZZLE_CATALOG` 배열에 객체를 추가합니다.
2. `node scripts/build-puzzles.mjs`로 검증 후 `data/puzzles.json`을 재생성합니다.
3. `npm test` — `puzzle-content.test.ts`가 필수 필드·게임 자기 언급·startingHint 규칙을 검사합니다.

### 특정 날짜 데일리 지정

한 항목에만 `"date": "2026-10-15"`처럼 넣습니다. **날짜는 항목당 최대 하나**, 중복 날짜는 빌드 스크립트에서 거부하도록 운영하세요. `date`가 없는 항목만 로테이션 풀에 들어갑니다.

## Amplitude 설정

| 변수 | 용도 |
|------|------|
| `VITE_AMPLITUDE_API_KEY` | Analytics + Session Replay |
| `VITE_AMPLITUDE_DEPLOYMENT_KEY` | Experiment 배포 키 |
| `VITE_BASE_PATH` | GitHub Pages 경로 (Actions 빌드 기본 `/ai-kkodle/`) |

키가 없으면 SDK 초기화를 건너뛰고 게임은 정상 동작합니다.

### GitHub Secrets (Actions 빌드용)

Repository → Settings → Secrets and variables → Actions:

- `VITE_AMPLITUDE_API_KEY`
- `VITE_AMPLITUDE_DEPLOYMENT_KEY`

선택 **Repository variable**: `VITE_BASE_PATH` — 로컬 `/`, Pages `/ai-kkodle/`

## 이벤트 taxonomy

| 이벤트 | 주요 properties |
|--------|------------------|
| `game_start` | `mode`, `puzzle_id`, `jamo_count`, `seoul_date`, `max_attempts`, `starting_hint` |
| `guess_submitted` | `mode`, `attempt`, `jamo_count`, `correct_jamos` |
| `hint_used` | `hint_level` (2–3), `paid_hints_revealed`, … |
| `how_to_play_opened` | `source`, `mode` |

## 배포

`main` push 시 GitHub Actions → GitHub Pages (`/.github/workflows/deploy-pages.yml`).
