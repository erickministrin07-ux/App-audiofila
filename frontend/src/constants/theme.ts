// Ultra-modern glassmorphism theme for audiophile player
export const COLORS = {
  // Base
  background: '#050505',
  // Glass surfaces
  glass: 'rgba(255, 255, 255, 0.04)',
  glassHeavy: 'rgba(10, 10, 15, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderHi: 'rgba(255, 255, 255, 0.15)',
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textTertiary: 'rgba(255, 255, 255, 0.35)',
  textMono: 'rgba(255, 255, 255, 0.8)',
  // Per-section accent colors (vivid rainbow)
  library: '#FF6B6B',
  libraryDim: 'rgba(255, 107, 107, 0.12)',
  libraryGlow: 'rgba(255, 107, 107, 0.25)',
  nowPlaying: '#2D5BFF',
  nowPlayingDim: 'rgba(45, 91, 255, 0.12)',
  nowPlayingGlow: 'rgba(45, 91, 255, 0.25)',
  equalizer: '#CDFF00',
  equalizerDim: 'rgba(205, 255, 0, 0.10)',
  equalizerGlow: 'rgba(205, 255, 0, 0.20)',
  spectrum: '#FF8A00',
  spectrumDim: 'rgba(255, 138, 0, 0.12)',
  spectrumGlow: 'rgba(255, 138, 0, 0.25)',
  settings: '#E0F2FE',
  settingsDim: 'rgba(224, 242, 254, 0.08)',
  settingsGlow: 'rgba(224, 242, 254, 0.15)',
  // Status
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#EF4444',
};

// Shared glass panel style
export const GLASS = {
  backgroundColor: COLORS.glass,
  borderWidth: 1,
  borderColor: COLORS.glassBorder,
  borderRadius: 20,
};

export const GLASS_HEAVY = {
  backgroundColor: COLORS.glassHeavy,
  borderWidth: 1,
  borderColor: COLORS.glassBorderHi,
  borderRadius: 20,
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
  return `${(bytes / 1024).toFixed(0)} KB`;
}
export function isLossless(format: string): boolean { return LOSSLESS_FORMATS.includes(format); }
export function isHiRes(bd: number, sr: number): boolean { return bd >= 24 || sr > 48000; }
