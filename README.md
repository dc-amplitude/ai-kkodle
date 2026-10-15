# AI 제품 꼬들 (자모 Wordle)

주니어 PM·PO·AI 제품 용어를 **자모(초성·중성·종성) 단위**로 맞히는 무료 브라우저 게임입니다. Amplitude Analytics, Session Replay, Experiment(Wave Opportunities) 데모용으로 만들었습니다.

## 로컬 실행

```bash
npm install
cp .env.example .env   # 선택 — 키 없이도 플레이 가능
npm run dev
```

```bash
npm run build    # 프로덕션 빌드
npm run preview  # dist 미리보기
npm test         # 자모·데일리 퍼즐 테스트
```

## 자모 길이 설계 (variable-length)

한글 단어는 음절 수와 관계없이 **자모 개수가 달라집니다** (예: `퍼널` → 5자모). 고정 7칸 같은 영어 Wordle 방식은 한국어에 맞지 않아, **정답 단어마다 자모 칸 수가 정해지는 가변 보드**를 사용합니다. 플레이어는 **음절 수가 정답과 같은 한글 단어**를 입력하면, 내부에서 `es-hangul`로 분해해 칸마다 Wordle 규칙(초록/노랑/회색)을 적용합니다.

## 게임 모드

| 모드 | 설명 |
|------|------|
| **데일리** | Asia/Seoul 달력 날짜 기준 전 세계 동일 퍼즐. `data/puzzles.json`에 `date`가 있으면 해당일 우선, 없으면 앵커(2025-01-01 KST)부터 로테이션. |
| **연습** | 무제한. 「새 단어」로 다른 시드 단어. |

- **연속 기록(streak)**: `localStorage`, 데일리 성공 시만 서울 날짜 기준 갱신.
- **공유**: 스포일러 없이 🟩🟨⬜ 그리드만 (클립보드 / Web Share API).

## 퍼즐 데이터

`data/puzzles.json` — `{ "word", "definition", "date?" }`. 시드 데이터만 포함(고객 데이터 없음).

## Amplitude 설정

| 변수 | 용도 |
|------|------|
| `VITE_AMPLITUDE_API_KEY` | Analytics + Session Replay |
| `VITE_AMPLITUDE_DEPLOYMENT_KEY` | Experiment 배포 키 |
| `VITE_BASE_PATH` | GitHub Pages 경로 (Actions 빌드 기본 `/ai-kkodle/`, 로컬 dev는 `/`) |

키가 없으면 SDK 초기화를 건너뛰고 게임은 정상 동작합니다.

### GitHub Secrets (Actions 빌드용)

Repository → Settings → Secrets and variables → Actions:

- `VITE_AMPLITUDE_API_KEY`
- `VITE_AMPLITUDE_DEPLOYMENT_KEY`

선택 **Repository variable**:

- `VITE_BASE_PATH` — 로컬은 `/`, GitHub Actions 빌드 기본값은 `/ai-kkodle/` (Pages: `https://dc-amplitude.github.io/ai-kkodle/`)

## 이벤트 taxonomy

| 이벤트 | 주요 properties |
|--------|------------------|
| `game_start` | `mode`, `puzzle_id`, `jamo_count`, `seoul_date`, `max_attempts` |
| `guess_submitted` | `mode`, `attempt`, `jamo_count`, `correct_jamos` |
| `guess_rejected` | `reason`, `mode` |
| `hint_used` | `mode`, `after_attempt`, `flag_hint_after` |
| `game_complete` | `mode`, `success`, `attempts`, `puzzle_id` |
| `share_clicked` | `mode`, `success`, `attempts` |
| `streak_day` | `streak_count`, `seoul_date`, `already_played` |
| `mode_switched` | `from`, `to` |

Session Replay: `privacyConfig.defaultMaskLevel: 'conservative'` (입력 마스킹 강화).

## Experiment 플래그

| Flag key | Variants | 기본값 | 효과 |
|----------|----------|--------|------|
| `max_attempts` | `6`, `5` | 6 | 최대 시도 횟수 |
| `hint_after_attempt` | `2`, `3`, `4` | 3 | N번째 오답 시 첫 자모 힌트 |
| `share_title` | `default`, `wave` | `AI 제품 꼬들` | 공유 제목 |
| `share_copy` | `default`, `short` | 긴 부제 | 공유 문구 |
| `difficulty` | `easy`, `default`, `hard` | 보통 | UI 난이도 라벨 |

플래그 fetch 실패 시 위 기본값 사용. `exposure()`는 힌트·모드 전환·공유 시 호출.

## GitHub Pages 배포

1. GitHub에 **새 저장소** 생성 후 이 프로젝트 push.
2. **Settings → Pages → Build and deployment**: Source = **GitHub Actions**.
3. Secrets/variables 설정 (위 참고).
4. `main`에 push/merge 시 `.github/workflows/deploy-pages.yml`이 `dist` 배포.

### 기존 Cursor 프로젝트에서 GitHub로 옮기기

```bash
git remote add github https://github.com/dc-amplitude/ai-kkodle.git
git push -u github main
```

이 저장소 Pages URL: `https://dc-amplitude.github.io/ai-kkodle/` (Actions가 `VITE_BASE_PATH=/ai-kkodle/`로 빌드).

## 기술 스택

Vite · TypeScript · es-hangul · @amplitude/analytics-browser · session-replay plugin · experiment-js-client

## 라이선스

MIT — 데모·학습용 시드 콘텐츠.
