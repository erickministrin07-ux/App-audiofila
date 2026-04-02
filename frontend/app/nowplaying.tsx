import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, formatDuration, formatSampleRate, formatFileSize, isLossless, isHiRes } from '../src/constants/theme';
import { usePlayer } from '../src/context/PlayerContext';
import FormatBadge from '../src/components/FormatBadge';
import SpectrumBars from '../src/components/SpectrumBars';
import GlassBackground from '../src/components/GlassBackground';

const { width: SW } = Dimensions.get('window');
const A = COLORS.nowPlaying;

export default function NowPlayingScreen() {
  const { currentTrack, isPlaying, currentPosition, repeatMode, shuffle, togglePlay, nextTrack, prevTrack, seekTo, setRepeatMode, toggleShuffle } = usePlayer();
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const API = process.env.EXPO_PUBLIC_BACKEND_URL;

  const seekPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => doSeek(e.nativeEvent.locationX),
    onPanResponderMove: (e) => doSeek(e.nativeEvent.locationX),
  })).current;
  const doSeek = (x: number) => { if (!currentTrack) return; seekTo(Math.floor(Math.max(0, Math.min(1, x / (SW - 48))) * currentTrack.duration)); };

  const analyze = async () => {
    if (!currentTrack) return; setAnalyzing(true);
    try { const r = await fetch(`${API}/api/songs/${currentTrack.id}/analyze`); setAnalysis(await r.json()); setShowAnalysis(true); } catch (e) {}
    setAnalyzing(false);
  };

  const cycleRepeat = () => { const m: ('off'|'one'|'all')[] = ['off','all','one']; setRepeatMode(m[(m.indexOf(repeatMode)+1)%3]); };

  if (!currentTrack) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <GlassBackground accent={A} glowColor={COLORS.nowPlayingGlow} />
      <View style={s.empty}><Ionicons name="disc-outline" size={64} color={COLORS.textTertiary} /><Text style={s.emptyTitle}>Sin Reproduccion</Text><Text style={s.emptySub}>Selecciona una pista</Text></View>
    </SafeAreaView>
  );

  const prog = currentTrack.duration > 0 ? currentPosition / currentTrack.duration : 0;
  const ll = isLossless(currentTrack.format);
  const hr = isHiRes(currentTrack.bit_depth, currentTrack.sample_rate);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <GlassBackground accent={A} glowColor={COLORS.nowPlayingGlow} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Album Art */}
        <View style={s.artWrap}>
          <View style={[s.albumArt, { shadowColor: A }]}>
            <Ionicons name="disc" size={70} color={A} />
            <Text style={[s.artLabel, { color: A }]}>{currentTrack.format}</Text>
          </View>
        </View>

        {/* Track Info */}
        <View style={s.info}>
          <Text style={s.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={s.trackArtist} numberOfLines={1}>{currentTrack.artist} — {currentTrack.album}</Text>
          <View style={s.techRow}>
            <FormatBadge format={currentTrack.format} bitDepth={currentTrack.bit_depth} sampleRate={currentTrack.sample_rate} accent={A} />
            {ll && <View style={[s.tag, { borderColor: A+'30', backgroundColor: A+'10' }]}><Text style={[s.tagText, { color: A }]}>LOSSLESS</Text></View>}
            {hr && <View style={[s.tag, { borderColor: COLORS.success+'30', backgroundColor: COLORS.success+'10' }]}><Text style={[s.tagText, { color: COLORS.success }]}>HI-RES</Text></View>}
          </View>
          <Text style={s.techDetail}>
            {currentTrack.format === 'DSD' ? `DSD${Math.round(currentTrack.sample_rate/44100)}` : `${currentTrack.bit_depth}bit`} / {formatSampleRate(currentTrack.sample_rate)} / {currentTrack.bitrate}kbps / {formatFileSize(currentTrack.file_size)}
          </Text>
        </View>

        {/* Mini Spectrum */}
        <View style={[s.spectrumBox, GLASS, { borderRadius: 16 }]}>
          <SpectrumBars isPlaying={isPlaying} height={50} accent={A} />
        </View>

        {/* Progress */}
        <View style={s.progSection}>
          <View style={s.progBar} {...seekPan.panHandlers}>
            <View style={s.progTrack}><View style={[s.progFill, { width: `${prog*100}%`, backgroundColor: A }]} /></View>
            <View style={[s.progThumb, { left: `${prog*100}%`, backgroundColor: A, shadowColor: A }]} />
          </View>
          <View style={s.timeRow}>
            <Text style={s.time}>{formatDuration(currentPosition)}</Text>
            <Text style={s.time}>{formatDuration(currentTrack.duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={s.controls}>
          <TouchableOpacity testID="shuffle-btn" onPress={toggleShuffle} style={s.ctrlBtn}>
            <Ionicons name="shuffle-outline" size={22} color={shuffle ? A : COLORS.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity testID="prev-btn" onPress={prevTrack} style={s.ctrlBtn}>
            <Ionicons name="play-skip-back-outline" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity testID="play-pause-btn" onPress={togglePlay} style={[s.playBtn, { backgroundColor: A+'18', borderColor: A+'30' }]}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color={A} />
          </TouchableOpacity>
          <TouchableOpacity testID="next-btn" onPress={nextTrack} style={s.ctrlBtn}>
            <Ionicons name="play-skip-forward-outline" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity testID="repeat-btn" onPress={cycleRepeat} style={s.ctrlBtn}>
            <Ionicons name="repeat-outline" size={22} color={repeatMode !== 'off' ? A : COLORS.textTertiary} />
            {repeatMode === 'one' && <Text style={[s.repOne, { color: A }]}>1</Text>}
          </TouchableOpacity>
        </View>

        {/* Analyze */}
        <TouchableOpacity testID="analyze-btn" style={[s.analyzeBtn, { borderColor: A+'30' }]} onPress={analyze} disabled={analyzing}>
          <Ionicons name="analytics-outline" size={15} color={A} />
          <Text style={[s.analyzeTxt, { color: A }]}>{analyzing ? 'ANALIZANDO...' : 'ANALISIS IA'}</Text>
        </TouchableOpacity>

        {showAnalysis && analysis && (
          <View style={[s.analysisCard, GLASS]}>
            <View style={s.analysisHead}>
              <Text style={[s.analysisTitle, { color: A }]}>ANALISIS</Text>
              <TouchableOpacity onPress={() => setShowAnalysis(false)}><Ionicons name="close-outline" size={18} color={COLORS.textTertiary} /></TouchableOpacity>
            </View>
            <View style={s.scoreRow}>
              <View style={[s.scoreCircle, { borderColor: A }]}><Text style={[s.scoreNum, { color: A }]}>{analysis.quality_score}</Text></View>
              <View style={{flex:1}}><Text style={s.scoreTier}>{analysis.quality_tier}</Text><Text style={s.scoreText}>{analysis.analysis}</Text></View>
            </View>
            {analysis.recommendations?.map((r: string, i: number) => (
              <View key={i} style={s.recRow}><Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} /><Text style={s.recText}>{r}</Text></View>
            ))}
          </View>
        )}
        <View style={{height:30}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 24 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 1 },
  emptySub: { fontSize: 13, color: COLORS.textTertiary },
  artWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  albumArt: {
    width: SW * 0.52, height: SW * 0.52, maxWidth: 260, maxHeight: 260,
    ...GLASS, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 30, elevation: 10,
  },
  artLabel: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', marginTop: 8, letterSpacing: 2 },
  info: { alignItems: 'center', marginBottom: 12 },
  trackTitle: { fontSize: 20, fontWeight: '300', color: COLORS.textPrimary, marginBottom: 4, letterSpacing: -0.3 },
  trackArtist: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
  techRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderRadius: 8 },
  tagText: { fontFamily: 'monospace', fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  techDetail: { fontFamily: 'monospace', fontSize: 10, color: COLORS.textTertiary },
  spectrumBox: { padding: 10, marginBottom: 12 },
  progSection: { marginBottom: 14 },
  progBar: { height: 28, justifyContent: 'center', position: 'relative' },
  progTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 2 },
  progThumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, top: 7, marginLeft: -7, shadowOffset:{width:0,height:0}, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  time: { fontFamily: 'monospace', fontSize: 10, color: COLORS.textTertiary },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 },
  ctrlBtn: { padding: 10, alignItems: 'center' },
  playBtn: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  repOne: { fontFamily: 'monospace', fontSize: 8, fontWeight: '700', position: 'absolute', bottom: 6 },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, borderWidth: 1, borderRadius: 14, marginBottom: 14 },
  analyzeTxt: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  analysisCard: { padding: 16, marginBottom: 16, borderRadius: 18 },
  analysisHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  analysisTitle: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  scoreCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontFamily: 'monospace', fontSize: 18, fontWeight: '700' },
  scoreTier: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  scoreText: { fontSize: 11, color: COLORS.textSecondary },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  recText: { fontSize: 11, color: COLORS.textSecondary, flex: 1 },
});
