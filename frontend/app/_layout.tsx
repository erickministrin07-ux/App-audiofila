import React, { useState, createContext, useContext, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { PlayerProvider } from '../src/context/PlayerContext';
import DrawerMenu from '../src/components/DrawerMenu';

const DrawerCtx = createContext({ open: false, toggle: () => {}, close: () => {} });
export function useDrawer() { return useContext(DrawerCtx); }

export default function RootLayout() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen(p => !p), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <PlayerProvider>
      <DrawerCtx.Provider value={{ open, toggle, close }}>
        <View style={s.root}>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="nowplaying" />
            <Stack.Screen name="equalizer" />
            <Stack.Screen name="dsp" />
            <Stack.Screen name="audiosettings" />
            <Stack.Screen name="connections" />
            <Stack.Screen name="compressor" />
            <Stack.Screen name="toneboosters" />
            <Stack.Screen name="aienhancer" />
          </Stack>
          {open && <DrawerMenu onClose={close} />}
        </View>
      </DrawerCtx.Provider>
    </PlayerProvider>
  );
}

const s = StyleSheet.create({ root: { flex: 1, backgroundColor: '#F2F2F7' } });
