import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../constants/theme';

interface Props { title: string; subtitle?: string; onMenu: () => void; }

export default function AppHeader({ title, subtitle, onMenu }: Props) {
  return (
    <View style={s.header}>
      <TouchableOpacity testID="menu-btn" style={s.menuBtn} onPress={onMenu}>
        <View style={s.bar} /><View style={[s.bar, s.barShort]} /><View style={s.bar} />
      </TouchableOpacity>
      <View style={s.titles}>
        <Text style={s.title}>{title}</Text>
        {subtitle && <Text style={s.sub}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, backgroundColor: C.bg },
  menuBtn: { width: 44, height: 44, justifyContent: 'center', gap: 5, paddingLeft: 4 },
  bar: { width: 22, height: 2, backgroundColor: C.text, borderRadius: 1 },
  barShort: { width: 16 },
  titles: { marginLeft: 4 },
  title: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  sub: { fontSize: 10, color: C.textTer, marginTop: 1 },
});
