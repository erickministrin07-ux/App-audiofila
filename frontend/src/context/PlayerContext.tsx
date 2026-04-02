import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  format: string;
  bit_depth: number;
  sample_rate: number;
  bitrate: number;
  file_size: number;
  track_number: number;
  year: number;
}

interface PlayerContextType {
  songs: Song[];
  loading: boolean;
  loadSongs: () => Promise<void>;
  currentTrack: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentPosition: number;
  repeatMode: 'off' | 'one' | 'all';
  shuffle: boolean;
  playSong: (song: Song, songQueue?: Song[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (position: number) => void;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
  toggleShuffle: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [repeatMode, setRepeatModeState] = useState<'off' | 'one' | 'all'>('off');
  const [shuffle, setShuffle] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTrackRef = useRef<Song | null>(null);
  const queueRef = useRef<Song[]>([]);
  const repeatModeRef = useRef<'off' | 'one' | 'all'>('off');
  const shuffleRef = useRef(false);

  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);

  const loadSongs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/songs`);
      const data = await res.json();
      setSongs(data);
    } catch (e) {
      console.error('Failed to load songs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSongs(); }, [loadSongs]);

  const doNextTrack = useCallback(() => {
    const track = currentTrackRef.current;
    const q = queueRef.current;
    const rm = repeatModeRef.current;
    const sh = shuffleRef.current;
    if (!track || q.length === 0) return;
    if (rm === 'one') {
      setCurrentPosition(0);
      return;
    }
    const idx = q.findIndex(s => s.id === track.id);
    let next: number;
    if (sh) {
      next = Math.floor(Math.random() * q.length);
    } else {
      next = idx + 1;
      if (next >= q.length) {
        if (rm === 'all') { next = 0; } else { setIsPlaying(false); return; }
      }
    }
    setCurrentTrack(q[next]);
    setCurrentPosition(0);
  }, []);

  useEffect(() => {
    if (isPlaying && currentTrack) {
      intervalRef.current = setInterval(() => {
        setCurrentPosition(prev => {
          const track = currentTrackRef.current;
          if (!track) return 0;
          if (prev >= track.duration) {
            doNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isPlaying, currentTrack, doNextTrack]);

  const playSong = useCallback((song: Song, songQueue?: Song[]) => {
    setCurrentTrack(song);
    setCurrentPosition(0);
    setIsPlaying(true);
    if (songQueue) setQueue(songQueue);
  }, []);

  const togglePlay = useCallback(() => setIsPlaying(prev => !prev), []);

  const nextTrack = useCallback(() => {
    const track = currentTrackRef.current;
    const q = queueRef.current;
    if (!track || q.length === 0) return;
    const idx = q.findIndex(s => s.id === track.id);
    let next = shuffleRef.current ? Math.floor(Math.random() * q.length) : (idx + 1) % q.length;
    setCurrentTrack(q[next]);
    setCurrentPosition(0);
  }, []);

  const prevTrack = useCallback(() => {
    const track = currentTrackRef.current;
    const q = queueRef.current;
    if (!track || q.length === 0) return;
    if (currentPosition > 3) { setCurrentPosition(0); return; }
    const idx = q.findIndex(s => s.id === track.id);
    const prev = idx > 0 ? idx - 1 : q.length - 1;
    setCurrentTrack(q[prev]);
    setCurrentPosition(0);
  }, [currentPosition]);

  const seekTo = useCallback((pos: number) => setCurrentPosition(pos), []);
  const setRepeatMode = useCallback((m: 'off' | 'one' | 'all') => setRepeatModeState(m), []);
  const toggleShuffle = useCallback(() => setShuffle(prev => !prev), []);

  return (
    <PlayerContext.Provider value={{
      songs, loading, loadSongs,
      currentTrack, queue, isPlaying, currentPosition,
      repeatMode, shuffle,
      playSong, togglePlay, nextTrack, prevTrack,
      seekTo, setRepeatMode, toggleShuffle,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}
