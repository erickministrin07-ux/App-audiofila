import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, EQ_10_FREQS, EQ_31_FREQS } from '../src/constants/theme';
import EQBand from '../src/components/EQBand';
import GlassBackground from '../src/components/GlassBackground';

const API = process.env.EXPO_PUBLIC_BACKEND_URL;
const A = COLORS.equalizer;
type Mode = 'preset' | '10-band' | '31-band';

interface Preset { id: string; name: string; bands: Record<string, number>; preamp: number; is_custom: boolean; }

export default function EqualizerScreen() {
  const [mode, setMode] = useState<Mode>('10-band');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePreset, setActivePreset] = useState('');
  const [bands, setBands] = useState<Record<string, number>>({});
  const [preamp, setPreamp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eqOn, setEqOn] = useState(true);

  useEffect(() => { fetchPresets(); }, []);
  useEffect(() => {
    if (Object.keys(bands).length === 0) {
      const f = mode === '31-band' ? EQ_31_FREQS : EQ_10_FREQS;
      const init: Record<string, number> = {}; f.forEach(x => { init[x] = 0; }); setBands(init);
    }
  }, [mode]);

  const fetchPresets = async () => {
    try { const r = await fetch(`${API}/api/eq-presets`); const d = await r.json(); setPresets(d); if (d.length > 0) applyPreset(d[0]); } catch (e) {}
    setLoading(false);
  };

  const applyPreset = (p: Preset) => { setActivePreset(p.id); setBands({ ...p.bands }); setPreamp(p.preamp); };
  const reset = () => { const f = mode === '31-band' ? EQ_31_FREQS : EQ_10_FREQS; const r: Record<string, number> = {}; f.forEach(x => { r[x] = 0; }); setBands(r); setPreamp(0); setActivePreset(''); };
  const updateBand = (freq: string, v: number) => { setBands(p => ({ ...p, [freq]: v })); setActivePreset(''); };

  const freqs = mode === '31-band' ? EQ_31_FREQS : EQ_10_FREQS;
  const slH = mode === '31-band' ? 130 : 170;
  const modes: { key: Mode; label: string }[] = [{ key: 'preset', label: 'PRESETS' }, { key: '10-band', label: '10 BANDAS' }, { key: '31-band', label: '31 BANDAS' }];

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <GlassBackground accent={A} glowColor={COLORS.equalizerGlow} />
      <View style={st.header}>
        <Text style={st.title}>Ecualizador</Text>
        <TouchableOpacity testID="eq-toggle-btn" style={[st.onBtn, eqOn && { borderColor: A + '40', backgroundColor: A + '12' }]} onPress={() => setEqOn(!eqOn)}>
          <Text style={[st.onText, eqOn && { color: A }]}>{eqOn ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>

      <View style={st.modeRow}>
        {modes.map(m => (
          <TouchableOpacity key={m.key} testID={`eq-mode-${m.key}`} style={[st.modeBtn, mode === m.key && { backgroundColor: A + '12' }]} onPress={() => setMode(m.key)}>
            <Text style={[st.modeText, mode === m.key && { color: A }]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <View style={st.center}><ActivityIndicator size="large" color={A} /></View>
       : mode === 'preset' ? (
        <ScrollView style={st.presetList}>
          {presets.map(p => (
            <TouchableOpacity key={p.id} testID={`preset-${p.name}`} style={[st.presetRow, activePreset === p.id && { backgroundColor: A + '08', borderLeftWidth: 3, borderLeftColor: A }]}
              onPress={() => applyPreset(p)}>
              <View style={{flex:1}}>
                <Text style={[st.presetName, activePreset === p.id && { color: A }]}>{p.name}</Text>
                <Text style={st.presetSub}>Pre-amp: {p.preamp > 0 ? '+' : ''}{p.preamp.toFixed(1)}dB</Text>
              </View>
              {activePreset === p.id && <Ionicons name="checkmark-circle" size={20} color={A} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={st.bandWrap}>
          {/* Preamp */}
          <View style={[st.preampBox, GLASS, { borderRadius: 14 }]}>
            <Text style={st.preampLabel}>PRE-AMP</Text>
            <View style={st.preampCtrl}>
              <TouchableOpacity onPress={() => setPreamp(Math.max(-12, preamp - 0.5))}><Ionicons name="remove-circle-outline" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
              <Text style={[st.preampVal, { color: A }]}>{preamp > 0 ? '+' : ''}{preamp.toFixed(1)} dB</Text>
              <TouchableOpacity onPress={() => setPreamp(Math.min(12, preamp + 0.5))}><Ionicons name="add-circle-outline" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
            </View>
          </View>

          {/* Bands */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.bandsScroll}>
            {freqs.map(f => <EQBand key={f} frequency={f} value={bands[f] || 0} onChange={v => updateBand(f, v)} height={slH} accent={A} />)}
          </ScrollView>

          {/* Footer */}
          <View style={st.footer}>
            <Text style={st.footerLabel}>{activePreset ? presets.find(p => p.id === activePreset)?.name || 'Custom' : 'Custom'}</Text>
            <TouchableOpacity testID="eq-reset-btn" style={st.resetBtn} onPress={reset}>
              <Ionicons name="refresh-outline" size={14} color={A} />
              <Text style={[st.resetText, { color: A }]}>RESET</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '300', color: COLORS.textPrimary, letterSpacing: -0.5 },
  onBtn: { paddingHorizontal: 16, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 12 },
  onText: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 1 },
  modeRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 6 },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  modeText: { fontFamily: 'monospace', fontSize: 10, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 0.8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  presetList: { flex: 1, paddingHorizontal: 16 },
  presetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 2 },
  presetName: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 2 },
  presetSub: { fontFamily: 'monospace', fontSize: 10, color: COLORS.textTertiary },
  bandWrap: { flex: 1, paddingHorizontal: 8 },
  preampBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 8, marginBottom: 8 },
  preampLabel: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 1.5 },
  preampCtrl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  preampVal: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', minWidth: 70, textAlign: 'center' },
  bandsScroll: { paddingHorizontal: 8, paddingTop: 8, gap: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  footerLabel: { fontFamily: 'monospace', fontSize: 12, color: COLORS.textTertiary },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 },
  resetText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
});
