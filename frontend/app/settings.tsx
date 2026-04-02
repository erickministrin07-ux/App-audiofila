import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SUPPORTED_FORMATS } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const SAMPLE_RATES = [44100, 48000, 88200, 96000, 176400, 192000, 352800, 384000];
const BUFFER_SIZES = [64, 128, 256, 512, 1024, 2048, 4096];
const DITHER_TYPES = ['none', 'rectangular', 'triangular', 'noise_shaped'];
const RESAMPLER_QUALITIES = ['linear', 'sinc_fast', 'sinc_medium', 'sinc_best', 'zero_order_hold'];
const REPLAY_GAIN_MODES = ['off', 'track', 'album'];
const OUTPUT_DEVICES = ['default', 'OpenSL ES', 'AAudio', 'USB DAC', 'Bluetooth A2DP', 'HDMI'];

interface Settings {
  bit_perfect: boolean;
  processing_64bit: boolean;
  output_device: string;
  sample_rate: number;
  buffer_size: number;
  dither_type: string;
  gain: number;
  resampler_quality: string;
  volume_normalization: boolean;
  gapless_playback: boolean;
  replay_gain: string;
  preamp: number;
  tone_bass: number;
  tone_treble: number;
  stereo_mode: string;
  crossfeed: number;
  channel_balance: number;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string>('engine');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const r = await fetch(`${API_URL}/api/settings`);
      setSettings(await r.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateSetting = async (key: keyof Settings, value: any) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) { console.error(e); }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? '' : section);
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const formatRate = (hz: number) => hz >= 1000 ? `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz` : `${hz} Hz`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CONFIGURACION</Text>
        <Text style={styles.headerSub}>SALIDA DE AUDIO</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Audio Engine */}
        <SectionHeader
          title="MOTOR DE AUDIO"
          icon="flash"
          expanded={expandedSection === 'engine'}
          onToggle={() => toggleSection('engine')}
        />
        {expandedSection === 'engine' && (
          <View style={styles.sectionContent}>
            <ToggleRow testId="bit-perfect" label="Bit-Perfect Mode" desc="Bypass todo procesamiento DSP" value={settings.bit_perfect} onToggle={(v) => updateSetting('bit_perfect', v)} />
            <ToggleRow testId="64bit" label="Procesamiento 64-bit" desc="Float de doble precision para audio" value={settings.processing_64bit} onToggle={(v) => updateSetting('processing_64bit', v)} />
            <ToggleRow testId="gapless" label="Reproduccion Sin Pausas" desc="Gapless playback entre pistas" value={settings.gapless_playback} onToggle={(v) => updateSetting('gapless_playback', v)} />
            <ToggleRow testId="vol-norm" label="Normalizacion de Volumen" desc="Igualar volumen entre pistas" value={settings.volume_normalization} onToggle={(v) => updateSetting('volume_normalization', v)} />
          </View>
        )}

        {/* Output Config */}
        <SectionHeader
          title="DISPOSITIVO DE SALIDA"
          icon="hardware-chip"
          expanded={expandedSection === 'output'}
          onToggle={() => toggleSection('output')}
        />
        {expandedSection === 'output' && (
          <View style={styles.sectionContent}>
            <Text style={styles.optionLabel}>SALIDA</Text>
            <View style={styles.optionGrid}>
              {OUTPUT_DEVICES.map(device => (
                <TouchableOpacity
                  key={device}
                  testID={`output-${device}`}
                  style={[styles.optionBtn, settings.output_device === device && styles.optionBtnActive]}
                  onPress={() => updateSetting('output_device', device)}
                >
                  <Text style={[styles.optionBtnText, settings.output_device === device && styles.optionBtnTextActive]}>
                    {device}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.optionLabel}>FRECUENCIA DE MUESTREO</Text>
            <View style={styles.optionGrid}>
              {SAMPLE_RATES.map(rate => (
                <TouchableOpacity
                  key={rate}
                  testID={`sample-rate-${rate}`}
                  style={[styles.optionBtn, settings.sample_rate === rate && styles.optionBtnActive]}
                  onPress={() => updateSetting('sample_rate', rate)}
                >
                  <Text style={[styles.optionBtnText, settings.sample_rate === rate && styles.optionBtnTextActive]}>
                    {formatRate(rate)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.optionLabel}>TAMANO DE BUFFER</Text>
            <View style={styles.optionGrid}>
              {BUFFER_SIZES.map(size => (
                <TouchableOpacity
                  key={size}
                  testID={`buffer-${size}`}
                  style={[styles.optionBtn, settings.buffer_size === size && styles.optionBtnActive]}
                  onPress={() => updateSetting('buffer_size', size)}
                >
                  <Text style={[styles.optionBtnText, settings.buffer_size === size && styles.optionBtnTextActive]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* DSP */}
        <SectionHeader
          title="PROCESAMIENTO DSP"
          icon="color-wand"
          expanded={expandedSection === 'dsp'}
          onToggle={() => toggleSection('dsp')}
        />
        {expandedSection === 'dsp' && (
          <View style={styles.sectionContent}>
            <Text style={styles.optionLabel}>TIPO DE DITHER</Text>
            <View style={styles.optionGrid}>
              {DITHER_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  testID={`dither-${type}`}
                  style={[styles.optionBtn, settings.dither_type === type && styles.optionBtnActive]}
                  onPress={() => updateSetting('dither_type', type)}
                >
                  <Text style={[styles.optionBtnText, settings.dither_type === type && styles.optionBtnTextActive]}>
                    {type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.optionLabel}>CALIDAD DEL RESAMPLER</Text>
            <View style={styles.optionGrid}>
              {RESAMPLER_QUALITIES.map(q => (
                <TouchableOpacity
                  key={q}
                  testID={`resampler-${q}`}
                  style={[styles.optionBtn, settings.resampler_quality === q && styles.optionBtnActive]}
                  onPress={() => updateSetting('resampler_quality', q)}
                >
                  <Text style={[styles.optionBtnText, settings.resampler_quality === q && styles.optionBtnTextActive]}>
                    {q.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.optionLabel}>REPLAY GAIN</Text>
            <View style={styles.optionGrid}>
              {REPLAY_GAIN_MODES.map(mode => (
                <TouchableOpacity
                  key={mode}
                  testID={`replay-gain-${mode}`}
                  style={[styles.optionBtn, settings.replay_gain === mode && styles.optionBtnActive]}
                  onPress={() => updateSetting('replay_gain', mode)}
                >
                  <Text style={[styles.optionBtnText, settings.replay_gain === mode && styles.optionBtnTextActive]}>
                    {mode.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Supported Formats */}
        <SectionHeader
          title="FORMATOS SOPORTADOS"
          icon="document-text"
          expanded={expandedSection === 'formats'}
          onToggle={() => toggleSection('formats')}
        />
        {expandedSection === 'formats' && (
          <View style={styles.sectionContent}>
            <View style={styles.formatsGrid}>
              {SUPPORTED_FORMATS.map(fmt => {
                const isLossless = ['FLAC', 'WAV', 'AIFF', 'ALAC', 'DSD'].includes(fmt);
                return (
                  <View key={fmt} style={[styles.formatBadge, isLossless ? styles.formatLossless : styles.formatLossy]}>
                    <Text style={[styles.formatText, isLossless ? styles.formatTextLossless : styles.formatTextLossy]}>
                      {fmt}
                    </Text>
                    <Text style={styles.formatType}>
                      {isLossless ? 'LOSSLESS' : 'LOSSY'}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.specsBox}>
              <SpecRow label="Max Sample Rate" value="384 kHz" />
              <SpecRow label="Max Bit Depth" value="32-bit" />
              <SpecRow label="DSD Support" value="DSD64 / DSD128" />
              <SpecRow label="Processing" value="64-bit Float" />
              <SpecRow label="Audio Engine" value="Bit-Perfect" />
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, icon, expanded, onToggle }: {
  title: string; icon: string; expanded: boolean; onToggle: () => void;
}) {
  return (
    <TouchableOpacity testID={`section-${title}`} style={styles.sectionHeader} onPress={onToggle}>
      <View style={styles.sectionLeft}>
        <Ionicons name={icon as any} size={18} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textDim} />
    </TouchableOpacity>
  );
}

function ToggleRow({ testId, label, desc, value, onToggle }: {
  testId: string; label: string; desc: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        testID={`toggle-${testId}`}
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#333', true: COLORS.primaryDim }}
        thumbColor={value ? COLORS.primary : '#666'}
      />
    </View>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textMain, letterSpacing: 2 },
  headerSub: { fontFamily: 'monospace', fontSize: 10, color: COLORS.textDim, letterSpacing: 1, marginTop: 2 },
  scrollContent: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: {
    fontFamily: 'monospace', fontSize: 11, fontWeight: '700',
    color: COLORS.textMain, letterSpacing: 1.5,
  },
  sectionContent: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  toggleInfo: { flex: 1, marginRight: 16 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textMain, marginBottom: 2 },
  toggleDesc: { fontSize: 11, color: COLORS.textDim },
  optionLabel: {
    fontFamily: 'monospace', fontSize: 9, fontWeight: '700',
    color: COLORS.textDim, letterSpacing: 1.5, marginTop: 14, marginBottom: 8,
  },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 2,
  },
  optionBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  optionBtnText: { fontFamily: 'monospace', fontSize: 10, fontWeight: '600', color: COLORS.textDim },
  optionBtnTextActive: { color: COLORS.primary },
  formatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formatBadge: {
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderRadius: 2,
    alignItems: 'center', minWidth: 70,
  },
  formatLossless: { borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.08)' },
  formatLossy: { borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.08)' },
  formatText: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  formatTextLossless: { color: COLORS.success },
  formatTextLossy: { color: COLORS.warning },
  formatType: { fontFamily: 'monospace', fontSize: 7, color: COLORS.textDim, marginTop: 2, letterSpacing: 1 },
  specsBox: {
    marginTop: 16, padding: 12, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 2,
  },
  specRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  specLabel: { fontFamily: 'monospace', fontSize: 11, color: COLORS.textMuted },
  specValue: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', color: COLORS.primary },
});
