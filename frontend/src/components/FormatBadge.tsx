import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface Props { format: string; bitDepth: number; sampleRate: number; compact?: boolean; accent?: string; }

export default function FormatBadge({ format, bitDepth, sampleRate, compact, accent }: Props) {
  const lossless = ['FLAC', 'WAV', 'AIFF', 'ALAC', 'DSD'].includes(format);
  const hiRes = bitDepth >= 24 || sampleRate > 48000;
  const isDSD = format === 'DSD';
  const color = accent || (hiRes ? COLORS.success : lossless ? COLORS.nowPlaying : COLORS.warning);
  const rateLabel = isDSD ? `${(sampleRate / 1000000).toFixed(1)}M` : sampleRate >= 1000 ? `${Math.round(sampleRate / 1000)}k` : `${sampleRate}`;

  if (compact) {
    return (
      <View style={[styles.pill, { borderColor: color + '30', backgroundColor: color + '10' }]}>
        <Text style={[styles.pillText, { color }]}>{format}</Text>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <View style={[styles.pill, { borderColor: color + '30', backgroundColor: color + '10' }]}>
        <Text style={[styles.pillText, { color }]}>{format}</Text>
      </View>
      <Text style={styles.tech}>{isDSD ? rateLabel : `${bitDepth}/${rateLabel}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderRadius: 8 },
  pillText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  tech: { fontFamily: 'monospace', fontSize: 10, color: COLORS.textTertiary },
});
