import React, { useRef } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { COLORS } from '../constants/theme';

interface EQBandProps {
  frequency: string;
  value: number;
  onChange: (value: number) => void;
  minDb?: number;
  maxDb?: number;
  height?: number;
}

const THUMB_H = 14;

export default function EQBand({ frequency, value, onChange, minDb = -12, maxDb = 12, height = 160 }: EQBandProps) {
  const range = maxDb - minDb;
  const normalized = (value - minDb) / range;
  const centerNorm = (0 - minDb) / range;
  const trackH = height - THUMB_H;
  const thumbBottom = normalized * trackH;
  const centerBottom = centerNorm * trackH;

  const fillBottom = Math.min(thumbBottom, centerBottom);
  const fillHeight = Math.abs(thumbBottom - centerBottom);

  const layoutRef = useRef({ y: 0, h: height });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const y = evt.nativeEvent.locationY;
        updateFromY(y);
      },
      onPanResponderMove: (evt) => {
        const y = evt.nativeEvent.locationY;
        updateFromY(y);
      },
    })
  ).current;

  const updateFromY = (y: number) => {
    const h = layoutRef.current.h;
    const clamped = Math.max(0, Math.min(y, h));
    const norm = 1 - clamped / h;
    const db = minDb + norm * range;
    const rounded = Math.round(db * 2) / 2;
    onChange(Math.max(minDb, Math.min(maxDb, rounded)));
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.dbLabel, value !== 0 && styles.dbActive]}>
        {value > 0 ? '+' : ''}{value.toFixed(1)}
      </Text>
      <View
        style={[styles.trackOuter, { height }]}
        {...panResponder.panHandlers}
        onLayout={(e) => { layoutRef.current.h = e.nativeEvent.layout.height; }}
      >
        <View style={styles.trackLine} />
        <View style={[styles.centerMark, { bottom: centerBottom + THUMB_H / 2 - 1 }]} />
        <View style={[styles.fill, { bottom: fillBottom + THUMB_H / 2, height: fillHeight }]} />
        <View style={[styles.thumb, { bottom: thumbBottom }]} />
      </View>
      <Text style={styles.freqLabel}>{frequency}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 38 },
  dbLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: COLORS.textDim,
    marginBottom: 4,
    width: 38,
    textAlign: 'center',
  },
  dbActive: { color: COLORS.primary },
  trackOuter: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    width: 2,
    top: 0,
    bottom: 0,
    left: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
  },
  centerMark: {
    position: 'absolute',
    width: 12,
    height: 2,
    left: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  fill: {
    position: 'absolute',
    width: 2,
    left: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: THUMB_H,
    left: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  freqLabel: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: COLORS.textDim,
    marginTop: 4,
    textAlign: 'center',
  },
});
