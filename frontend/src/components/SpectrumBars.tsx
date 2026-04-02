import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/theme';

const BAR_COUNT = 32;

interface SpectrumBarsProps {
  isPlaying: boolean;
  height?: number;
  barColor?: string;
}

export default function SpectrumBars({ isPlaying, height = 120, barColor }: SpectrumBarsProps) {
  const bars = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.05))).current;

  useEffect(() => {
    if (!isPlaying) {
      bars.forEach(bar => {
        Animated.timing(bar, { toValue: 0.05, duration: 500, useNativeDriver: false }).start();
      });
      return;
    }

    const animate = () => {
      const animations = bars.map((bar, i) => {
        const bassWeight = i < 8 ? 0.85 : i < 16 ? 0.7 : i < 24 ? 0.55 : 0.4;
        const variation = 0.15 + Math.random() * bassWeight;
        return Animated.timing(bar, {
          toValue: variation,
          duration: 80 + Math.random() * 120,
          useNativeDriver: false,
        });
      });
      Animated.parallel(animations).start();
    };

    animate();
    const interval = setInterval(animate, 130);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const color = barColor || COLORS.primary;

  return (
    <View style={[styles.container, { height }]}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: bar.interpolate({
                inputRange: [0, 1],
                outputRange: [2, height],
              }),
              opacity: bar.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0.3, 0.7, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 2,
    paddingHorizontal: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 1,
    minWidth: 2,
  },
});
