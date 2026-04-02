import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/theme';

const BAR_COUNT = 32;

interface Props { isPlaying: boolean; height?: number; accent?: string; }

export default function SpectrumBars({ isPlaying, height = 120, accent = COLORS.spectrum }: Props) {
  const bars = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.05))).current;

  useEffect(() => {
    if (!isPlaying) {
      bars.forEach(b => Animated.timing(b, { toValue: 0.03, duration: 600, useNativeDriver: false }).start());
      return;
    }
    const animate = () => {
      const anims = bars.map((b, i) => {
        const w = i < 8 ? 0.9 : i < 16 ? 0.7 : i < 24 ? 0.55 : 0.35;
        return Animated.timing(b, { toValue: 0.1 + Math.random() * w, duration: 70 + Math.random() * 100, useNativeDriver: false });
      });
      Animated.parallel(anims).start();
    };
    animate();
    const iv = setInterval(animate, 120);
    return () => clearInterval(iv);
  }, [isPlaying]);

  return (
    <View style={[styles.wrap, { height }]}>
      {bars.map((b, i) => (
        <Animated.View key={i} style={[styles.bar, {
          backgroundColor: accent,
          height: b.interpolate({ inputRange: [0, 1], outputRange: [2, height] }),
          opacity: b.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.2, 0.5, 0.9] }),
          shadowColor: accent,
          shadowOpacity: 0.4,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, paddingHorizontal: 2 },
  bar: { flex: 1, borderRadius: 3, minWidth: 2 },
});
