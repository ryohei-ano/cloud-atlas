import type { Theme } from '@/types';

export const THEMES: readonly Theme[] = [
  { name: 'ポカリブルー', backgroundColor: '#265CAC', textColor: '#ffffff' },
  { name: '蛍光緑', backgroundColor: '#00ff00', textColor: '#000000' },
  { name: 'ホワイト', backgroundColor: '#ffffff', textColor: '#000000' },
  { name: 'ブラック', backgroundColor: '#000000', textColor: '#ffffff' },
] as const;

export const ANONYMOUS_USER_ID = 'anonymous';

export const MAX_DISPLAYED_MEMORIES = 50;
export const MAX_ANIMATION_DELAY = 100;
export const MEMORY_REFRESH_INTERVAL = 15000;
export const MAX_MEMORY_LENGTH = 500;
export const MIN_MEMORY_LENGTH = 1;

export const VIDEO_FILES = Array.from(
  { length: 12 },
  (_, i) => `/video/${String(i + 1).padStart(2, '0')}.mp4`
);
