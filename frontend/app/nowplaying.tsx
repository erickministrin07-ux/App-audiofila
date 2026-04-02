import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, formatDuration, formatSampleRate, formatFileSize, isLossless, isHiRes } from '../src/constants/theme';
import { usePlayer } from '../src/context/PlayerContext';
import FormatBadge from '../src/components/FormatBadge';
import SpectrumBars from '../src/components/SpectrumBars';

const { width: SCREEN_W } = Dimensions.get('window');

export default function NowPlayingScreen() {
  const {
    currentTrack, isPlaying, currentPosition, repeatMode, shuffle,
    togglePlay, nextTrack, prevTrack, seekTo, setRepeatMode, toggleShuffle,
  } = usePlayer();

  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const progressRef = useRef<View>(null);
  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  const progressPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleSeek(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => handleSeek(evt.nativeEvent.locationX),
    })
  ).current;

  const handleSeek = (x: number) => {
    if (!currentTrack) return;
    const barW = SCREEN_W - 48;
    const ratio = Math.max(0, Math.min(1, x / barW));
    seekTo(Math.floor(ratio * currentTrack.duration));
  };

  const handleAnalyze = async () => {
    if (!currentTrack) return;
    setAnalyzing(true);
    try {
      const r = await fetch(`${API_URL}/api/songs/${currentTrack.id}/analyze`);
      setAnalysisData(await r.json());
      setShowAnalysis(true);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  const cycleRepeat = () => {
    const modes: ('off' | 'one' | 'all')[] = ['off', 'all', 'one'];
    const idx = modes.indexOf(repeatMode);
    setRepeatMode(modes[(idx + 1) % 3]);
  };

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Ionicons name="disc-outline" size={64} color={COLORS.textDim} />
          <Text style={styles.emptyTitle}>SIN REPRODUCCION</Text>
          <Text style={styles.emptySubtitle}>Selecciona una pista desde la biblioteca</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = currentTrack.duration > 0 ? currentPosition / currentTrack.duration : 0;
  const isDSD = currentTrack.format === 'DSD';
  const lossless = isLossless(currentTrack.format);
  const hiRes = isHiRes(currentTrack.bit_depth, currentTrack.sample_rate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.scrollContent}>
        {/* Album Art Area */}
        <View style={styles.artContainer}>
          <View style={styles.albumArt}>
            <Ionicons name="disc" size={80} color={COLORS.primary} />
            <Text style={styles.artFormatLabel}>{currentTrack.format}</Text>
          </View>
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrack.artist} — {currentTrack.album}
          </Text>

          {/* Tech Readout */}
          <View style={styles.techRow}>
            <FormatBadge format={currentTrack.format} bitDepth={currentTrack.bit_depth} sampleRate={currentTrack.sample_rate} />
            {lossless && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>LOSSLESS</Text>
              </View>
            )}
            {hiRes && (
              <View style={[styles.tagBadge, styles.tagHiRes]}>
                <Text style={[styles.tagText, styles.tagTextHiRes]}>HI-RES</Text>
              </View>
            )}
          </View>
          <Text style={styles.techDetail}>
            {isDSD ? `DSD${Math.round(currentTrack.sample_rate / 44100)}` : `${currentTrack.bit_depth}bit`}
            {' / '}
            {formatSampleRate(currentTrack.sample_rate)}
            {' / '}
            {currentTrack.bitrate}kbps
            {' / '}
            {formatFileSize(currentTrack.file_size)}
          </Text>
        </View>

        {/* Mini Spectrum */}
        <View style={styles.spectrumContainer}>
          <SpectrumBars isPlaying={isPlaying} height={50} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar} ref={progressRef} {...progressPan.panHandlers}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatDuration(currentPosition)}</Text>
            <Text style={styles.timeText}>{formatDuration(currentTrack.duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity testID="shuffle-btn" onPress={toggleShuffle} style={styles.controlBtn}>
            <Ionicons name="shuffle" size={22} color={shuffle ? COLORS.primary : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity testID="prev-btn" onPress={prevTrack} style={styles.controlBtn}>
            <Ionicons name="play-skip-back" size={28} color={COLORS.textMain} />
          </TouchableOpacity>
          <TouchableOpacity testID="play-pause-btn" onPress={togglePlay} style={styles.playBtn}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color={COLORS.background} />
          </TouchableOpacity>
          <TouchableOpacity testID="next-btn" onPress={nextTrack} style={styles.controlBtn}>
            <Ionicons name="play-skip-forward" size={28} color={COLORS.textMain} />
          </TouchableOpacity>
          <TouchableOpacity testID="repeat-btn" onPress={cycleRepeat} style={styles.controlBtn}>
            <Ionicons
              name={repeatMode === 'one' ? 'repeat' : 'repeat'}
              size={22}
              color={repeatMode !== 'off' ? COLORS.primary : COLORS.textMuted}
            />
            {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
          </TouchableOpacity>
        </View>

        {/* Analyze Button */}
        <TouchableOpacity testID="analyze-btn" style={styles.analyzeBtn} onPress={handleAnalyze} disabled={analyzing}>
          <Ionicons name="analytics" size={16} color={COLORS.primary} />
          <Text style={styles.analyzeBtnText}>
            {analyzing ? 'ANALIZANDO...' : 'ANALISIS IA DE CALIDAD'}
          </Text>
        </TouchableOpacity>

        {/* Analysis Result */}
        {showAnalysis && analysisData && (
          <View style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <Text style={styles.analysisTitle}>ANALISIS DE CALIDAD</Text>
              <TouchableOpacity onPress={() => setShowAnalysis(false)}>
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.scoreRow}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{analysisData.quality_score}</Text>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreTier}>{analysisData.quality_tier}</Text>
                <Text style={styles.scoreAnalysis}>{analysisData.analysis}</Text>
              </View>
            </View>
            {analysisData.recommendations?.map((rec: string, i: number) => (
              <View key={i} style={styles.recRow}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flex: 1, paddingHorizontal: 24 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 2 },
  emptySubtitle: { fontSize: 13, color: COLORS.textDim },
  artContainer: { alignItems: 'center', paddingTop: 16, paddingBottom: 16 },
  albumArt: {
    width: SCREEN_W * 0.55, height: SCREEN_W * 0.55, maxWidth: 280, maxHeight: 280,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', borderRadius: 4,
  },
  artFormatLabel: {
    fontFamily: 'monospace', fontSize: 12, color: COLORS.primary,
    marginTop: 8, fontWeight: '700', letterSpacing: 2,
  },
  trackInfo: { alignItems: 'center', marginBottom: 12 },
  trackTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain, marginBottom: 4 },
  trackArtist: { fontSize: 13, color: COLORS.textMuted, marginBottom: 10 },
  techRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tagBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryDim, borderRadius: 2,
  },
  tagHiRes: { borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.1)' },
  tagText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  tagTextHiRes: { color: COLORS.success },
  techDetail: { fontFamily: 'monospace', fontSize: 11, color: COLORS.textDim, letterSpacing: 0.3 },
  spectrumContainer: { marginVertical: 8 },
  progressSection: { marginBottom: 16 },
  progressBar: { height: 24, justifyContent: 'center', position: 'relative' },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  progressThumb: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.primary, top: 6, marginLeft: -6,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { fontFamily: 'monospace', fontSize: 11, color: COLORS.textDim },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16 },
  controlBtn: { padding: 8, alignItems: 'center' },
  playBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', paddingLeft: 3,
  },
  repeatOne: {
    fontFamily: 'monospace', fontSize: 8, color: COLORS.primary,
    position: 'absolute', bottom: 4, fontWeight: '700',
  },
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, borderWidth: 1,
    borderColor: COLORS.primaryBorder, borderRadius: 2, marginBottom: 16,
  },
  analyzeBtnText: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  analysisCard: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 2, padding: 16, marginBottom: 24,
  },
  analysisHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  analysisTitle: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  scoreCircle: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  scoreNumber: { fontFamily: 'monospace', fontSize: 20, fontWeight: '700', color: COLORS.primary },
  scoreInfo: { flex: 1 },
  scoreTier: { fontSize: 14, fontWeight: '700', color: COLORS.textMain, marginBottom: 2 },
  scoreAnalysis: { fontSize: 11, color: COLORS.textMuted },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  recText: { fontSize: 12, color: COLORS.textMuted, flex: 1 },
});
