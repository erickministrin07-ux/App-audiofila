import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { C } from '../constants/theme';

const { width: SW } = Dimensions.get('window');
const DRAWER_W = SW * 0.78;

const SECTIONS = [
  { title: 'REPRODUCCION', items: [
    { route: '/', icon: 'albums-outline', label: 'Biblioteca' },
    { route: '/nowplaying', icon: 'play-circle-outline', label: 'Reproductor' },
  ]},
  { title: 'AUDIO', items: [
    { route: '/equalizer', icon: 'options-outline', label: 'Ecualizador' },
    { route: '/dsp', icon: 'radio-outline', label: 'Efectos DSP' },
    { route: '/audiosettings', icon: 'settings-outline', label: 'Config Audio' },
    { route: '/compressor', icon: 'speedometer-outline', label: 'Compresor' },
    { route: '/toneboosters', icon: 'color-wand-outline', label: 'Toneboosters' },
    { route: '/aienhancer', icon: 'sparkles-outline', label: 'IA Enhancer' },
  ]},
  { title: 'CONECTAR', items: [
    { route: '/connections', icon: 'cloud-outline', label: 'Streaming & Nube' },
  ]},
];

interface Props { onClose: () => void; }

export default function DrawerMenu({ onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (route: string) => {
    onClose();
    setTimeout(() => { router.replace(route as any); }, 100);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.drawer}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Ionicons name="disc" size={26} color={C.primary} />
            <Text style={styles.brand}>AudiPro</Text>
          </View>
          <Text style={styles.version}>Reproductor Audiofilo v2.0</Text>
        </View>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {SECTIONS.map(sec => (
            <View key={sec.title} style={styles.section}>
              <Text style={styles.secTitle}>{sec.title}</Text>
              {sec.items.map(item => {
                const active = pathname === item.route || (item.route === '/' && pathname === '/index');
                return (
                  <TouchableOpacity key={item.route} testID={`drawer-${item.label}`} style={[styles.item, active && styles.itemActive]} onPress={() => navigate(item.route)}>
                    <Ionicons name={item.icon as any} size={20} color={active ? C.primary : C.textSec} />
                    <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
      <TouchableOpacity style={styles.overlayTouch} onPress={onClose} activeOpacity={1} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', zIndex: 100 },
  drawer: { width: DRAWER_W, backgroundColor: C.drawerBg, borderRightWidth: 1, borderRightColor: C.border },
  overlayTouch: { flex: 1, backgroundColor: C.drawerOverlay },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  version: { fontSize: 11, color: C.textTer, marginTop: 4 },
  scroll: { flex: 1 },
  section: { paddingTop: 16, paddingHorizontal: 12 },
  secTitle: { fontSize: 10, fontWeight: '700', color: C.textTer, letterSpacing: 2, paddingHorizontal: 12, marginBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 2 },
  itemActive: { backgroundColor: C.primaryDim },
  itemLabel: { fontSize: 15, fontWeight: '500', color: C.textSec },
  itemLabelActive: { color: C.primary, fontWeight: '600' },
});
