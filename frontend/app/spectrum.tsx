import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS } from '../src/constants/theme';
import { usePlayer } from '../src/context/PlayerContext';
import SpectrumBars from '../src/components/SpectrumBars';
import GlassBackground from '../src/components/GlassBackground';

const API = process.env.EXPO_PUBLIC_BACKEND_URL;
const A = COLORS.spectrum;
const STEREO_MODES = ['stereo', 'mono', 'reverse', 'mid-side'];

interface Ctrl { preamp: number; tone_bass: number; tone_treble: number; stereo_mode: string; crossfeed: number; channel_balance: number; }

export default function SpectrumScreen() {
  const { isPlaying, currentTrack } = usePlayer();
  const [c, setC] = useState<Ctrl>({ preamp: 0, tone_bass: 0, tone_treble: 0, stereo_mode: 'stereo', crossfeed: 0, channel_balance: 0 });

  useEffect(() => {
    fetch(`${API}/api/settings`).then(r => r.json()).then(d => setC({
      preamp: d.preamp || 0, tone_bass: d.tone_bass || 0, tone_treble: d.tone_treble || 0,
      stereo_mode: d.stereo_mode || 'stereo', crossfeed: d.crossfeed || 0, channel_balance: d.channel_balance || 0,
    })).catch(() => {});
  }, []);

  const update = (k: keyof Ctrl, v: number | string) => {
    const next = { ...c, [k]: v }; setC(next);
    fetch(`${API}/api/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) }).catch(() => {});
  };
  const adj = (k: keyof Ctrl, d: number, min: number, max: number) => {
    const cur = c[k] as number;
    update(k, Math.max(min, Math.min(max, Math.round((cur + d) * 10) / 10)));
  };

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <GlassBackground accent={A} glowColor={COLORS.spectrumGlow} />
      <View style={st.header}>
        <Text style={st.title}>Audio</Text>
        {currentTrack && <Text style={st.sub} numberOfLines={1}>{currentTrack.title}</Text>}
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Spectrum */}
        <View style={st.specSection}>
          <Text style={[st.label, { color: A }]}>ANALIZADOR DE ESPECTRO</Text>
          <View style={[st.specBox, GLASS, { borderRadius: 18 }]}>
            <SpectrumBars isPlaying={isPlaying} height={140} accent={A} />
            {!isPlaying && <View style={st.overlay}><Text style={st.paused}>PAUSADO</Text></View>}
          </View>
          <View style={st.freqRow}>
            {['20Hz', '100Hz', '1kHz', '10kHz', '20kHz'].map(f => <Text key={f} style={st.freqLabel}>{f}</Text>)}
          </View>
        </View>

        {/* Controls */}
        <View style={[st.ctrlCard, GLASS, { borderRadius: 18 }]}>
          <Text style={[st.label, { color: A }]}>PROCESAMIENTO</Text>
          <CtrlRow label="PRE-AMP" value={`${c.preamp > 0 ? '+' : ''}${c.preamp.toFixed(1)} dB`} onM={() => adj('preamp', -0.5, -12, 12)} onP={() => adj('preamp', 0.5, -12, 12)} tid="preamp" accent={A} />
          <CtrlRow label="GRAVES" value={`${c.tone_bass > 0 ? '+' : ''}${c.tone_bass.toFixed(1)} dB`} onM={() => adj('tone_bass', -0.5, -12, 12)} onP={() => adj('tone_bass', 0.5, -12, 12)} tid="tone-bass" accent={A} />
          <CtrlRow label="AGUDOS" value={`${c.tone_treble > 0 ? '+' : ''}${c.tone_treble.toFixed(1)} dB`} onM={() => adj('tone_treble', -0.5, -12, 12)} onP={() => adj('tone_treble', 0.5, -12, 12)} tid="tone-treble" accent={A} />
          <CtrlRow label="CROSSFEED" value={`${(c.crossfeed * 100).toFixed(0)}%`} onM={() => adj('crossfeed', -0.1, 0, 1)} onP={() => adj('crossfeed', 0.1, 0, 1)} tid="crossfeed" accent={A} />
          <CtrlRow label="BALANCE" value={c.channel_balance === 0 ? 'C' : c.channel_balance < 0 ? `L ${Math.abs(c.channel_balance * 100).toFixed(0)}%` : `R ${(c.channel_balance * 100).toFixed(0)}%`}
            onM={() => adj('channel_balance', -0.1, -1, 1)} onP={() => adj('channel_balance', 0.1, -1, 1)} tid="balance" accent={A} />
        </View>

        {/* Stereo Mode */}
        <View style={[st.ctrlCard, GLASS, { borderRadius: 18 }]}>
          <Text style={[st.label, { color: A }]}>ENTREGA ESTEREO</Text>
          <View style={st.stereoRow}>
            {STEREO_MODES.map(m => (
              <TouchableOpacity key={m} testID={`stereo-mode-${m}`} style={[st.stereoBtn, c.stereo_mode === m && { borderColor: A + '40', backgroundColor: A + '12' }]} onPress={() => update('stereo_mode', m)}>
                <Text style={[st.stereoBtnText, c.stereo_mode === m && { color: A }]}>{m.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CtrlRow({ label, value, onM, onP, tid, accent }: { label: string; value: string; onM: () => void; onP: () => void; tid: string; accent: string }) {
  return (
    <View style={st.ctrlRow}>
      <Text style={st.ctrlLabel}>{label}</Text>
      <View style={st.ctrlActions}>
        <TouchableOpacity testID={`${tid}-minus`} style={st.adjBtn} onPress={onM}><Ionicons name="remove-outline" size={16} color={COLORS.textSecondary} /></TouchableOpacity>
        <Text style={[st.ctrlVal, { color: accent }]}>{value}</Text>
        <TouchableOpacity testID={`${tid}-plus`} style={st.adjBtn} onPress={onP}><Ionicons name="add-outline" size={16} color={COLORS.textSecondary} /></TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '300', color: COLORS.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: 12, color: COLORS.textTertiary, marginTop: 3, fontFamily: 'monospace' },
  specSection: { paddingHorizontal: 16, marginBottom: 14 },
  label: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  specBox: { padding: 12, position: 'relative', overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  paused: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 2 },
  freqRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 4 },
  freqLabel: { fontFamily: 'monospace', fontSize: 8, color: COLORS.textTertiary },
  ctrlCard: { marginHorizontal: 16, padding: 16, marginBottom: 14 },
  ctrlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  ctrlLabel: { fontFamily: 'monospace', fontSize: 9, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 1.5, flex: 1 },
  ctrlActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adjBtn: { width: 34, height: 34, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ctrlVal: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', minWidth: 72, textAlign: 'center' },
  stereoRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stereoBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 12 },
  stereoBtnText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.5 },
});
