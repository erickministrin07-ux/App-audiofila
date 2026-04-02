import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { PlayerProvider } from '../src/context/PlayerContext';

const COLORS = {
  background: '#0A0A0A',
  surface: '#121212',
  primary: '#06B6D4',
  textMuted: '#A1A1AA',
  border: 'rgba(255, 255, 255, 0.12)',
};

export default function RootLayout() {
  return (
    <PlayerProvider>
      <View style={styles.root}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarLabelStyle: styles.tabLabel,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Biblioteca',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="library" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="nowplaying"
            options={{
              title: 'Reproductor',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="disc" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="equalizer"
            options={{
              title: 'EQ',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="options" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="spectrum"
            options={{
              title: 'Audio',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="pulse" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Config',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="settings" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen name="+html" options={{ href: null }} />
        </Tabs>
      </View>
    </PlayerProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 60,
    paddingBottom: 6,
    paddingTop: 4,
  },
  tabLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
