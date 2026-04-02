import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { C, CARD, formatDuration, isLossless, isHiRes, isMQA } from '../src/constants/theme';
import { usePlayer, Song } from '../src/context/PlayerContext';
import AppHeader from '../src/components/AppHeader';
import { useDrawer } from './_layout';

const API = process.env.EXPO_PUBLIC_BACKEND_URL;
type Tab = 'songs' | 'artists' | 'genres' | 'playlists';

function QualityBadge({ song }: { song: Song }) {
  if (isMQA(song.format)) return <View style={[st.badge, { backgroundColor: C.mqaBg, borderColor: C.mqa+'30' }]}><Text style={[st.badgeText, { color: C.mqa }]}>MQA</Text></View>;
  if (isHiRes(song.bit_depth, song.sample_rate) && isLossless(song.format)) return <View style={[st.badge, { backgroundColor: C.hiResBg, borderColor: C.hiRes+'30' }]}><Text style={[st.badgeText, { color: C.hiRes }]}>Hi-Res</Text></View>;
  if (song.format === 'DSD') return <View style={[st.badge, { backgroundColor: C.dsdBg, borderColor: C.dsd+'30' }]}><Text style={[st.badgeText, { color: C.dsd }]}>DSD</Text></View>;
  if (isLossless(song.format)) return <View style={[st.badge, { backgroundColor: C.primaryDim, borderColor: C.primaryBorder }]}><Text style={[st.badgeText, { color: C.primary }]}>{song.format}</Text></View>;
  return <View style={[st.badge, { backgroundColor: C.accentDim, borderColor: C.accent+'20' }]}><Text style={[st.badgeText, { color: C.accent }]}>{song.format}</Text></View>;
}

export default function LibraryScreen() {
  const { songs, loading, loadSongs, currentTrack, isPlaying, playSong } = usePlayer();
  const { toggle } = useDrawer();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('songs');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (tab === 'artists') fetch(`${API}/api/artists`).then(r => r.json()).then(setArtists).catch(() => {});
    if (tab === 'genres') fetch(`${API}/api/genres`).then(r => r.json()).then(setGenres).catch(() => {});
  }, [tab]);

  const search = async () => {
    if (!query.trim()) { setResults(null); return; }
    setSearching(true);
    try { const r = await fetch(`${API}/api/songs/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) }); setResults(await r.json()); } catch (e) {}
    setSearching(false);
  };

  const play = (s: Song) => { playSong(s, results || songs); router.push('/nowplaying'); };
  const onRefresh = useCallback(async () => { setRefreshing(true); await loadSongs(); setRefreshing(false); }, [loadSongs]);
  const display = results || songs;
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'songs', label: 'Pistas', icon: 'musical-notes-outline' },
    { key: 'artists', label: 'Artistas', icon: 'people-outline' },
    { key: 'genres', label: 'Generos', icon: 'grid-outline' },
    { key: 'playlists', label: 'Listas', icon: 'list-outline' },
  ];

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <AppHeader title="Biblioteca" subtitle={`${songs.length} pistas`} onMenu={toggle} />
      <View style={st.searchRow}>
        <Ionicons name="search-outline" size={18} color={C.textTer} />
        <TextInput testID="search-input" style={st.searchInput} placeholder="Buscar con IA..." placeholderTextColor={C.textTer}
          value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" />
        {query.length > 0 && <TouchableOpacity onPress={() => { setQuery(''); setResults(null); }}><Ionicons name="close-circle" size={18} color={C.textTer} /></TouchableOpacity>}
        {searching && <ActivityIndicator size="small" color={C.primary} />}
      </View>
      <View style={st.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} testID={`tab-${t.key}`} style={[st.tabBtn, tab === t.key && st.tabActive]}
            onPress={() => { setTab(t.key); setResults(null); setQuery(''); }}>
            <Ionicons name={t.icon} size={15} color={tab === t.key ? C.primary : C.textTer} />
            <Text style={[st.tabLabel, tab === t.key && { color: C.primary }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <View style={st.center}><ActivityIndicator size="large" color={C.primary} /></View>
       : tab === 'songs' ? (
        <FlatList testID="songs-list" data={display} keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          renderItem={({ item, index }) => {
            const active = currentTrack?.id === item.id;
            return (
              <TouchableOpacity testID={`track-item-${item.id}`} style={[st.track, active && st.trackActive]} onPress={() => play(item)} activeOpacity={0.7}>
                <View style={st.trackLeft}>
                  {active && isPlaying ? <Ionicons name="volume-high" size={16} color={C.primary} style={{width:28}} />
                    : <Text style={st.trackIdx}>{(index+1).toString().padStart(2,'0')}</Text>}
                  <View style={st.trackInfo}>
                    <Text style={[st.trackTitle, active && {color:C.primary}]} numberOfLines={1}>{item.title}</Text>
                    <Text style={st.trackSub} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </View>
                <View style={st.trackRight}>
                  <QualityBadge song={item} />
                  <Text style={st.trackDur}>{formatDuration(item.duration)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<View style={st.center}><Text style={st.emptyText}>Sin resultados</Text></View>}
        />
      ) : tab === 'artists' ? (
        <FlatList data={artists} keyExtractor={i => i.name} renderItem={({ item }) => (
          <TouchableOpacity style={st.listRow} onPress={() => { setQuery(item.name); setTab('songs'); fetch(`${API}/api/songs?artist=${encodeURIComponent(item.name)}`).then(r=>r.json()).then(setResults); }}>
            <View style={[st.avatar, {backgroundColor:C.primaryDim}]}><Ionicons name="person-outline" size={20} color={C.primary} /></View>
            <View style={{flex:1}}><Text style={st.listTitle}>{item.name}</Text><Text style={st.listSub}>{item.song_count} pistas</Text></View>
            <Ionicons name="chevron-forward" size={16} color={C.textTer} />
          </TouchableOpacity>
        )} />
      ) : tab === 'genres' ? (
        <FlatList data={genres} keyExtractor={i => i.name} renderItem={({ item }) => (
          <TouchableOpacity style={st.listRow} onPress={() => { setQuery(item.name); setTab('songs'); fetch(`${API}/api/songs?genre=${encodeURIComponent(item.name)}`).then(r=>r.json()).then(setResults); }}>
            <View style={[st.avatar, {backgroundColor:C.accentDim}]}><Ionicons name="disc-outline" size={20} color={C.accent} /></View>
            <View style={{flex:1}}><Text style={st.listTitle}>{item.name}</Text><Text style={st.listSub}>{item.song_count} pistas — {item.artist_count} artistas</Text></View>
            <Ionicons name="chevron-forward" size={16} color={C.textTer} />
          </TouchableOpacity>
        )} />
      ) : <View style={st.center}><Ionicons name="list-outline" size={40} color={C.textTer} /><Text style={st.emptyText}>Sin listas</Text></View>}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, height: 44, gap: 10, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, color: C.text, fontSize: 14 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10 },
  tabActive: { backgroundColor: C.primaryDim },
  tabLabel: { fontSize: 11, fontWeight: '600', color: C.textTer },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 60 },
  emptyText: { color: C.textSec, fontSize: 14 },
  track: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  trackActive: { backgroundColor: C.primaryDim },
  trackLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  trackIdx: { fontFamily: 'monospace', fontSize: 11, color: C.textTer, width: 28 },
  trackInfo: { flex: 1, marginLeft: 8 },
  trackTitle: { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 2 },
  trackSub: { fontSize: 11, color: C.textSec },
  trackRight: { alignItems: 'flex-end', gap: 4 },
  trackDur: { fontFamily: 'monospace', fontSize: 10, color: C.textTer },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderRadius: 6 },
  badgeText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  avatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  listTitle: { fontSize: 15, fontWeight: '500', color: C.text, marginBottom: 2 },
  listSub: { fontSize: 11, color: C.textTer },
});
