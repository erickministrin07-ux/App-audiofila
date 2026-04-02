import React, { useRef } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { COLORS } from '../constants/theme';

interface Props { frequency: string; value: number; onChange: (v: number) => void; minDb?: number; maxDb?: number; height?: number; accent?: string; }
const THUMB_H = 16;

export default function EQBand({ frequency, value, onChange, minDb = -12, maxDb = 12, height = 160, accent = COLORS.equalizer }: Props) {
  const range = maxDb - minDb;
  const norm = (value - minDb) / range;
  const centerNorm = (0 - minDb) / range;
  const trackH = height - THUMB_H;
  const thumbBot = norm * trackH;
  const centerBot = centerNorm * trackH;
  const fillBot = Math.min(thumbBot, centerBot);
  const fillH = Math.abs(thumbBot - centerBot);
  const layoutRef = useRef({ h: height });

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => upd(e.nativeEvent.locationY),
    onPanResponderMove: (e) => upd(e.nativeEvent.locationY),
  })).current;

  const upd = (y: number) => {
    const h = layoutRef.current.h;
    const n = 1 - Math.max(0, Math.min(y, h)) / h;
    const db = Math.round((minDb + n * range) * 2) / 2;
    onChange(Math.max(minDb, Math.min(maxDb, db)));
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.db, value !== 0 && { color: accent }]}> 
        {value > 0 ? '+' : ''}{value.toFixed(1)}
      </Text>
      <View style={[styles.track, { height }]} {...pan.panHandlers} onLayout={e => { layoutRef.current.h = e.nativeEvent.layout.height; }}>
        <View style={styles.line} />
        <View style={[styles.center, { bottom: centerBot + THUMB_H / 2 - 1 }]} />
        <View style={[styles.fill, { bottom: fillBot + THUMB_H / 2, height: fillH, backgroundColor: accent }]} />
        <View style={[styles.thumb, { bottom: thumbBot, backgroundColor: accent, shadowColor: accent }]} />
      </View>
      <Text style={styles.freq}>{frequency}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 38 },
  db: { fontFamily: 'monospace', fontSize: 8, color: COLORS.textTertiary, marginBottom: 4, textAlign: 'center', width: 38 },
  track: { width: 38, alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  line: { position: 'absolute', width: 2, top: 0, bottom: 0, left: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1 },
  center: { position: 'absolute', width: 10, height: 1, left: 14, backgroundColor: 'rgba(255,255,255,0.15)' },
  fill: { position: 'absolute', width: 3, left: 17.5, borderRadius: 2 },
  thumb: {
    position: 'absolute', width: THUMB_H, height: THUMB_H, left: 11,
    borderRadius: THUMB_H / 2, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  freq: { fontFamily: 'monospace', fontSize: 7, color: COLORS.textTertiary, marginTop: 4, textAlign: 'center' },
});
