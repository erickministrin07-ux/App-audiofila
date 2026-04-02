import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, formatDuration } from '../src/constants/theme';
import { usePlayer, Song } from '../src/context/PlayerContext';
import TrackItem from '../src/components/TrackItem';
import FormatBadge from '../src/components/FormatBadge';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type LibTab = 'songs' | 'artists' | 'genres' | 'playlists';

export default function LibraryScreen() {
  const { songs, loading, loadSongs, currentTrack, isPlaying, playSong } = usePlayer();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LibTab>('songs');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeTab === 'artists') fetchArtists();
    if (activeTab === 'genres') fetchGenres();
    if (activeTab === 'playlists') fetchPlaylists();
  }, [activeTab]);

  const fetchArtists = async () => {
    try { const r = await fetch(`${API_URL}/api/artists`); setArtists(await r.json()); } catch (e) { console.error(e); }
  };
  const fetchGenres = async () => {
    try { const r = await fetch(`${API_URL}/api/genres`); setGenres(await r.json()); } catch (e) { console.error(e); }
  };
  const fetchPlaylists = async () => {
    try { const r = await fetch(`${API_URL}/api/playlists`); setPlaylists(await r.json()); } catch (e) { console.error(e); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const r = await fetch(`${API_URL}/api/songs/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      setSearchResults(await r.json());
    } catch (e) { console.error(e); }
    setSearching(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSongs();
    setRefreshing(false);
  }, [loadSongs]);

  const handlePlay = (song: Song) => {
    const list = searchResults || songs;
    playSong(song, list);
    router.push('/nowplaying');
  };

  const displaySongs = searchResults || songs;

  const tabs: { key: LibTab; label: string; icon: string }[] = [
    { key: 'songs', label: 'Canciones', icon: 'musical-notes' },
    { key: 'artists', label: 'Artistas', icon: 'people' },
    { key: 'genres', label: 'Generos', icon: 'grid' },
    { key: 'playlists', label: 'Listas', icon: 'list' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BIBLIOTECA</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerCount}>{songs.length} PISTAS</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textDim} style={styles.searchIcon} />
        <TextInput
          testID="search-input"
          style={styles.searchInput}
          placeholder="Buscar con IA..."
          placeholderTextColor={COLORS.textDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity testID="search-clear-btn" onPress={() => { setSearchQuery(''); setSearchResults(null); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textDim} />
          </TouchableOpacity>
        )}
        {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>

      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            testID={`tab-${tab.key}`}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => { setActiveTab(tab.key); setSearchResults(null); setSearchQuery(''); }}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? COLORS.primary : COLORS.textDim}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando biblioteca...</Text>
        </View>
      ) : activeTab === 'songs' ? (
        <FlatList
          testID="songs-list"
          data={displaySongs}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <TrackItem
              song={item}
              index={index}
              isActive={currentTrack?.id === item.id}
              isPlaying={currentTrack?.id === item.id && isPlaying}
              onPress={() => handlePlay(item)}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={48} color={COLORS.textDim} />
              <Text style={styles.emptyText}>No se encontraron canciones</Text>
            </View>
          }
        />
      ) : activeTab === 'artists' ? (
        <FlatList
          testID="artists-list"
          data={artists}
          keyExtractor={item => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`artist-${item.name}`}
              style={styles.listItem}
              onPress={() => { setActiveTab('songs'); setSearchQuery(item.name); handleSearchByArtist(item.name); }}
            >
              <View style={styles.listItemIcon}>
                <Ionicons name="person" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>{item.name}</Text>
                <Text style={styles.listItemSub}>{item.song_count} canciones — {item.genres.join(', ')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textDim} />
            </TouchableOpacity>
          )}
        />
      ) : activeTab === 'genres' ? (
        <FlatList
          testID="genres-list"
          data={genres}
          keyExtractor={item => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`genre-${item.name}`}
              style={styles.listItem}
              onPress={() => { setActiveTab('songs'); filterByGenre(item.name); }}
            >
              <View style={[styles.listItemIcon, { backgroundColor: genreColor(item.name) }]}>
                <Ionicons name="disc" size={22} color={COLORS.textMain} />
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>{item.name}</Text>
                <Text style={styles.listItemSub}>{item.song_count} canciones — {item.artist_count} artistas</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textDim} />
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.playlistContainer}>
          {playlists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={48} color={COLORS.textDim} />
              <Text style={styles.emptyText}>No hay listas de reproduccion</Text>
              <Text style={styles.emptySubText}>Las listas se crearan automaticamente</Text>
            </View>
          ) : (
            <FlatList
              testID="playlists-list"
              data={playlists}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.listItem}>
                  <View style={styles.listItemIcon}>
                    <Ionicons name="list" size={22} color={COLORS.primary} />
                  </View>
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemTitle}>{item.name}</Text>
                    <Text style={styles.listItemSub}>{item.song_ids.length} canciones</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );

  async function handleSearchByArtist(name: string) {
    setSearching(true);
    try {
      const r = await fetch(`${API_URL}/api/songs?artist=${encodeURIComponent(name)}`);
      setSearchResults(await r.json());
      setSearchQuery(name);
      setActiveTab('songs');
    } catch (e) { console.error(e); }
    setSearching(false);
  }

  async function filterByGenre(genre: string) {
    setSearching(true);
    try {
      const r = await fetch(`${API_URL}/api/songs?genre=${encodeURIComponent(genre)}`);
      setSearchResults(await r.json());
      setSearchQuery(genre);
    } catch (e) { console.error(e); }
    setSearching(false);
  }
}

function genreColor(genre: string): string {
  const colors: Record<string, string> = {
    'Classical': '#7C3AED', 'Rock': '#DC2626', 'Jazz': '#D97706',
    'Pop': '#EC4899', 'Electronic': '#06B6D4',
  };
  return colors[genre] || '#4B5563';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20, fontWeight: '700', color: COLORS.textMain, letterSpacing: 2,
  },
  headerBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryDim, borderRadius: 2,
  },
  headerCount: {
    fontFamily: 'monospace', fontSize: 10, fontWeight: '700',
    color: COLORS.primary, letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    marginBottom: 8, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 2,
    paddingHorizontal: 12, height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1, color: COLORS.textMain, fontSize: 14, fontFamily: 'monospace',
  },
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: COLORS.border, marginBottom: 0,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 6,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 11, fontWeight: '600', color: COLORS.textDim, letterSpacing: 0.5 },
  tabTextActive: { color: COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: COLORS.textMuted, fontFamily: 'monospace', fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  emptySubText: { color: COLORS.textDim, fontSize: 12 },
  listItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  listItemIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryDim,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  listItemInfo: { flex: 1 },
  listItemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textMain, marginBottom: 2 },
  listItemSub: { fontSize: 12, color: COLORS.textMuted },
  playlistContainer: { flex: 1 },
});
