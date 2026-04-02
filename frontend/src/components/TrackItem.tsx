import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, formatDuration } from '../constants/theme';
import FormatBadge from './FormatBadge';
import { Song } from '../context/PlayerContext';

interface TrackItemProps {
  song: Song;
  isActive?: boolean;
  isPlaying?: boolean;
  onPress: () => void;
  index?: number;
}

export default function TrackItem({ song, isActive, isPlaying, onPress, index }: TrackItemProps) {
  return (
    <TouchableOpacity
      testID={`track-item-${song.id}`}
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        {isActive && isPlaying ? (
          <View style={styles.playingIcon}>
            <Ionicons name="volume-high" size={18} color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.indexBox}>
            <Text style={styles.indexText}>{index !== undefined ? index + 1 : song.track_number}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.title, isActive && styles.activeTitle]} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {song.artist} — {song.album}
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <FormatBadge format={song.format} bitDepth={song.bit_depth} sampleRate={song.sample_rate} compact />
        <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  activeContainer: {
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  indexBox: { width: 28, alignItems: 'center' },
  indexText: { fontFamily: 'monospace', fontSize: 12, color: COLORS.textDim },
  playingIcon: { width: 28, alignItems: 'center' },
  info: { flex: 1, marginLeft: 10 },
  title: { fontSize: 14, fontWeight: '500', color: COLORS.textMain, marginBottom: 2 },
  activeTitle: { color: COLORS.primary },
  subtitle: { fontSize: 12, color: COLORS.textMuted },
  rightSection: { alignItems: 'flex-end', gap: 4 },
  duration: { fontFamily: 'monospace', fontSize: 11, color: COLORS.textDim },
});
