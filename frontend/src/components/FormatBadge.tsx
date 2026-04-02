import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface FormatBadgeProps {
  format: string;
  bitDepth: number;
  sampleRate: number;
  compact?: boolean;
}

export default function FormatBadge({ format, bitDepth, sampleRate, compact }: FormatBadgeProps) {
  const isLossless = ['FLAC', 'WAV', 'AIFF', 'ALAC', 'DSD'].includes(format);
  const isHiRes = bitDepth >= 24 || sampleRate > 48000;
  const isDSD = format === 'DSD';

  const rateLabel = isDSD
    ? `${(sampleRate / 1000000).toFixed(1)}M`
    : sampleRate >= 1000 ? `${Math.round(sampleRate / 1000)}k` : `${sampleRate}`;

  if (compact) {
    return (
      <View style={[styles.badge, isHiRes && styles.badgeHiRes, !isLossless && styles.badgeLossy]}>
        <Text style={[styles.badgeText, isHiRes && styles.textHiRes, !isLossless && styles.textLossy]}>
          {format}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={[styles.badge, isHiRes && styles.badgeHiRes, !isLossless && styles.badgeLossy]}>
        <Text style={[styles.badgeText, isHiRes && styles.textHiRes, !isLossless && styles.textLossy]}>
          {format}
        </Text>
      </View>
      {isDSD ? (
        <Text style={styles.techText}>{rateLabel}</Text>
      ) : (
        <Text style={styles.techText}>{bitDepth}/{rateLabel}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryDim,
    borderRadius: 2,
  },
  badgeHiRes: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  badgeLossy: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  badgeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  textHiRes: { color: COLORS.success },
  textLossy: { color: COLORS.warning },
  techText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
});
