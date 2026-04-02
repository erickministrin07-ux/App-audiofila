import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { PlayerProvider } from '../src/context/PlayerContext';

const C = {
  bg: '#050505',
  glass: 'rgba(10, 10, 15, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  library: '#FF6B6B',
  nowPlaying: '#2D5BFF',
  equalizer: '#CDFF00',
  spectrum: '#FF8A00',
  settings: '#E0F2FE',
  inactive: 'rgba(255, 255, 255, 0.25)',
};

const TAB_COLORS: Record<string, string> = {
  index: C.library,
  nowplaying: C.nowPlaying,
  equalizer: C.equalizer,
  spectrum: C.spectrum,
  settings: C.settings,
};

export default function RootLayout() {
  return (
    <PlayerProvider>
      <View style={styles.root}>
        <Tabs
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: TAB_COLORS[route.name] || '#FFF',
            tabBarInactiveTintColor: C.inactive,
            tabBarLabelStyle: styles.tabLabel,
            tabBarItemStyle: styles.tabItem,
          })}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Biblioteca',
              tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="nowplaying"
            options={{
              title: 'Reproductor',
              tabBarIcon: ({ color, size }) => <Ionicons name="disc-outline" size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="equalizer"
            options={{
              title: 'EQ',
              tabBarIcon: ({ color, size }) => <Ionicons name="options-outline" size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="spectrum"
            options={{
              title: 'Audio',
              tabBarIcon: ({ color, size }) => <Ionicons name="pulse-outline" size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Config',
              tabBarIcon: ({ color, size }) => <Ionicons name="cog-outline" size={22} color={color} />,
            }}
          />
          <Tabs.Screen name="+html" options={{ href: null }} />
        </Tabs>
      </View>
    </PlayerProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  tabBar: {
    backgroundColor: C.glass,
    borderTopWidth: 1,
    borderTopColor: C.border,
    height: 64,
    paddingBottom: 6,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tabItem: { paddingTop: 2 },
});
