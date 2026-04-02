from fastapi import FastAPI, APIRouter, Query, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'audiophile_player')]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Models ──────────────────────────────────────────────────────

class Song(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    artist: str
    album: str
    genre: str
    duration: int
    format: str
    bit_depth: int
    sample_rate: int
    bitrate: int
    file_path: str = ""
    album_art_url: str = ""
    file_size: int = 0
    track_number: int = 0
    year: int = 0

class PlaylistCreate(BaseModel):
    name: str
    song_ids: List[str] = []

class Playlist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    song_ids: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EQPreset(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    bands: Dict[str, float]
    preamp: float = 0.0
    is_custom: bool = False

class AudioSettings(BaseModel):
    bit_perfect: bool = False
    processing_64bit: bool = True
    output_device: str = "default"
    sample_rate: int = 192000
    buffer_size: int = 256
    dither_type: str = "triangular"
    gain: float = 0.0
    resampler_quality: str = "sinc_best"
    preamp: float = 0.0
    tone_bass: float = 0.0
    tone_treble: float = 0.0
    stereo_mode: str = "stereo"
    crossfeed: float = 0.0
    channel_balance: float = 0.0
    volume_normalization: bool = False
    gapless_playback: bool = True
    replay_gain: str = "off"

class SearchQuery(BaseModel):
    query: str

# ─── Seed Data ──────────────────────────────────────────────────

EQ_FREQS = ["31", "62", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"]

SEED_SONGS = [
    {"title": "Nocturne Op. 9 No. 2", "artist": "Frederic Chopin", "album": "Nocturnes", "genre": "Classical", "duration": 272, "format": "FLAC", "bit_depth": 24, "sample_rate": 96000, "bitrate": 2304, "file_size": 78643200, "track_number": 1, "year": 1832},
    {"title": "Bohemian Rhapsody", "artist": "Queen", "album": "A Night at the Opera", "genre": "Rock", "duration": 354, "format": "FLAC", "bit_depth": 24, "sample_rate": 192000, "bitrate": 4608, "file_size": 204013568, "track_number": 11, "year": 1975},
    {"title": "So What", "artist": "Miles Davis", "album": "Kind of Blue", "genre": "Jazz", "duration": 562, "format": "DSD", "bit_depth": 1, "sample_rate": 2822400, "bitrate": 2822, "file_size": 198180864, "track_number": 1, "year": 1959},
    {"title": "Moonlight Sonata", "artist": "Ludwig van Beethoven", "album": "Piano Sonatas", "genre": "Classical", "duration": 900, "format": "WAV", "bit_depth": 32, "sample_rate": 384000, "bitrate": 12288, "file_size": 1382400000, "track_number": 14, "year": 1801},
    {"title": "Hotel California", "artist": "Eagles", "album": "Hotel California", "genre": "Rock", "duration": 391, "format": "FLAC", "bit_depth": 24, "sample_rate": 192000, "bitrate": 4608, "file_size": 225480704, "track_number": 1, "year": 1977},
    {"title": "Take Five", "artist": "Dave Brubeck", "album": "Time Out", "genre": "Jazz", "duration": 324, "format": "FLAC", "bit_depth": 24, "sample_rate": 96000, "bitrate": 2304, "file_size": 93323264, "track_number": 3, "year": 1959},
    {"title": "Billie Jean", "artist": "Michael Jackson", "album": "Thriller", "genre": "Pop", "duration": 294, "format": "AIFF", "bit_depth": 24, "sample_rate": 96000, "bitrate": 2304, "file_size": 84738048, "track_number": 6, "year": 1982},
    {"title": "Comfortably Numb", "artist": "Pink Floyd", "album": "The Wall", "genre": "Rock", "duration": 382, "format": "DSD", "bit_depth": 1, "sample_rate": 5644800, "bitrate": 5645, "file_size": 269877248, "track_number": 22, "year": 1979},
    {"title": "Clair de Lune", "artist": "Claude Debussy", "album": "Suite Bergamasque", "genre": "Classical", "duration": 300, "format": "DSD", "bit_depth": 1, "sample_rate": 2822400, "bitrate": 2822, "file_size": 105840000, "track_number": 3, "year": 1905},
    {"title": "Stairway to Heaven", "artist": "Led Zeppelin", "album": "Led Zeppelin IV", "genre": "Rock", "duration": 482, "format": "FLAC", "bit_depth": 24, "sample_rate": 192000, "bitrate": 4608, "file_size": 277872640, "track_number": 4, "year": 1971},
    {"title": "Wish You Were Here", "artist": "Pink Floyd", "album": "Wish You Were Here", "genre": "Rock", "duration": 334, "format": "FLAC", "bit_depth": 24, "sample_rate": 96000, "bitrate": 2304, "file_size": 96272384, "track_number": 5, "year": 1975},
    {"title": "Blue in Green", "artist": "Miles Davis", "album": "Kind of Blue", "genre": "Jazz", "duration": 327, "format": "FLAC", "bit_depth": 24, "sample_rate": 192000, "bitrate": 4608, "file_size": 188579840, "track_number": 3, "year": 1959},
    {"title": "Autumn Leaves", "artist": "Cannonball Adderley", "album": "Somethin Else", "genre": "Jazz", "duration": 694, "format": "FLAC", "bit_depth": 24, "sample_rate": 96000, "bitrate": 2304, "file_size": 199950336, "track_number": 2, "year": 1958},
    {"title": "The Four Seasons: Spring", "artist": "Antonio Vivaldi", "album": "The Four Seasons", "genre": "Classical", "duration": 625, "format": "DSD", "bit_depth": 1, "sample_rate": 5644800, "bitrate": 5645, "file_size": 441000000, "track_number": 1, "year": 1725},
    {"title": "Smells Like Teen Spirit", "artist": "Nirvana", "album": "Nevermind", "genre": "Rock", "duration": 301, "format": "MP3", "bit_depth": 16, "sample_rate": 44100, "bitrate": 320, "file_size": 12040192, "track_number": 1, "year": 1991},
    {"title": "Blinding Lights", "artist": "The Weeknd", "album": "After Hours", "genre": "Pop", "duration": 200, "format": "AAC", "bit_depth": 16, "sample_rate": 44100, "bitrate": 256, "file_size": 6400000, "track_number": 9, "year": 2020},
    {"title": "Shape of You", "artist": "Ed Sheeran", "album": "Divide", "genre": "Pop", "duration": 233, "format": "OGG", "bit_depth": 16, "sample_rate": 44100, "bitrate": 320, "file_size": 9320448, "track_number": 4, "year": 2017},
    {"title": "Thunderstruck", "artist": "AC/DC", "album": "The Razors Edge", "genre": "Rock", "duration": 292, "format": "FLAC", "bit_depth": 16, "sample_rate": 44100, "bitrate": 1411, "file_size": 51509248, "track_number": 1, "year": 1990},
    {"title": "Requiem: Lacrimosa", "artist": "Wolfgang A. Mozart", "album": "Requiem in D minor", "genre": "Classical", "duration": 210, "format": "WAV", "bit_depth": 24, "sample_rate": 96000, "bitrate": 4608, "file_size": 121080832, "track_number": 7, "year": 1791},
    {"title": "A Love Supreme Pt. 1", "artist": "John Coltrane", "album": "A Love Supreme", "genre": "Jazz", "duration": 462, "format": "ALAC", "bit_depth": 24, "sample_rate": 96000, "bitrate": 2304, "file_size": 133169152, "track_number": 1, "year": 1965},
    {"title": "Ride of the Valkyries", "artist": "Richard Wagner", "album": "Die Walkure", "genre": "Classical", "duration": 315, "format": "FLAC", "bit_depth": 24, "sample_rate": 192000, "bitrate": 4608, "file_size": 181534720, "track_number": 1, "year": 1870},
    {"title": "Purple Rain", "artist": "Prince", "album": "Purple Rain", "genre": "Pop", "duration": 520, "format": "FLAC", "bit_depth": 24, "sample_rate": 96000, "bitrate": 2304, "file_size": 149882880, "track_number": 9, "year": 1984},
    {"title": "My Favorite Things", "artist": "John Coltrane", "album": "My Favorite Things", "genre": "Jazz", "duration": 818, "format": "WAV", "bit_depth": 24, "sample_rate": 192000, "bitrate": 9216, "file_size": 943718400, "track_number": 1, "year": 1961},
    {"title": "Back in Black", "artist": "AC/DC", "album": "Back in Black", "genre": "Rock", "duration": 255, "format": "WMA", "bit_depth": 16, "sample_rate": 44100, "bitrate": 320, "file_size": 10200064, "track_number": 1, "year": 1980},
]

SEED_EQ_PRESETS = [
    {"name": "Flat", "bands": {f: 0.0 for f in EQ_FREQS}, "preamp": 0.0, "is_custom": False},
    {"name": "Rock", "bands": {"31": 4.0, "62": 3.0, "125": 1.0, "250": 0.0, "500": -1.0, "1k": 1.0, "2k": 3.0, "4k": 4.0, "8k": 3.0, "16k": 2.0}, "preamp": -1.0, "is_custom": False},
    {"name": "Jazz", "bands": {"31": 2.0, "62": 3.0, "125": 2.0, "250": 1.0, "500": 0.0, "1k": 0.0, "2k": 1.0, "4k": 2.0, "8k": 3.0, "16k": 3.0}, "preamp": 0.0, "is_custom": False},
    {"name": "Classical", "bands": {"31": 0.0, "62": 0.0, "125": 0.0, "250": 0.0, "500": 0.0, "1k": 0.0, "2k": 0.0, "4k": 2.0, "8k": 3.0, "16k": 3.0}, "preamp": 0.0, "is_custom": False},
    {"name": "Pop", "bands": {"31": -1.0, "62": 0.0, "125": 1.0, "250": 3.0, "500": 4.0, "1k": 3.0, "2k": 1.0, "4k": 0.0, "8k": -1.0, "16k": -1.0}, "preamp": 0.0, "is_custom": False},
    {"name": "Electronic", "bands": {"31": 5.0, "62": 4.0, "125": 2.0, "250": 0.0, "500": -1.0, "1k": 0.0, "2k": 1.0, "4k": 3.0, "8k": 4.0, "16k": 5.0}, "preamp": -2.0, "is_custom": False},
    {"name": "Vocal", "bands": {"31": -2.0, "62": -1.0, "125": 0.0, "250": 2.0, "500": 4.0, "1k": 4.0, "2k": 3.0, "4k": 1.0, "8k": 0.0, "16k": -1.0}, "preamp": 0.0, "is_custom": False},
    {"name": "Bass Boost", "bands": {"31": 6.0, "62": 5.0, "125": 4.0, "250": 2.0, "500": 0.0, "1k": 0.0, "2k": 0.0, "4k": 0.0, "8k": 0.0, "16k": 0.0}, "preamp": -2.0, "is_custom": False},
    {"name": "Treble Boost", "bands": {"31": 0.0, "62": 0.0, "125": 0.0, "250": 0.0, "500": 0.0, "1k": 0.0, "2k": 2.0, "4k": 4.0, "8k": 5.0, "16k": 6.0}, "preamp": -2.0, "is_custom": False},
    {"name": "Loudness", "bands": {"31": 5.0, "62": 4.0, "125": 2.0, "250": 0.0, "500": -2.0, "1k": -1.0, "2k": 0.0, "4k": 2.0, "8k": 4.0, "16k": 5.0}, "preamp": -3.0, "is_custom": False},
]

@app.on_event("startup")
async def seed_data():
    count = await db.songs.count_documents({})
    if count == 0:
        songs = [Song(**s).dict() for s in SEED_SONGS]
        await db.songs.insert_many(songs)
        logger.info(f"Seeded {len(songs)} demo songs")

    eq_count = await db.eq_presets.count_documents({})
    if eq_count == 0:
        presets = [EQPreset(**p).dict() for p in SEED_EQ_PRESETS]
        await db.eq_presets.insert_many(presets)
        logger.info(f"Seeded {len(presets)} EQ presets")

    settings_count = await db.audio_settings.count_documents({})
    if settings_count == 0:
        await db.audio_settings.insert_one({"_key": "default", **AudioSettings().dict()})
        logger.info("Seeded default audio settings")

# ─── Song Endpoints ──────────────────────────────────────────────

@api_router.get("/songs")
async def get_songs(genre: Optional[str] = None, artist: Optional[str] = None):
    query = {}
    if genre:
        query["genre"] = genre
    if artist:
        query["artist"] = artist
    songs = await db.songs.find(query, {"_id": 0}).to_list(1000)
    return songs

@api_router.get("/songs/{song_id}")
async def get_song(song_id: str):
    song = await db.songs.find_one({"id": song_id}, {"_id": 0})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song

@api_router.get("/artists")
async def get_artists():
    pipeline = [
        {"$group": {"_id": "$artist", "song_count": {"$sum": 1}, "genres": {"$addToSet": "$genre"}}},
        {"$project": {"_id": 0, "name": "$_id", "song_count": 1, "genres": 1}},
        {"$sort": {"name": 1}}
    ]
    return await db.songs.aggregate(pipeline).to_list(1000)

@api_router.get("/genres")
async def get_genres():
    pipeline = [
        {"$group": {"_id": "$genre", "song_count": {"$sum": 1}, "artists": {"$addToSet": "$artist"}}},
        {"$project": {"_id": 0, "name": "$_id", "song_count": 1, "artist_count": {"$size": "$artists"}}},
        {"$sort": {"name": 1}}
    ]
    return await db.songs.aggregate(pipeline).to_list(1000)

@api_router.get("/albums")
async def get_albums():
    pipeline = [
        {"$group": {"_id": {"album": "$album", "artist": "$artist"}, "song_count": {"$sum": 1}, "year": {"$first": "$year"}}},
        {"$project": {"_id": 0, "name": "$_id.album", "artist": "$_id.artist", "song_count": 1, "year": 1}},
        {"$sort": {"name": 1}}
    ]
    return await db.songs.aggregate(pipeline).to_list(1000)

# ─── AI Search ──────────────────────────────────────────────────

@api_router.post("/songs/search")
async def search_songs(body: SearchQuery):
    query = body.query.strip()
    if not query:
        return []

    regex_query = {"$or": [
        {"title": {"$regex": query, "$options": "i"}},
        {"artist": {"$regex": query, "$options": "i"}},
        {"album": {"$regex": query, "$options": "i"}},
        {"genre": {"$regex": query, "$options": "i"}},
        {"format": {"$regex": query, "$options": "i"}},
    ]}
    results = await db.songs.find(regex_query, {"_id": 0}).to_list(50)

    if not results:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            api_key = os.environ.get('EMERGENT_LLM_KEY', '')
            if api_key:
                all_songs = await db.songs.find({}, {"_id": 0}).to_list(1000)
                songs_summary = "\n".join([f"- {s['title']} by {s['artist']} [{s['genre']}] ({s['format']} {s['bit_depth']}bit/{s['sample_rate']}Hz)" for s in all_songs])

                chat = LlmChat(
                    api_key=api_key,
                    session_id=f"search-{uuid.uuid4()}",
                    system_message=f"""You are a music search assistant for an audiophile player. Given a user query, return a JSON array of song titles that best match the query from this library:

{songs_summary}

Return ONLY a valid JSON array of matching song titles, e.g. ["Song A", "Song B"]. If no matches, return []."""
                ).with_model("openai", "gpt-4o-mini")

                ai_response = await chat.send_message(UserMessage(text=f"Search: {query}"))
                try:
                    matched_titles = json.loads(ai_response)
                    if matched_titles:
                        results = await db.songs.find(
                            {"title": {"$in": matched_titles}},
                            {"_id": 0}
                        ).to_list(50)
                except json.JSONDecodeError:
                    pass
        except Exception as e:
            logger.error(f"AI search error: {e}")

    return results

# ─── AI Audio Analysis ──────────────────────────────────────────

@api_router.get("/songs/{song_id}/analyze")
async def analyze_song(song_id: str):
    song = await db.songs.find_one({"id": song_id}, {"_id": 0})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get('EMERGENT_LLM_KEY', '')
        if not api_key:
            return _basic_analysis(song)

        chat = LlmChat(
            api_key=api_key,
            session_id=f"analyze-{uuid.uuid4()}",
            system_message="""You are an expert audiophile audio quality analyst. Analyze audio file metadata and return ONLY valid JSON with:
{
  "quality_score": number 1-100,
  "quality_tier": "Ultra HD" | "HD" | "Standard" | "Compressed",
  "analysis": "brief technical analysis string",
  "recommendations": ["rec1", "rec2", "rec3"],
  "optimal_settings": {"sample_rate": number, "bit_depth": number, "output_mode": "string", "processing": "string"}
}"""
        ).with_model("openai", "gpt-4o-mini")

        msg = f"Analyze: {song['title']} by {song['artist']} - {song['format']} {song['bit_depth']}bit/{song['sample_rate']}Hz, {song['bitrate']}kbps, {song.get('file_size', 0)} bytes"
        response = await chat.send_message(UserMessage(text=msg))
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return _basic_analysis(song)
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return _basic_analysis(song)


def _basic_analysis(song):
    lossless = song['format'] in ['FLAC', 'WAV', 'AIFF', 'ALAC', 'DSD']
    hires = song['bit_depth'] >= 24 or song['sample_rate'] > 48000
    score = 50
    if lossless:
        score += 25
    if hires:
        score += 25
    tier = "Ultra HD" if score >= 90 else "HD" if score >= 70 else "Standard" if score >= 50 else "Compressed"
    return {
        "quality_score": score,
        "quality_tier": tier,
        "analysis": f"{song['format']} {song['bit_depth']}bit/{song['sample_rate']}Hz - {'Lossless' if lossless else 'Lossy'} {'Hi-Res' if hires else 'Standard Resolution'}",
        "recommendations": [
            f"Bit-Perfect mode: {'Recommended' if lossless else 'Optional'}",
            f"64-bit processing: {'Highly recommended' if hires else 'Optional'}",
            f"Optimal sample rate: {song['sample_rate']}Hz",
        ],
        "optimal_settings": {
            "sample_rate": song['sample_rate'],
            "bit_depth": song['bit_depth'],
            "output_mode": "bit-perfect" if lossless else "standard",
            "processing": "64-bit float" if hires else "32-bit float",
        }
    }

# ─── Playlist Endpoints ──────────────────────────────────────────

@api_router.get("/playlists")
async def get_playlists():
    return await db.playlists.find({}, {"_id": 0}).to_list(100)

@api_router.post("/playlists")
async def create_playlist(data: PlaylistCreate):
    playlist = Playlist(name=data.name, song_ids=data.song_ids)
    await db.playlists.insert_one(playlist.dict())
    return playlist.dict()

@api_router.put("/playlists/{playlist_id}")
async def update_playlist(playlist_id: str, data: PlaylistCreate):
    result = await db.playlists.update_one(
        {"id": playlist_id},
        {"$set": {"name": data.name, "song_ids": data.song_ids}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    updated = await db.playlists.find_one({"id": playlist_id}, {"_id": 0})
    return updated

@api_router.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str):
    result = await db.playlists.delete_one({"id": playlist_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"status": "deleted"}

@api_router.post("/playlists/{playlist_id}/songs/{song_id}")
async def add_song_to_playlist(playlist_id: str, song_id: str):
    result = await db.playlists.update_one(
        {"id": playlist_id},
        {"$addToSet": {"song_ids": song_id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"status": "added"}

# ─── EQ Preset Endpoints ──────────────────────────────────────────

@api_router.get("/eq-presets")
async def get_eq_presets():
    return await db.eq_presets.find({}, {"_id": 0}).to_list(100)

@api_router.post("/eq-presets")
async def create_eq_preset(data: EQPreset):
    data.is_custom = True
    await db.eq_presets.insert_one(data.dict())
    return data.dict()

@api_router.delete("/eq-presets/{preset_id}")
async def delete_eq_preset(preset_id: str):
    result = await db.eq_presets.delete_one({"id": preset_id, "is_custom": True})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Preset not found or is system preset")
    return {"status": "deleted"}

# ─── Audio Settings Endpoints ──────────────────────────────────

@api_router.get("/settings")
async def get_settings():
    settings = await db.audio_settings.find_one({"_key": "default"}, {"_id": 0, "_key": 0})
    if not settings:
        return AudioSettings().dict()
    return settings

@api_router.put("/settings")
async def update_settings(data: AudioSettings):
    await db.audio_settings.update_one(
        {"_key": "default"},
        {"$set": data.dict()},
        upsert=True
    )
    return data.dict()

# ─── Health ──────────────────────────────────────────────────────

@api_router.get("/health")
async def health():
    return {"status": "ok", "service": "audiophile-player-api"}

# Include router & middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
