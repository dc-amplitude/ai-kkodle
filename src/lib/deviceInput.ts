/** True when primary pointer is coarse (phones/tablets). */
export function isTouchPrimary(): boolean {
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

let mobileImeEnabled = false;

export function isMobileImeEnabled(): boolean {
  return mobileImeEnabled;
}

export function setMobileImeEnabled(enabled: boolean): void {
  mobileImeEnabled = enabled;
  document.documentElement.classList.toggle('mobile-ime-enabled', enabled);
}

export function applyDeviceClasses(): void {
  document.documentElement.classList.toggle('device-touch', isTouchPrimary());
}

export function shouldUseOnScreenKeyboardPrimary(): boolean {
  return isTouchPrimary() && !mobileImeEnabled;
}

export function shouldAutoFocusGuessInput(): boolean {
  return !isTouchPrimary() || mobileImeEnabled;
}
