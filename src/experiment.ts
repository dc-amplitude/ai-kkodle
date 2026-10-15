import { Experiment, type ExperimentClient } from '@amplitude/experiment-js-client';

export type DifficultyTier = 'easy' | 'normal' | 'hard';

export type GameFlags = {
  maxAttempts: number;
  hintAfterAttempt: number;
  shareTitle: string;
  shareSuffix: string;
  difficultyLabel: string;
  difficultyTier: DifficultyTier;
};

const DEFAULTS: GameFlags = {
  maxAttempts: 6,
  hintAfterAttempt: 3,
  shareTitle: 'AI 제품 꼬들',
  shareSuffix: 'AI·IT 용어 자모 퀴즈',
  difficultyLabel: '보통',
  difficultyTier: 'normal',
};

let flags: GameFlags = { ...DEFAULTS };
let client: ExperimentClient | null = null;

export function getFlags(): GameFlags {
  return flags;
}

export async function initExperiments(): Promise<GameFlags> {
  const deploymentKey = import.meta.env.VITE_AMPLITUDE_DEPLOYMENT_KEY?.trim();
  if (!deploymentKey) {
    console.info('[experiment] VITE_AMPLITUDE_DEPLOYMENT_KEY 없음 — 기본값 사용');
    return flags;
  }

  try {
    client = Experiment.initializeWithAmplitudeAnalytics(deploymentKey);
    await client.fetch();
    flags = {
      maxAttempts: client.variant('max_attempts').value === '5' ? 5 : 6,
      hintAfterAttempt:
        client.variant('hint_after_attempt').value === '2'
          ? 2
          : client.variant('hint_after_attempt').value === '4'
            ? 4
            : 3,
      shareTitle:
        client.variant('share_title').value === 'wave'
          ? 'Wave × Amplitude AI 꼬들'
          : DEFAULTS.shareTitle,
      shareSuffix:
        client.variant('share_copy').value === 'short'
          ? '오늘도 한 판!'
          : DEFAULTS.shareSuffix,
      difficultyLabel:
        client.variant('difficulty').value === 'hard'
          ? '어려움'
          : client.variant('difficulty').value === 'easy'
            ? '쉬움'
            : DEFAULTS.difficultyLabel,
      difficultyTier:
        client.variant('difficulty').value === 'hard'
          ? 'hard'
          : client.variant('difficulty').value === 'easy'
            ? 'easy'
            : 'normal',
    };
  } catch (e) {
    console.warn('[experiment] 플래그 로드 실패, 기본값 사용', e);
    flags = { ...DEFAULTS };
  }

  return flags;
}

export function exposure(flagKey: string): void {
  client?.exposure(flagKey);
}
