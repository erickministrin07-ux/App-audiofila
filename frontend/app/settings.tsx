import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, SUPPORTED_FORMATS } from '../src/constants/theme';
import GlassBackground from '../src/components/GlassBackground';

const API = process.env.EXPO_PUBLIC_BACKEND_URL;
const A = COLORS.settings;
const SAMPLE_RATES = [44100, 48000, 88200, 96000, 176400, 192000, 352800, 384000];
const BUFFER_SIZES = [64, 128, 256, 512, 1024, 2048, 4096];
const DITHER_TYPES = ['none', 'rectangular', 'triangular', 'noise_shaped'];
const RESAMPLER_Q = ['linear', 'sinc_fast', 'sinc_medium', 'sinc_best', 'zero_order_hold'];
const REPLAY_GAIN = ['off', 'track', 'album'];
const OUTPUTS = ['default', 'OpenSL ES', 'AAudio', 'USB DAC', 'Bluetooth A2DP', 'HDMI'];

interface S { bit_perfect: boolean; processing_64bit: boolean; output_device: string; sample_rate: number; buffer_size: number; dither_type: string; gain: number; resampler_quality: string; volume_normalization: boolean; gapless_playback: boolean; replay_gain: string; preamp: number; tone_bass: number; tone_treble: number; stereo_mode: string; crossfeed: number; channel_balance: number; }

export default function SettingsScreen() {
  const [s, setS] = useState<S | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState('engine');

  useEffect(() => { fetch(`${API}/api/settings`).then(r => r.json()).then(setS).catch(() => {}); setLoading(false); }, []);

  const upd = async (k: keyof S, v: any) => {
    if (!s) return;
    const next = { ...s, [k]: v }; setS(next);
    fetch(`${API}/api/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) }).catch(() => {});
  };

  if (loading || !s) return <SafeAreaView style={st.container} edges={['top']}><View style={st.center}><ActivityIndicator size="large" color={A} /></View></SafeAreaView>;
  const fmtRate = (hz: number) => hz >= 1000 ? `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz` : `${hz} Hz`;

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <GlassBackground accent={A} glowColor={COLORS.settingsGlow} />
      <View style={st.header}><Text style={st.title}>Config</Text><Text style={st.sub}>SALIDA DE AUDIO</Text></View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Engine */}
        <SecHeader title="MOTOR DE AUDIO" icon="flash-outline" open={open === 'engine'} onPress={() => setOpen(open === 'engine' ? '' : 'engine')} accent={A} />
        {open === 'engine' && (
          <View style={st.secContent}>
            <TogRow tid="bit-perfect" label="Bit-Perfect Mode" desc="Bypass DSP completo" val={s.bit_perfect} onTog={v => upd('bit_perfect', v)} accent={A} />
            <TogRow tid="64bit" label="Procesamiento 64-bit" desc="Doble precision float" val={s.processing_64bit} onTog={v => upd('processing_64bit', v)} accent={A} />
            <TogRow tid="gapless" label="Sin Pausas" desc="Gapless playback" val={s.gapless_playback} onTog={v => upd('gapless_playback', v)} accent={A} />
            <TogRow tid="vol-norm" label="Normalizacion" desc="Volumen uniforme" val={s.volume_normalization} onTog={v => upd('volume_normalization', v)} accent={A} />
          </View>
        )}

        {/* Output */}
        <SecHeader title="DISPOSITIVO DE SALIDA" icon="hardware-chip-outline" open={open === 'output'} onPress={() => setOpen(open === 'output' ? '' : 'output')} accent={A} />
        {open === 'output' && (
          <View style={st.secContent}>
            <Text style={st.optLabel}>SALIDA</Text>
            <View style={st.optGrid}>{OUTPUTS.map(d => <OptBtn key={d} testID={`output-${d}`} label={d} active={s.output_device === d} onPress={() => upd('output_device', d)} accent={A} />)}</View>
            <Text style={st.optLabel}>FRECUENCIA DE MUESTREO</Text>
            <View style={st.optGrid}>{SAMPLE_RATES.map(r => <OptBtn key={r} testID={`sample-rate-${r}`} label={fmtRate(r)} active={s.sample_rate === r} onPress={() => upd('sample_rate', r)} accent={A} />)}</View>
            <Text style={st.optLabel}>BUFFER</Text>
            <View style={st.optGrid}>{BUFFER_SIZES.map(b => <OptBtn key={b} testID={`buffer-${b}`} label={String(b)} active={s.buffer_size === b} onPress={() => upd('buffer_size', b)} accent={A} />)}</View>
          </View>
        )}

        {/* DSP */}
        <SecHeader title="DSP" icon="color-wand-outline" open={open === 'dsp'} onPress={() => setOpen(open === 'dsp' ? '' : 'dsp')} accent={A} />
        {open === 'dsp' && (
          <View style={st.secContent}>
            <Text style={st.optLabel}>DITHER</Text>
            <View style={st.optGrid}>{DITHER_TYPES.map(d => <OptBtn key={d} testID={`dither-${d}`} label={d.replace(/_/g, ' ').toUpperCase()} active={s.dither_type === d} onPress={() => upd('dither_type', d)} accent={A} />)}</View>
            <Text style={st.optLabel}>RESAMPLER</Text>
            <View style={st.optGrid}>{RESAMPLER_Q.map(q => <OptBtn key={q} testID={`resampler-${q}`} label={q.replace(/_/g, ' ').toUpperCase()} active={s.resampler_quality === q} onPress={() => upd('resampler_quality', q)} accent={A} />)}</View>
            <Text style={st.optLabel}>REPLAY GAIN</Text>
            <View style={st.optGrid}>{REPLAY_GAIN.map(m => <OptBtn key={m} testID={`replay-gain-${m}`} label={m.toUpperCase()} active={s.replay_gain === m} onPress={() => upd('replay_gain', m)} accent={A} />)}</View>
          </View>
        )}

        {/* Formats */}
        <SecHeader title="FORMATOS" icon="document-text-outline" open={open === 'formats'} onPress={() => setOpen(open === 'formats' ? '' : 'formats')} accent={A} />
        {open === 'formats' && (
          <View style={st.secContent}>
            <View style={st.fmtGrid}>
              {SUPPORTED_FORMATS.map(f => {
                const ll = ['FLAC', 'WAV', 'AIFF', 'ALAC', 'DSD'].includes(f);
                const clr = ll ? COLORS.success : COLORS.warning;
                return (
                  <View key={f} style={[st.fmtBadge, { borderColor: clr + '25', backgroundColor: clr + '08' }]}>
                    <Text style={[st.fmtText, { color: clr }]}>{f}</Text>
                    <Text style={st.fmtType}>{ll ? 'LOSSLESS' : 'LOSSY'}</Text>
                  </View>
                );
              })}
            </View>
            <View style={[st.specBox, GLASS, { borderRadius: 14 }]}>
              <SpecRow label="Max Sample Rate" value="384 kHz" accent={A} />
              <SpecRow label="Max Bit Depth" value="32-bit" accent={A} />
              <SpecRow label="DSD" value="DSD64 / DSD128" accent={A} />
              <SpecRow label="Procesamiento" value="64-bit Float" accent={A} />
              <SpecRow label="Motor" value="Bit-Perfect" accent={A} />
            </View>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SecHeader({ title, icon, open, onPress, accent }: { title: string; icon: any; open: boolean; onPress: () => void; accent: string }) {
  return (
    <TouchableOpacity testID={`section-${title}`} style={st.secHeader} onPress={onPress}>
      <View style={st.secLeft}><Ionicons name={icon} size={18} color={accent} /><Text style={st.secTitle}>{title}</Text></View>
      <Ionicons name={open ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

function TogRow({ tid, label, desc, val, onTog, accent }: { tid: string; label: string; desc: string; val: boolean; onTog: (v: boolean) => void; accent: string }) {
  return (
    <View style={st.togRow}>
      <View style={{ flex: 1, marginRight: 16 }}><Text style={st.togLabel}>{label}</Text><Text style={st.togDesc}>{desc}</Text></View>
      <Switch testID={`toggle-${tid}`} value={val} onValueChange={onTog} trackColor={{ false: '#222', true: accent + '30' }} thumbColor={val ? accent : '#555'} />
    </View>
  );
}

function OptBtn({ testID, label, active, onPress, accent }: { testID: string; label: string; active: boolean; onPress: () => void; accent: string }) {
  return (
    <TouchableOpacity testID={testID} style={[st.optBtn, active && { borderColor: accent + '40', backgroundColor: accent + '12' }]} onPress={onPress}>
      <Text style={[st.optBtnText, active && { color: accent }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SpecRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={st.specRow}><Text style={st.specLabel}>{label}</Text><Text style={[st.specVal, { color: accent }]}>{value}</Text></View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '300', color: COLORS.textPrimary, letterSpacing: -0.5 },
  sub: { fontFamily: 'monospace', fontSize: 9, color: COLORS.textTertiary, letterSpacing: 2, marginTop: 2 },
  secHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  secLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secTitle: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: 1.5 },
  secContent: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  togRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  togLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 2 },
  togDesc: { fontSize: 11, color: COLORS.textTertiary },
  optLabel: { fontFamily: 'monospace', fontSize: 8, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 2, marginTop: 14, marginBottom: 8 },
  optGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optBtn: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 10 },
  optBtnText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '600', color: COLORS.textTertiary },
  fmtGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fmtBadge: { paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderRadius: 12, alignItems: 'center', minWidth: 70 },
  fmtText: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  fmtType: { fontFamily: 'monospace', fontSize: 7, color: COLORS.textTertiary, marginTop: 2, letterSpacing: 1 },
  specBox: { marginTop: 16, padding: 14 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  specLabel: { fontFamily: 'monospace', fontSize: 11, color: COLORS.textSecondary },
  specVal: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700' },
});
