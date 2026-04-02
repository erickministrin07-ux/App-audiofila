import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/theme';
import { usePlayer } from '../src/context/PlayerContext';
import SpectrumBars from '../src/components/SpectrumBars';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface AudioControls {
  preamp: number;
  tone_bass: number;
  tone_treble: number;
  stereo_mode: string;
  crossfeed: number;
  channel_balance: number;
}

const STEREO_MODES = ['stereo', 'mono', 'reverse', 'mid-side'];

export default function SpectrumScreen() {
  const { isPlaying, currentTrack } = usePlayer();
  const [controls, setControls] = useState<AudioControls>({
    preamp: 0, tone_bass: 0, tone_treble: 0,
    stereo_mode: 'stereo', crossfeed: 0, channel_balance: 0,
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const r = await fetch(`${API_URL}/api/settings`);
      const data = await r.json();
      setControls({
        preamp: data.preamp || 0,
        tone_bass: data.tone_bass || 0,
        tone_treble: data.tone_treble || 0,
        stereo_mode: data.stereo_mode || 'stereo',
        crossfeed: data.crossfeed || 0,
        channel_balance: data.channel_balance || 0,
      });
    } catch (e) { console.error(e); }
  };

  const updateControl = (key: keyof AudioControls, value: number | string) => {
    setControls(prev => ({ ...prev, [key]: value }));
    saveSettings({ ...controls, [key]: value });
  };

  const saveSettings = async (settings: AudioControls) => {
    try {
      await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch (e) { console.error(e); }
  };

  const adjustValue = (key: keyof AudioControls, delta: number, min: number, max: number) => {
    const current = controls[key] as number;
    const next = Math.max(min, Math.min(max, Math.round((current + delta) * 10) / 10));
    updateControl(key, next);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AUDIO</Text>
        {currentTrack && (
          <Text style={styles.headerSub} numberOfLines={1}>
            {currentTrack.title} — {currentTrack.artist}
          </Text>
        )}
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Spectrum Visualizer */}
        <View style={styles.spectrumSection}>
          <Text style={styles.sectionLabel}>ANALIZADOR DE ESPECTRO</Text>
          <View style={styles.spectrumBox}>
            <SpectrumBars isPlaying={isPlaying} height={140} />
            {!isPlaying && (
              <View style={styles.spectrumOverlay}>
                <Text style={styles.spectrumPaused}>PAUSADO</Text>
              </View>
            )}
          </View>
          <View style={styles.freqScale}>
            <Text style={styles.freqLabel}>20Hz</Text>
            <Text style={styles.freqLabel}>100Hz</Text>
            <Text style={styles.freqLabel}>1kHz</Text>
            <Text style={styles.freqLabel}>10kHz</Text>
            <Text style={styles.freqLabel}>20kHz</Text>
          </View>
        </View>

        {/* Audio Controls */}
        <View style={styles.controlsSection}>
          <Text style={styles.sectionLabel}>CONTROLES DE PROCESAMIENTO</Text>

          {/* Pre-amp */}
          <ControlRow
            label="PRE-AMP"
            value={`${controls.preamp > 0 ? '+' : ''}${controls.preamp.toFixed(1)} dB`}
            onMinus={() => adjustValue('preamp', -0.5, -12, 12)}
            onPlus={() => adjustValue('preamp', 0.5, -12, 12)}
            testId="preamp"
          />

          {/* Tone Bass */}
          <ControlRow
            label="TONO GRAVES"
            value={`${controls.tone_bass > 0 ? '+' : ''}${controls.tone_bass.toFixed(1)} dB`}
            onMinus={() => adjustValue('tone_bass', -0.5, -12, 12)}
            onPlus={() => adjustValue('tone_bass', 0.5, -12, 12)}
            testId="tone-bass"
          />

          {/* Tone Treble */}
          <ControlRow
            label="TONO AGUDOS"
            value={`${controls.tone_treble > 0 ? '+' : ''}${controls.tone_treble.toFixed(1)} dB`}
            onMinus={() => adjustValue('tone_treble', -0.5, -12, 12)}
            onPlus={() => adjustValue('tone_treble', 0.5, -12, 12)}
            testId="tone-treble"
          />

          {/* Crossfeed */}
          <ControlRow
            label="CROSSFEED"
            value={`${(controls.crossfeed * 100).toFixed(0)}%`}
            onMinus={() => adjustValue('crossfeed', -0.1, 0, 1)}
            onPlus={() => adjustValue('crossfeed', 0.1, 0, 1)}
            testId="crossfeed"
          />

          {/* Channel Balance */}
          <ControlRow
            label="BALANCE"
            value={controls.channel_balance === 0 ? 'C' : controls.channel_balance < 0 ? `L ${Math.abs(controls.channel_balance * 100).toFixed(0)}%` : `R ${(controls.channel_balance * 100).toFixed(0)}%`}
            onMinus={() => adjustValue('channel_balance', -0.1, -1, 1)}
            onPlus={() => adjustValue('channel_balance', 0.1, -1, 1)}
            testId="balance"
          />
        </View>

        {/* Stereo Mode */}
        <View style={styles.controlsSection}>
          <Text style={styles.sectionLabel}>ENTREGA ESTEREO</Text>
          <View style={styles.stereoModes}>
            {STEREO_MODES.map(m => (
              <TouchableOpacity
                key={m}
                testID={`stereo-mode-${m}`}
                style={[styles.stereoBtn, controls.stereo_mode === m && styles.stereoBtnActive]}
                onPress={() => updateControl('stereo_mode', m)}
              >
                <Text style={[styles.stereoBtnText, controls.stereo_mode === m && styles.stereoBtnTextActive]}>
                  {m.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ControlRow({ label, value, onMinus, onPlus, testId }: {
  label: string; value: string; onMinus: () => void; onPlus: () => void; testId: string;
}) {
  return (
    <View style={styles.controlRow}>
      <Text style={styles.controlLabel}>{label}</Text>
      <View style={styles.controlActions}>
        <TouchableOpacity testID={`${testId}-minus`} style={styles.adjBtn} onPress={onMinus}>
          <Ionicons name="remove" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Text style={styles.controlValue}>{value}</Text>
        <TouchableOpacity testID={`${testId}-plus`} style={styles.adjBtn} onPress={onPlus}>
          <Ionicons name="add" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textMain, letterSpacing: 2 },
  headerSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, fontFamily: 'monospace' },
  scrollContent: { flex: 1 },
  spectrumSection: { paddingHorizontal: 16, marginBottom: 16 },
  sectionLabel: {
    fontFamily: 'monospace', fontSize: 10, fontWeight: '700',
    color: COLORS.primary, letterSpacing: 1.5, marginBottom: 10,
  },
  spectrumBox: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 2, padding: 12, position: 'relative', overflow: 'hidden',
  },
  spectrumOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  spectrumPaused: {
    fontFamily: 'monospace', fontSize: 12, fontWeight: '700',
    color: COLORS.textDim, letterSpacing: 2,
  },
  freqScale: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 4,
  },
  freqLabel: { fontFamily: 'monospace', fontSize: 8, color: COLORS.textDim },
  controlsSection: {
    paddingHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.surface, marginHorizontal: 16,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 2, paddingVertical: 12,
  },
  controlRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  controlLabel: {
    fontFamily: 'monospace', fontSize: 10, fontWeight: '600',
    color: COLORS.textMuted, letterSpacing: 1, flex: 1,
  },
  controlActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adjBtn: {
    width: 32, height: 32, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 2, alignItems: 'center', justifyContent: 'center',
  },
  controlValue: {
    fontFamily: 'monospace', fontSize: 14, fontWeight: '700',
    color: COLORS.primary, minWidth: 70, textAlign: 'center',
  },
  stereoModes: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 4 },
  stereoBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 2,
  },
  stereoBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  stereoBtnText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', color: COLORS.textDim, letterSpacing: 0.5 },
  stereoBtnTextActive: { color: COLORS.primary },
});
