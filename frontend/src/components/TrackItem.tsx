import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, formatDuration } from '../constants/theme';
import FormatBadge from './FormatBadge';
import { Song } from '../context/PlayerContext';

interface Props { song: Song; isActive?: boolean; isPlaying?: boolean; onPress: () => void; index?: number; accent?: string; }

export default function TrackItem({ song, isActive, isPlaying, onPress, index, accent = COLORS.library }: Props) {
  return (
    <TouchableOpacity testID={`track-item-${song.id}`} style={[styles.container, isActive && { backgroundColor: accent + '08' }]} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.left}>
        {isActive && isPlaying ? (
          <View style={[styles.iconBox, { backgroundColor: accent + '18' }]}>
            <Ionicons name="volume-high" size={16} color={accent} />
          </View>
        ) : (
          <View style={styles.iconBox}>
            <Text style={styles.idx}>{(index !== undefined ? index + 1 : song.track_number).toString().padStart(2, '0')}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.title, isActive && { color: accent }]} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.sub} numberOfLines={1}>{song.artist}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <FormatBadge format={song.format} bitDepth={song.bit_depth} sampleRate={song.sample_rate} compact accent={accent} />
        <Text style={styles.dur}>{formatDuration(song.duration)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  iconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  idx: { fontFamily: 'monospace', fontSize: 11, color: COLORS.textTertiary },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 2 },
  sub: { fontSize: 11, color: COLORS.textTertiary },
  right: { alignItems: 'flex-end', gap: 4 },
  dur: { fontFamily: 'monospace', fontSize: 10, color: COLORS.textTertiary },
});
