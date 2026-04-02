"""
Backend API Tests for Audiophile Music Player
Tests: Songs, Artists, Genres, Playlists, EQ Presets, Settings, AI Search, AI Analysis
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

class TestHealth:
    """Health check endpoint"""
    
    def test_health_check(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "audiophile-player-api"
        print("✓ Health check passed")


class TestSongs:
    """Song endpoints - GET songs, GET song by ID, filters"""
    
    def test_get_all_songs(self):
        response = requests.get(f"{BASE_URL}/api/songs")
        assert response.status_code == 200
        songs = response.json()
        assert isinstance(songs, list)
        assert len(songs) == 24, f"Expected 24 songs, got {len(songs)}"
        
        # Verify song structure
        song = songs[0]
        required_fields = ['id', 'title', 'artist', 'album', 'genre', 'duration', 'format', 'bit_depth', 'sample_rate', 'bitrate']
        for field in required_fields:
            assert field in song, f"Missing field: {field}"
        print(f"✓ GET /api/songs returned {len(songs)} songs")
    
    def test_get_song_by_id(self):
        # First get all songs to get a valid ID
        songs_response = requests.get(f"{BASE_URL}/api/songs")
        songs = songs_response.json()
        assert len(songs) > 0
        
        song_id = songs[0]['id']
        response = requests.get(f"{BASE_URL}/api/songs/{song_id}")
        assert response.status_code == 200
        song = response.json()
        assert song['id'] == song_id
        assert 'title' in song
        print(f"✓ GET /api/songs/{song_id} returned song: {song['title']}")
    
    def test_get_song_not_found(self):
        response = requests.get(f"{BASE_URL}/api/songs/invalid-id-12345")
        assert response.status_code == 404
        print("✓ GET /api/songs/invalid-id returns 404")
    
    def test_filter_songs_by_genre(self):
        response = requests.get(f"{BASE_URL}/api/songs?genre=Jazz")
        assert response.status_code == 200
        songs = response.json()
        assert isinstance(songs, list)
        for song in songs:
            assert song['genre'] == 'Jazz'
        print(f"✓ Filter by genre=Jazz returned {len(songs)} songs")
    
    def test_filter_songs_by_artist(self):
        response = requests.get(f"{BASE_URL}/api/songs?artist=Miles Davis")
        assert response.status_code == 200
        songs = response.json()
        assert isinstance(songs, list)
        for song in songs:
            assert song['artist'] == 'Miles Davis'
        print(f"✓ Filter by artist='Miles Davis' returned {len(songs)} songs")


class TestAggregations:
    """Artists, Genres, Albums aggregation endpoints"""
    
    def test_get_artists(self):
        response = requests.get(f"{BASE_URL}/api/artists")
        assert response.status_code == 200
        artists = response.json()
        assert isinstance(artists, list)
        assert len(artists) > 0
        
        # Verify artist structure
        artist = artists[0]
        assert 'name' in artist
        assert 'song_count' in artist
        assert 'genres' in artist
        assert artist['song_count'] > 0
        print(f"✓ GET /api/artists returned {len(artists)} artists")
    
    def test_get_genres(self):
        response = requests.get(f"{BASE_URL}/api/genres")
        assert response.status_code == 200
        genres = response.json()
        assert isinstance(genres, list)
        assert len(genres) > 0
        
        # Verify genre structure
        genre = genres[0]
        assert 'name' in genre
        assert 'song_count' in genre
        assert 'artist_count' in genre
        assert genre['song_count'] > 0
        print(f"✓ GET /api/genres returned {len(genres)} genres")
    
    def test_get_albums(self):
        response = requests.get(f"{BASE_URL}/api/albums")
        assert response.status_code == 200
        albums = response.json()
        assert isinstance(albums, list)
        assert len(albums) > 0
        
        # Verify album structure
        album = albums[0]
        assert 'name' in album
        assert 'artist' in album
        assert 'song_count' in album
        print(f"✓ GET /api/albums returned {len(albums)} albums")


class TestAISearch:
    """AI-powered search endpoint"""
    
    def test_search_basic_regex(self):
        response = requests.post(
            f"{BASE_URL}/api/songs/search",
            json={"query": "Bohemian"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        results = response.json()
        assert isinstance(results, list)
        assert len(results) > 0
        assert any('Bohemian' in song['title'] for song in results)
        print(f"✓ Search 'Bohemian' returned {len(results)} results")
    
    def test_search_empty_query(self):
        response = requests.post(
            f"{BASE_URL}/api/songs/search",
            json={"query": ""},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        results = response.json()
        assert results == []
        print("✓ Empty search query returns empty array")
    
    def test_search_ai_fallback(self):
        # Search for something that requires AI understanding
        response = requests.post(
            f"{BASE_URL}/api/songs/search",
            json={"query": "classical piano music"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        results = response.json()
        assert isinstance(results, list)
        print(f"✓ AI search 'classical piano music' returned {len(results)} results")


class TestAIAnalysis:
    """AI audio quality analysis endpoint"""
    
    def test_analyze_song(self):
        # Get a song ID first
        songs_response = requests.get(f"{BASE_URL}/api/songs")
        songs = songs_response.json()
        song_id = songs[0]['id']
        
        response = requests.get(f"{BASE_URL}/api/songs/{song_id}/analyze")
        assert response.status_code == 200
        analysis = response.json()
        
        # Verify analysis structure
        assert 'quality_score' in analysis
        assert 'quality_tier' in analysis
        assert 'analysis' in analysis
        assert 'recommendations' in analysis
        assert 'optimal_settings' in analysis
        
        assert isinstance(analysis['quality_score'], (int, float))
        assert 1 <= analysis['quality_score'] <= 100
        assert analysis['quality_tier'] in ['Ultra HD', 'HD', 'Standard', 'Compressed']
        assert isinstance(analysis['recommendations'], list)
        
        print(f"✓ Analysis for song {song_id}: Score={analysis['quality_score']}, Tier={analysis['quality_tier']}")
    
    def test_analyze_nonexistent_song(self):
        response = requests.get(f"{BASE_URL}/api/songs/invalid-id/analyze")
        assert response.status_code == 404
        print("✓ Analysis of nonexistent song returns 404")


class TestEQPresets:
    """EQ preset endpoints"""
    
    def test_get_eq_presets(self):
        response = requests.get(f"{BASE_URL}/api/eq-presets")
        assert response.status_code == 200
        presets = response.json()
        assert isinstance(presets, list)
        assert len(presets) == 10, f"Expected 10 presets, got {len(presets)}"
        
        # Verify preset structure
        preset = presets[0]
        assert 'id' in preset
        assert 'name' in preset
        assert 'bands' in preset
        assert 'preamp' in preset
        assert 'is_custom' in preset
        assert isinstance(preset['bands'], dict)
        
        # Check for expected preset names
        preset_names = [p['name'] for p in presets]
        expected_presets = ['Flat', 'Rock', 'Jazz', 'Classical', 'Pop']
        for expected in expected_presets:
            assert expected in preset_names, f"Missing preset: {expected}"
        
        print(f"✓ GET /api/eq-presets returned {len(presets)} presets")


class TestPlaylists:
    """Playlist CRUD operations"""
    
    def test_get_playlists_empty(self):
        response = requests.get(f"{BASE_URL}/api/playlists")
        assert response.status_code == 200
        playlists = response.json()
        assert isinstance(playlists, list)
        print(f"✓ GET /api/playlists returned {len(playlists)} playlists")
    
    def test_create_playlist(self):
        # Get some song IDs
        songs_response = requests.get(f"{BASE_URL}/api/songs")
        songs = songs_response.json()
        song_ids = [songs[0]['id'], songs[1]['id']]
        
        response = requests.post(
            f"{BASE_URL}/api/playlists",
            json={"name": "TEST_My Favorites", "song_ids": song_ids},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        playlist = response.json()
        assert playlist['name'] == "TEST_My Favorites"
        assert len(playlist['song_ids']) == 2
        assert 'id' in playlist
        
        # Verify it was persisted
        get_response = requests.get(f"{BASE_URL}/api/playlists")
        playlists = get_response.json()
        assert any(p['id'] == playlist['id'] for p in playlists)
        
        print(f"✓ Created playlist: {playlist['name']} with {len(playlist['song_ids'])} songs")
        return playlist['id']


class TestSettings:
    """Audio settings GET/PUT"""
    
    def test_get_settings(self):
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        settings = response.json()
        
        # Verify settings structure
        required_fields = [
            'bit_perfect', 'processing_64bit', 'output_device', 'sample_rate',
            'buffer_size', 'dither_type', 'resampler_quality', 'preamp',
            'tone_bass', 'tone_treble', 'stereo_mode', 'crossfeed',
            'channel_balance', 'volume_normalization', 'gapless_playback', 'replay_gain'
        ]
        for field in required_fields:
            assert field in settings, f"Missing field: {field}"
        
        assert isinstance(settings['bit_perfect'], bool)
        assert isinstance(settings['processing_64bit'], bool)
        assert isinstance(settings['sample_rate'], int)
        assert settings['sample_rate'] in [44100, 48000, 88200, 96000, 176400, 192000, 352800, 384000]
        
        print(f"✓ GET /api/settings returned settings: sample_rate={settings['sample_rate']}, bit_perfect={settings['bit_perfect']}")
    
    def test_update_settings(self):
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/settings")
        current_settings = get_response.json()
        
        # Update settings
        updated_settings = {**current_settings, 'bit_perfect': True, 'sample_rate': 96000}
        response = requests.put(
            f"{BASE_URL}/api/settings",
            json=updated_settings,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        result = response.json()
        assert result['bit_perfect'] == True
        assert result['sample_rate'] == 96000
        
        # Verify persistence
        verify_response = requests.get(f"{BASE_URL}/api/settings")
        verified = verify_response.json()
        assert verified['bit_perfect'] == True
        assert verified['sample_rate'] == 96000
        
        print(f"✓ Updated settings: bit_perfect={result['bit_perfect']}, sample_rate={result['sample_rate']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
