import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, EQ_10_FREQS, EQ_31_FREQS } from '../src/constants/theme';
import EQBand from '../src/components/EQBand';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type EQMode = 'preset' | '10-band' | '31-band';

interface Preset {
  id: string;
  name: string;
  bands: Record<string, number>;
  preamp: number;
  is_custom: boolean;
}

export default function EqualizerScreen() {
  const [mode, setMode] = useState<EQMode>('10-band');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePreset, setActivePreset] = useState<string>('');
  const [bands, setBands] = useState<Record<string, number>>({});
  const [preamp, setPreamp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eqEnabled, setEqEnabled] = useState(true);

  useEffect(() => {
    fetchPresets();
  }, []);

  useEffect(() => {
    if (Object.keys(bands).length === 0) {
      const freqs = mode === '31-band' ? EQ_31_FREQS : EQ_10_FREQS;
      const initial: Record<string, number> = {};
      freqs.forEach(f => { initial[f] = 0; });
      setBands(initial);
    }
  }, [mode]);

  const fetchPresets = async () => {
    try {
      const r = await fetch(`${API_URL}/api/eq-presets`);
      const data = await r.json();
      setPresets(data);
      if (data.length > 0) {
        applyPreset(data[0]);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setBands({ ...preset.bands });
    setPreamp(preset.preamp);
  };

  const resetBands = () => {
    const freqs = mode === '31-band' ? EQ_31_FREQS : EQ_10_FREQS;
    const reset: Record<string, number> = {};
    freqs.forEach(f => { reset[f] = 0; });
    setBands(reset);
    setPreamp(0);
    setActivePreset('');
  };

  const updateBand = (freq: string, value: number) => {
    setBands(prev => ({ ...prev, [freq]: value }));
    setActivePreset('');
  };

  const currentFreqs = mode === '31-band' ? EQ_31_FREQS : EQ_10_FREQS;
  const sliderHeight = mode === '31-band' ? 130 : 170;

  const modes: { key: EQMode; label: string }[] = [
    { key: 'preset', label: 'PRESETS' },
    { key: '10-band', label: '10 BANDAS' },
    { key: '31-band', label: '31 BANDAS' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ECUALIZADOR</Text>
        <TouchableOpacity
          testID="eq-toggle-btn"
          style={[styles.toggleBtn, eqEnabled && styles.toggleActive]}
          onPress={() => setEqEnabled(!eqEnabled)}
        >
          <Text style={[styles.toggleText, eqEnabled && styles.toggleTextActive]}>
            {eqEnabled ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mode Tabs */}
      <View style={styles.modeTabs}>
        {modes.map(m => (
          <TouchableOpacity
            key={m.key}
            testID={`eq-mode-${m.key}`}
            style={[styles.modeTab, mode === m.key && styles.modeTabActive]}
            onPress={() => setMode(m.key)}
          >
            <Text style={[styles.modeTabText, mode === m.key && styles.modeTabTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : mode === 'preset' ? (
        /* Preset Mode */
        <ScrollView style={styles.presetList}>
          {presets.map(preset => (
            <TouchableOpacity
              key={preset.id}
              testID={`preset-${preset.name}`}
              style={[styles.presetItem, activePreset === preset.id && styles.presetItemActive]}
              onPress={() => applyPreset(preset)}
            >
              <View style={styles.presetInfo}>
                <Text style={[styles.presetName, activePreset === preset.id && styles.presetNameActive]}>
                  {preset.name}
                </Text>
                <Text style={styles.presetDetail}>
                  Pre-amp: {preset.preamp > 0 ? '+' : ''}{preset.preamp.toFixed(1)}dB
                </Text>
              </View>
              {activePreset === preset.id && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
              {preset.is_custom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>CUSTOM</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        /* Band Mode (10 or 31) */
        <View style={styles.bandContainer}>
          {/* Preamp */}
          <View style={styles.preampSection}>
            <Text style={styles.preampLabel}>PRE-AMP</Text>
            <View style={styles.preampControl}>
              <TouchableOpacity onPress={() => setPreamp(Math.max(-12, preamp - 0.5))}>
                <Ionicons name="remove-circle-outline" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
              <Text style={styles.preampValue}>
                {preamp > 0 ? '+' : ''}{preamp.toFixed(1)} dB
              </Text>
              <TouchableOpacity onPress={() => setPreamp(Math.min(12, preamp + 0.5))}>
                <Ionicons name="add-circle-outline" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* dB Scale Labels */}
          <View style={styles.scaleRow}>
            <Text style={styles.scaleLabel}>+12</Text>
            <View style={styles.scaleFlex} />
            <Text style={styles.scaleLabel}>0</Text>
            <View style={styles.scaleFlex} />
            <Text style={styles.scaleLabel}>-12</Text>
          </View>

          {/* Bands */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bandsScroll}>
            {currentFreqs.map(freq => (
              <EQBand
                key={freq}
                frequency={freq}
                value={bands[freq] || 0}
                onChange={(v) => updateBand(freq, v)}
                height={sliderHeight}
              />
            ))}
          </ScrollView>

          {/* Active Preset Name + Reset */}
          <View style={styles.bottomBar}>
            <Text style={styles.activePresetLabel}>
              {activePreset ? presets.find(p => p.id === activePreset)?.name || 'Custom' : 'Custom'}
            </Text>
            <TouchableOpacity testID="eq-reset-btn" style={styles.resetBtn} onPress={resetBands}>
              <Ionicons name="refresh" size={14} color={COLORS.primary} />
              <Text style={styles.resetBtnText}>RESET</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textMain, letterSpacing: 2 },
  toggleBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 2,
  },
  toggleActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  toggleText: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', color: COLORS.textDim, letterSpacing: 1 },
  toggleTextActive: { color: COLORS.primary },
  modeTabs: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: COLORS.border, marginBottom: 8,
  },
  modeTab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  modeTabActive: { borderBottomColor: COLORS.primary },
  modeTabText: { fontFamily: 'monospace', fontSize: 11, fontWeight: '600', color: COLORS.textDim, letterSpacing: 1 },
  modeTabTextActive: { color: COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  presetList: { flex: 1, paddingHorizontal: 16 },
  presetItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    borderRadius: 2, marginBottom: 2,
  },
  presetItemActive: { backgroundColor: 'rgba(6,182,212,0.05)', borderLeftWidth: 2, borderLeftColor: COLORS.primary },
  presetInfo: { flex: 1 },
  presetName: { fontSize: 15, fontWeight: '600', color: COLORS.textMain, marginBottom: 2 },
  presetNameActive: { color: COLORS.primary },
  presetDetail: { fontFamily: 'monospace', fontSize: 11, color: COLORS.textDim },
  customBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1,
    borderColor: COLORS.warning + '50', backgroundColor: COLORS.warning + '15',
    borderRadius: 2, marginLeft: 8,
  },
  customBadgeText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', color: COLORS.warning },
  bandContainer: { flex: 1, paddingHorizontal: 8 },
  preampSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, marginBottom: 8,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 2, marginHorizontal: 8,
  },
  preampLabel: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 },
  preampControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  preampValue: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: COLORS.primary, minWidth: 70, textAlign: 'center' },
  scaleRow: {
    flexDirection: 'column', alignItems: 'flex-start', paddingLeft: 12,
    position: 'absolute', left: 0, top: 120, bottom: 60, zIndex: 1,
  },
  scaleLabel: { fontFamily: 'monospace', fontSize: 8, color: COLORS.textDim },
  scaleFlex: { flex: 1 },
  bandsScroll: { paddingHorizontal: 8, paddingTop: 8, gap: 2 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 8,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  activePresetLabel: { fontFamily: 'monospace', fontSize: 12, color: COLORS.textMuted, letterSpacing: 0.5 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 },
  resetBtnText: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
});
