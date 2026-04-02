import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  accent: string;
  glowColor: string;
}

export default function GlassBackground({ accent, glowColor }: Props) {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <View style={[styles.blob1, { backgroundColor: glowColor }]} />
      <View style={[styles.blob2, { backgroundColor: accent + '12' }]} />
      <View style={[styles.blob3, { backgroundColor: glowColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -80,
    right: -60,
  },
  blob2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: 120,
    left: -70,
  },
  blob3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: '40%',
    right: -40,
    opacity: 0.6,
  },
});
