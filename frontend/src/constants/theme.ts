// Fresh Light Theme - Poweramp / USB Audio Player inspired
export const C = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEEF0',
  primary: '#0066FF',
  primaryDim: 'rgba(0, 102, 255, 0.08)',
  primaryBorder: 'rgba(0, 102, 255, 0.18)',
  accent: '#FF5C35',
  accentDim: 'rgba(255, 92, 53, 0.08)',
  text: '#1A1A1E',
  textSec: '#6E6E78',
  textTer: '#AEAEB2',
  border: 'rgba(0, 0, 0, 0.06)',
  borderStrong: 'rgba(0, 0, 0, 0.12)',
  shadow: '#000',
  hiRes: '#00B341',
  hiResBg: 'rgba(0, 179, 65, 0.1)',
  mqa: '#E6A800',
  mqaBg: 'rgba(230, 168, 0, 0.1)',
  dsd: '#8E24AA',
  dsdBg: 'rgba(142, 36, 170, 0.1)',
  lossless: '#0066FF',
  lossy: '#FF9500',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  drawerBg: '#FAFAFE',
  drawerOverlay: 'rgba(0,0,0,0.35)',
};

export const CARD = {
  backgroundColor: C.surface,
  borderRadius: 16,
  padding: 16,
  shadowColor: C.shadow,
  shadowOffset: { width: 0, height: 2 } as any,
  shadowOpacity: 0.04,
  shadowRadius: 10,
  elevation: 2,
};

export const EQ_10_FREQS = ['31', '62', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];
export const EQ_31_FREQS = ['20','25','31','40','50','63','80','100','125','160','200','250','315','400','500','630','800','1k','1.25k','1.6k','2k','2.5k','3.15k','4k','5k','6.3k','8k','10k','12.5k','16k','20k'];
export const SUPPORTED_FORMATS = ['FLAC','DSD','WAV','AIFF','ALAC','MQA','MP3','AAC','OGG','WMA'];

export function formatDuration(s: number): string { const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, '0')}`; }
export function formatSampleRate(hz: number): string { if (hz >= 1000000) return `${(hz / 1000000).toFixed(1)}MHz`; if (hz >= 1000) return `${Math.round(hz / 1000)}kHz`; return `${hz}Hz`; }
export function formatFileSize(b: number): string { if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`; if (b >= 1048576) return `${(b / 1048576).toFixed(0)} MB`; return `${(b / 1024).toFixed(0)} KB`; }
export function isLossless(f: string): boolean { return ['FLAC','DSD','WAV','AIFF','ALAC','MQA'].includes(f); }
export function isHiRes(bd: number, sr: number): boolean { return bd >= 24 || sr > 48000; }
export function isMQA(f: string): boolean { return f === 'MQA'; }
