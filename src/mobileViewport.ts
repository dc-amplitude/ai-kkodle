import { isMobileImeEnabled } from './lib/deviceInput';

const KEYBOARD_HEIGHT_THRESHOLD = 100;

export function scrollActiveRowIntoView(): void {
  const board = document.querySelector('#board');
  const rows = board?.querySelectorAll('.row');
  if (!rows?.length) return;
  const idx = Math.min(
    rows.length - 1,
    Math.max(0, [...rows].findIndex((r) => r.querySelector('.tile.tbd'))),
  );
  const row = rows[idx] ?? rows[rows.length - 1];
  row?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

export function initMobileViewport(): void {
  const vv = window.visualViewport;
  if (!vv) return;

  const update = (): void => {
    const gap = window.innerHeight - vv.height;
    const nativeOpen = gap > KEYBOARD_HEIGHT_THRESHOLD && isMobileImeEnabled();
    document.documentElement.classList.toggle('native-kb-open', nativeOpen);

    if (nativeOpen) {
      document.documentElement.style.setProperty('--vv-height', `${vv.height}px`);
      document.documentElement.style.setProperty('--vv-offset-top', `${vv.offsetTop}px`);
      scrollActiveRowIntoView();
    } else {
      document.documentElement.style.removeProperty('--vv-height');
      document.documentElement.style.removeProperty('--vv-offset-top');
    }
  };

  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  window.addEventListener('orientationchange', update);
  update();
}
