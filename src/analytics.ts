import * as amplitude from '@amplitude/analytics-browser';
import { Identify } from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';

type EventProps = Record<string, string | number | boolean | undefined>;

let ready = false;

export async function initAnalytics(): Promise<void> {
  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY?.trim();
  if (!apiKey) {
    console.info('[analytics] VITE_AMPLITUDE_API_KEY 없음 — 이벤트 전송 생략');
    return;
  }

  amplitude.add(
    sessionReplayPlugin({
      sampleRate: 1,
      privacyConfig: { defaultMaskLevel: 'conservative' },
    }),
  );
  amplitude.init(apiKey, undefined, {
    autocapture: false,
    defaultTracking: false,
  });
  ready = true;
}

export function track(event: string, props?: EventProps): void {
  if (!ready) return;
  amplitude.track(event, props);
}

export function setUserProps(props: EventProps): void {
  if (!ready) return;
  const identify = new Identify();
  Object.entries(props).forEach(([k, v]) => {
    if (v !== undefined) identify.set(k, v);
  });
  amplitude.identify(identify);
}
