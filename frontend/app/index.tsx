import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, GLASS } from '../src/constants/theme';
import { usePlayer, Song } from '../src/context/PlayerContext';
import TrackItem from '../src/components/TrackItem';
import GlassBackground from '../src/components/GlassBackground';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const A = COLORS.library;
type Tab = 'songs' | 'artists' | 'genres' | 'playlists';

export default function LibraryScreen() {
  const { songs, loading, loadSongs, currentTrack, isPlaying, playSong } = usePlayer();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('songs');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (tab === 'artists') fetch(`${API_URL}/api/artists`).then(r => r.json()).then(setArtists).catch(() => {});
    if (tab === 'genres') fetch(`${API_URL}/api/genres`).then(r => r.json()).then(setGenres).catch(() => {});
    if (tab === 'playlists') fetch(`${API_URL}/api/playlists`).then(r => r.json()).then(setPlaylists).catch(() => {});
  }, [tab]);

  const search = async () => {
    if (!query.trim()) { setResults(null); return; }
    setSearching(true);
    try {
      const r = await fetch(`${API_URL}/api/songs/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
      setResults(await r.json());
    } catch (e) {}
    setSearching(false);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadSongs(); setRefreshing(false); }, [loadSongs]);
  const play = (s: Song) => { playSong(s, results || songs); router.push('/nowplaying'); };
  const display = results || songs;

  const filterArtist = async (name: string) => {
    setSearching(true);
    try { const r = await fetch(`${API_URL}/api/songs?artist=${encodeURIComponent(name)}`); setResults(await r.json()); setQuery(name); setTab('songs'); } catch (e) {}
    setSearching(false);
  };
  const filterGenre = async (g: string) => {
    setSearching(true);
    try { const r = await fetch(`${API_URL}/api/songs?genre=${encodeURIComponent(g)}`); setResults(await r.json()); setQuery(g); setTab('songs'); } catch (e) {}
    setSearching(false);
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'songs', label: 'Canciones', icon: 'musical-notes-outline' },
    { key: 'artists', label: 'Artistas', icon: 'people-outline' },
    { key: 'genres', label: 'Generos', icon: 'grid-outline' },
    { key: 'playlists', label: 'Listas', icon: 'list-outline' },
  ];

  const GENRE_COLORS: Record<string, string> = { Classical: '#7C3AED', Rock: '#EF4444', Jazz: '#F59E0B', Pop: '#EC4899', Electronic: '#06B6D4' };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GlassBackground accent={A} glowColor={COLORS.libraryGlow} />

      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <View style={[styles.countBadge, { borderColor: A + '30', backgroundColor: A + '10' }]}>
          <Text style={[styles.countText, { color: A }]}>{songs.length}</Text>
        </View>
      </View>

      {/* Glass Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.textTertiary} />
        <TextInput testID="search-input" style={styles.searchInput} placeholder="Buscar con IA..." placeholderTextColor={COLORS.textTertiary}
          value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" />
        {query.length > 0 && <TouchableOpacity testID="search-clear-btn" onPress={() => { setQuery(''); setResults(null); }}><Ionicons name="close-circle" size={18} color={COLORS.textTertiary} /></TouchableOpacity>}
        {searching && <ActivityIndicator size="small" color={A} />}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} testID={`tab-${t.key}`} style={[styles.tabBtn, tab === t.key && styles.tabActive]}
            onPress={() => { setTab(t.key); setResults(null); setQuery(''); }}>
            <Ionicons name={t.icon} size={15} color={tab === t.key ? A : COLORS.textTertiary} />
            <Text style={[styles.tabLabel, tab === t.key && { color: A }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={A} /><Text style={styles.loadText}>Cargando...</Text></View>
      ) : tab === 'songs' ? (
        <FlatList testID="songs-list" data={display} keyExtractor={i => i.id}
          renderItem={({ item, index }) => <TrackItem song={item} index={index} isActive={currentTrack?.id === item.id} isPlaying={currentTrack?.id === item.id && isPlaying} onPress={() => play(item)} accent={A} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={A} />}
          ListEmptyComponent={<View style={styles.center}><Ionicons name="musical-notes-outline" size={44} color={COLORS.textTertiary} /><Text style={styles.emptyText}>Sin resultados</Text></View>}
        />
      ) : tab === 'artists' ? (
        <FlatList testID="artists-list" data={artists} keyExtractor={i => i.name}
          renderItem={({ item }) => (
            <TouchableOpacity testID={`artist-${item.name}`} style={styles.glassRow} onPress={() => filterArtist(item.name)}>
              <View style={[styles.avatar, { backgroundColor: A + '15' }]}><Ionicons name="person-outline" size={20} color={A} /></View>
              <View style={styles.rowInfo}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.rowSub}>{item.song_count} canciones</Text></View>
              <Ionicons name="chevron-forward-outline" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )} />
      ) : tab === 'genres' ? (
        <FlatList testID="genres-list" data={genres} keyExtractor={i => i.name}
          renderItem={({ item }) => {
            const gc = GENRE_COLORS[item.name] || '#6B7280';
            return (
              <TouchableOpacity testID={`genre-${item.name}`} style={styles.glassRow} onPress={() => filterGenre(item.name)}>
                <View style={[styles.avatar, { backgroundColor: gc + '20' }]}><Ionicons name="disc-outline" size={20} color={gc} /></View>
                <View style={styles.rowInfo}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.rowSub}>{item.song_count} pistas — {item.artist_count} artistas</Text></View>
                <Ionicons name="chevron-forward-outline" size={16} color={COLORS.textTertiary} />
              </TouchableOpacity>
            );
          }} />
      ) : (
        <View style={styles.center}><Ionicons name="list-outline" size={44} color={COLORS.textTertiary} /><Text style={styles.emptyText}>Sin listas</Text><Text style={styles.emptySubText}>Reproduce musica para crear listas</Text></View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '300', color: COLORS.textPrimary, letterSpacing: -0.5 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderRadius: 12 },
  countText: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, gap: 10,
    ...GLASS, borderRadius: 16, paddingHorizontal: 16, height: 48,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4, gap: 4 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: 12, backgroundColor: 'transparent',
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.04)' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 0.5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 60 },
  loadText: { color: COLORS.textTertiary, fontFamily: 'monospace', fontSize: 12 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
  emptySubText: { color: COLORS.textTertiary, fontSize: 12 },
  glassRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 2 },
  rowSub: { fontSize: 11, color: COLORS.textTertiary },
});
