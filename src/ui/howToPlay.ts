const HOW_TO_PLAY_SEEN_KEY = 'ai-jamo-how-to-play-seen';

export type HowToPlaySource = 'auto' | 'help_button';

let overlayRoot: HTMLDivElement | null = null;
let visible = false;

export function hasSeenHowToPlay(): boolean {
  try {
    return localStorage.getItem(HOW_TO_PLAY_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markHowToPlaySeen(): void {
  try {
    localStorage.setItem(HOW_TO_PLAY_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isHowToPlayVisible(): boolean {
  return visible;
}

function exampleRowHtml(): string {
  return `
    <div class="howto-example" aria-hidden="true">
      <p class="howto-example-label">예시 (정답 <strong>퍼널</strong> · 추측 <strong>터널</strong>)</p>
      <div class="row howto-row">
        <div class="tile absent" title="회색: 정답 단어에 없음">ㅌ</div>
        <div class="tile correct" title="초록: 자리·자모 모두 맞음">ㅓ</div>
        <div class="tile present" title="노랑: 단어에 있으나 다른 칸">ㄹ</div>
        <div class="tile correct" title="초록">ㅓ</div>
        <div class="tile present" title="노랑">ㄴ</div>
      </div>
      <ul class="howto-legend">
        <li><span class="swatch correct"></span> 초록 — 자모·위치 모두 정답</li>
        <li><span class="swatch present"></span> 노랑 — 정답 단어에 있으나 다른 칸</li>
        <li><span class="swatch absent"></span> 회색 — 정답 단어에 없음</li>
      </ul>
    </div>`;
}

function modalHtml(maxAttempts: number): string {
  return `
    <div class="howto-dialog" role="dialog" aria-modal="true" aria-labelledby="howto-title">
      <h2 id="howto-title">게임 방법</h2>
      <ol class="howto-steps">
        <li>오늘의 <strong>AI·제품 용어</strong>를 <strong>${maxAttempts}번</strong> 안에 맞혀 보세요.</li>
        <li>화면에 표시된 <strong>글자 수(음절)</strong>와 같은 한글 단어를 입력합니다. <strong>아무 단어나 입력 가능</strong>합니다. (자모 키보드 또는 한글 IME)</li>
        <li>입력한 단어는 <strong>자모 칸</strong>으로 나뉘어 표시됩니다. 글자 수가 다르면 제출할 수 없어요.</li>
        <li>게임 시작 시 <strong>뜻 힌트(시작 힌트)</strong>가 미리 공개됩니다. 💡 버튼으로 자모·첫 음절 힌트를 더 받을 수 있어요.</li>
        <li>제출 후 타일 색으로 맞춤 정도를 확인합니다. 맞히면 정답의 뜻이 공개됩니다. <strong>연습</strong> 모드는 무제한입니다.</li>
      </ol>
      ${exampleRowHtml()}
      <button type="button" class="howto-close" id="howto-close">시작하기</button>
    </div>`;
}

export function openHowToPlay(
  maxAttempts: number,
  source: HowToPlaySource,
  onOpened: (source: HowToPlaySource) => void,
): void {
  if (!overlayRoot) {
    overlayRoot = document.createElement('div');
    overlayRoot.id = 'howto-overlay';
    overlayRoot.className = 'howto-overlay hidden';
    document.body.appendChild(overlayRoot);

    overlayRoot.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'howto-overlay' || target.closest('#howto-close')) {
        closeHowToPlay();
      }
    });
  }

  overlayRoot.innerHTML = modalHtml(maxAttempts);
  overlayRoot.classList.remove('hidden');
  visible = true;
  onOpened(source);
  overlayRoot.querySelector<HTMLButtonElement>('#howto-close')?.focus();
}

export function closeHowToPlay(): void {
  if (!overlayRoot) return;
  overlayRoot.classList.add('hidden');
  visible = false;
  markHowToPlaySeen();
}
