export const COLORS = {
  background: '#0A0A0A',
  surface: '#121212',
  surfaceHover: '#1C1C1E',
  surfaceLight: '#1E1E22',
  primary: '#06B6D4',
  primaryHover: '#0891B2',
  primaryDim: 'rgba(6, 182, 212, 0.15)',
  primaryBorder: 'rgba(6, 182, 212, 0.3)',
  textMain: '#FFFFFF',
  textMuted: '#A1A1AA',
  textDim: '#71717A',
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  touchMin: 44,
  borderRadius: 2,
};

export const FONTS = {
  bold: '700' as const,
  semibold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
};

export const EQ_10_FREQS = ['31', '62', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

export const EQ_31_FREQS = [
  '20', '25', '31', '40', '50', '63', '80', '100', '125', '160',
  '200', '250', '315', '400', '500', '630', '800', '1k', '1.25k', '1.6k',
  '2k', '2.5k', '3.15k', '4k', '5k', '6.3k', '8k', '10k', '12.5k', '16k', '20k'
];

export const SUPPORTED_FORMATS = ['FLAC', 'DSD', 'WAV', 'AIFF', 'ALAC', 'MP3', 'AAC', 'OGG', 'WMA'];

export const LOSSLESS_FORMATS = ['FLAC', 'DSD', 'WAV', 'AIFF', 'ALAC'];

export function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function formatSampleRate(hz: number): string {
  if (hz >= 1000000) return `${(hz / 1000000).toFixed(1)}MHz`;
  if (hz >= 1000) return `${Math.round(hz / 1000)}kHz`;
  return `${hz}Hz`;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function isLossless(format: string): boolean {
  return LOSSLESS_FORMATS.includes(format);
}

export function isHiRes(bitDepth: number, sampleRate: number): boolean {
  return bitDepth >= 24 || sampleRate > 48000;
}
