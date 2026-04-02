from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, json, uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'audiophile_player')]
app = FastAPI()
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Song(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str; artist: str; album: str; genre: str; duration: int; format: str
    bit_depth: int; sample_rate: int; bitrate: int; file_path: str = ""
    album_art_url: str = ""; file_size: int = 0; track_number: int = 0; year: int = 0

class PlaylistCreate(BaseModel):
    name: str; song_ids: List[str] = []

class Playlist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str; song_ids: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EQPreset(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str; bands: Dict[str, float]; preamp: float = 0.0; is_custom: bool = False

class AudioSettings(BaseModel):
    bit_perfect: bool = False; processing_64bit: bool = True
    output_device: str = "default"; sample_rate: int = 192000; buffer_size: int = 256
    dither_type: str = "triangular"; gain: float = 0.0; resampler_quality: str = "sinc_best"
    preamp: float = 0.0; tone_bass: float = 0.0; tone_treble: float = 0.0
    stereo_mode: str = "stereo"; crossfeed: float = 0.0; channel_balance: float = 0.0
    volume_normalization: bool = False; gapless_playback: bool = True; replay_gain: str = "off"
    output_bit_depth: int = 24; dsd_over_pcm: bool = False
    follow_source_freq: bool = True; output_channels: int = 2; channel_mode: str = "stereo"
    am3d_enabled: bool = False; am3d_intensity: float = 0.5
    crystallizer_enabled: bool = False; crystallizer_intensity: float = 0.5
    bongiovi_enabled: bool = False; bongiovi_profile: str = "standard"
    compressor_enabled: bool = False; compressor_preset: str = "off"
    compressor_threshold: float = -20.0; compressor_ratio: float = 4.0
    compressor_attack: float = 10.0; compressor_release: float = 100.0
    compressor_knee: float = 6.0; compressor_makeup: float = 0.0
    tb_enabled: bool = False; tb_sub: float = 0.0; tb_bass: float = 0.0
    tb_mid: float = 0.0; tb_presence: float = 0.0; tb_air: float = 0.0
    ai_enhancer_enabled: bool = False; ai_enhancer_mode: str = "balanced"

class SearchQuery(BaseModel):
    query: str

class AIEnhanceRequest(BaseModel):
    song_id: str; mode: str = "balanced"

EQ_FREQS = ["31","62","125","250","500","1k","2k","4k","8k","16k"]

SEED_SONGS = [
    {"title":"Nocturne Op. 9 No. 2","artist":"Frederic Chopin","album":"Nocturnes","genre":"Classical","duration":272,"format":"FLAC","bit_depth":24,"sample_rate":96000,"bitrate":2304,"file_size":78643200,"track_number":1,"year":1832},
    {"title":"Bohemian Rhapsody","artist":"Queen","album":"A Night at the Opera","genre":"Rock","duration":354,"format":"FLAC","bit_depth":24,"sample_rate":192000,"bitrate":4608,"file_size":204013568,"track_number":11,"year":1975},
    {"title":"So What","artist":"Miles Davis","album":"Kind of Blue","genre":"Jazz","duration":562,"format":"DSD","bit_depth":1,"sample_rate":2822400,"bitrate":2822,"file_size":198180864,"track_number":1,"year":1959},
    {"title":"Moonlight Sonata","artist":"Ludwig van Beethoven","album":"Piano Sonatas","genre":"Classical","duration":900,"format":"WAV","bit_depth":32,"sample_rate":384000,"bitrate":12288,"file_size":1382400000,"track_number":14,"year":1801},
    {"title":"Hotel California","artist":"Eagles","album":"Hotel California","genre":"Rock","duration":391,"format":"FLAC","bit_depth":24,"sample_rate":192000,"bitrate":4608,"file_size":225480704,"track_number":1,"year":1977},
    {"title":"Take Five","artist":"Dave Brubeck","album":"Time Out","genre":"Jazz","duration":324,"format":"MQA","bit_depth":24,"sample_rate":96000,"bitrate":2304,"file_size":93323264,"track_number":3,"year":1959},
    {"title":"Billie Jean","artist":"Michael Jackson","album":"Thriller","genre":"Pop","duration":294,"format":"AIFF","bit_depth":24,"sample_rate":96000,"bitrate":2304,"file_size":84738048,"track_number":6,"year":1982},
    {"title":"Comfortably Numb","artist":"Pink Floyd","album":"The Wall","genre":"Rock","duration":382,"format":"DSD","bit_depth":1,"sample_rate":5644800,"bitrate":5645,"file_size":269877248,"track_number":22,"year":1979},
    {"title":"Clair de Lune","artist":"Claude Debussy","album":"Suite Bergamasque","genre":"Classical","duration":300,"format":"DSD","bit_depth":1,"sample_rate":2822400,"bitrate":2822,"file_size":105840000,"track_number":3,"year":1905},
    {"title":"Stairway to Heaven","artist":"Led Zeppelin","album":"Led Zeppelin IV","genre":"Rock","duration":482,"format":"FLAC","bit_depth":24,"sample_rate":192000,"bitrate":4608,"file_size":277872640,"track_number":4,"year":1971},
    {"title":"Wish You Were Here","artist":"Pink Floyd","album":"Wish You Were Here","genre":"Rock","duration":334,"format":"MQA","bit_depth":24,"sample_rate":192000,"bitrate":4608,"file_size":96272384,"track_number":5,"year":1975},
    {"title":"Blue in Green","artist":"Miles Davis","album":"Kind of Blue","genre":"Jazz","duration":327,"format":"FLAC","bit_depth":24,"sample_rate":192000,"bitrate":4608,"file_size":188579840,"track_number":3,"year":1959},
    {"title":"The Four Seasons: Spring","artist":"Antonio Vivaldi","album":"The Four Seasons","genre":"Classical","duration":625,"format":"DSD","bit_depth":1,"sample_rate":5644800,"bitrate":5645,"file_size":441000000,"track_number":1,"year":1725},
    {"title":"Smells Like Teen Spirit","artist":"Nirvana","album":"Nevermind","genre":"Rock","duration":301,"format":"MP3","bit_depth":16,"sample_rate":44100,"bitrate":320,"file_size":12040192,"track_number":1,"year":1991},
    {"title":"Blinding Lights","artist":"The Weeknd","album":"After Hours","genre":"Pop","duration":200,"format":"AAC","bit_depth":16,"sample_rate":44100,"bitrate":256,"file_size":6400000,"track_number":9,"year":2020},
    {"title":"Shape of You","artist":"Ed Sheeran","album":"Divide","genre":"Pop","duration":233,"format":"OGG","bit_depth":16,"sample_rate":44100,"bitrate":320,"file_size":9320448,"track_number":4,"year":2017},
    {"title":"Thunderstruck","artist":"AC/DC","album":"The Razors Edge","genre":"Rock","duration":292,"format":"FLAC","bit_depth":16,"sample_rate":44100,"bitrate":1411,"file_size":51509248,"track_number":1,"year":1990},
    {"title":"Requiem: Lacrimosa","artist":"Wolfgang A. Mozart","album":"Requiem in D minor","genre":"Classical","duration":210,"format":"WAV","bit_depth":24,"sample_rate":96000,"bitrate":4608,"file_size":121080832,"track_number":7,"year":1791},
    {"title":"A Love Supreme Pt. 1","artist":"John Coltrane","album":"A Love Supreme","genre":"Jazz","duration":462,"format":"ALAC","bit_depth":24,"sample_rate":96000,"bitrate":2304,"file_size":133169152,"track_number":1,"year":1965},
    {"title":"Ride of the Valkyries","artist":"Richard Wagner","album":"Die Walkure","genre":"Classical","duration":315,"format":"MQA","bit_depth":24,"sample_rate":192000,"bitrate":4608,"file_size":181534720,"track_number":1,"year":1870},
    {"title":"Purple Rain","artist":"Prince","album":"Purple Rain","genre":"Pop","duration":520,"format":"FLAC","bit_depth":24,"sample_rate":96000,"bitrate":2304,"file_size":149882880,"track_number":9,"year":1984},
    {"title":"My Favorite Things","artist":"John Coltrane","album":"My Favorite Things","genre":"Jazz","duration":818,"format":"WAV","bit_depth":24,"sample_rate":192000,"bitrate":9216,"file_size":943718400,"track_number":1,"year":1961},
    {"title":"Back in Black","artist":"AC/DC","album":"Back in Black","genre":"Rock","duration":255,"format":"WMA","bit_depth":16,"sample_rate":44100,"bitrate":320,"file_size":10200064,"track_number":1,"year":1980},
    {"title":"Autumn Leaves","artist":"Cannonball Adderley","album":"Somethin Else","genre":"Jazz","duration":694,"format":"FLAC","bit_depth":24,"sample_rate":96000,"bitrate":2304,"file_size":199950336,"track_number":2,"year":1958},
]

SEED_EQ = [
    {"name":"Flat","bands":{f:0.0 for f in EQ_FREQS},"preamp":0.0,"is_custom":False},
    {"name":"Rock","bands":{"31":4,"62":3,"125":1,"250":0,"500":-1,"1k":1,"2k":3,"4k":4,"8k":3,"16k":2},"preamp":-1.0,"is_custom":False},
    {"name":"Jazz","bands":{"31":2,"62":3,"125":2,"250":1,"500":0,"1k":0,"2k":1,"4k":2,"8k":3,"16k":3},"preamp":0.0,"is_custom":False},
    {"name":"Classical","bands":{"31":0,"62":0,"125":0,"250":0,"500":0,"1k":0,"2k":0,"4k":2,"8k":3,"16k":3},"preamp":0.0,"is_custom":False},
    {"name":"Pop","bands":{"31":-1,"62":0,"125":1,"250":3,"500":4,"1k":3,"2k":1,"4k":0,"8k":-1,"16k":-1},"preamp":0.0,"is_custom":False},
    {"name":"Electronic","bands":{"31":5,"62":4,"125":2,"250":0,"500":-1,"1k":0,"2k":1,"4k":3,"8k":4,"16k":5},"preamp":-2.0,"is_custom":False},
    {"name":"Vocal","bands":{"31":-2,"62":-1,"125":0,"250":2,"500":4,"1k":4,"2k":3,"4k":1,"8k":0,"16k":-1},"preamp":0.0,"is_custom":False},
    {"name":"Bass Boost","bands":{"31":6,"62":5,"125":4,"250":2,"500":0,"1k":0,"2k":0,"4k":0,"8k":0,"16k":0},"preamp":-2.0,"is_custom":False},
    {"name":"Treble Boost","bands":{"31":0,"62":0,"125":0,"250":0,"500":0,"1k":0,"2k":2,"4k":4,"8k":5,"16k":6},"preamp":-2.0,"is_custom":False},
    {"name":"Loudness","bands":{"31":5,"62":4,"125":2,"250":0,"500":-2,"1k":-1,"2k":0,"4k":2,"8k":4,"16k":5},"preamp":-3.0,"is_custom":False},
]

@app.on_event("startup")
async def seed():
    if await db.songs.count_documents({}) == 0:
        await db.songs.insert_many([Song(**s).dict() for s in SEED_SONGS])
    if await db.eq_presets.count_documents({}) == 0:
        await db.eq_presets.insert_many([EQPreset(**p).dict() for p in SEED_EQ])
    if await db.audio_settings.count_documents({}) == 0:
        await db.audio_settings.insert_one({"_key":"default",**AudioSettings().dict()})

@api_router.get("/songs")
async def get_songs(genre: Optional[str]=None, artist: Optional[str]=None):
    q = {};
    if genre: q["genre"]=genre
    if artist: q["artist"]=artist
    return await db.songs.find(q,{"_id":0}).to_list(1000)

@api_router.get("/songs/{sid}")
async def get_song(sid:str):
    s = await db.songs.find_one({"id":sid},{"_id":0})
    if not s: raise HTTPException(404)
    return s

@api_router.get("/artists")
async def get_artists():
    return await db.songs.aggregate([{"$group":{"_id":"$artist","song_count":{"$sum":1},"genres":{"$addToSet":"$genre"}}},{"$project":{"_id":0,"name":"$_id","song_count":1,"genres":1}},{"$sort":{"name":1}}]).to_list(1000)

@api_router.get("/genres")
async def get_genres():
    return await db.songs.aggregate([{"$group":{"_id":"$genre","song_count":{"$sum":1},"artists":{"$addToSet":"$artist"}}},{"$project":{"_id":0,"name":"$_id","song_count":1,"artist_count":{"$size":"$artists"}}},{"$sort":{"name":1}}]).to_list(1000)

@api_router.post("/songs/search")
async def search_songs(body:SearchQuery):
    q = body.query.strip()
    if not q: return []
    r = await db.songs.find({"$or":[{"title":{"$regex":q,"$options":"i"}},{"artist":{"$regex":q,"$options":"i"}},{"album":{"$regex":q,"$options":"i"}},{"genre":{"$regex":q,"$options":"i"}},{"format":{"$regex":q,"$options":"i"}}]},{"_id":0}).to_list(50)
    if not r:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            k = os.environ.get('EMERGENT_LLM_KEY','')
            if k:
                all_s = await db.songs.find({},{"_id":0}).to_list(1000)
                summary = "\n".join([f"- {s['title']} by {s['artist']} [{s['genre']}] ({s['format']})" for s in all_s])
                chat = LlmChat(api_key=k,session_id=f"s-{uuid.uuid4()}",system_message=f"Music search. Library:\n{summary}\nReturn JSON array of matching titles.").with_model("openai","gpt-4o-mini")
                resp = await chat.send_message(UserMessage(text=f"Search: {q}"))
                titles = json.loads(resp)
                if titles: r = await db.songs.find({"title":{"$in":titles}},{"_id":0}).to_list(50)
        except: pass
    return r

@api_router.get("/songs/{sid}/analyze")
async def analyze_song(sid:str):
    s = await db.songs.find_one({"id":sid},{"_id":0})
    if not s: raise HTTPException(404)
    ll = s['format'] in ['FLAC','WAV','AIFF','ALAC','DSD','MQA']
    hr = s['bit_depth']>=24 or s['sample_rate']>48000
    sc = 50+(25 if ll else 0)+(25 if hr else 0)
    tier = "Ultra HD" if sc>=90 else "HD" if sc>=70 else "Standard"
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        k = os.environ.get('EMERGENT_LLM_KEY','')
        if k:
            chat = LlmChat(api_key=k,session_id=f"a-{uuid.uuid4()}",system_message="Audiophile analyst. Return JSON: {quality_score,quality_tier,analysis,recommendations:[],optimal_settings:{}}").with_model("openai","gpt-4o-mini")
            resp = await chat.send_message(UserMessage(text=f"Analyze: {s['title']} - {s['format']} {s['bit_depth']}bit/{s['sample_rate']}Hz {s['bitrate']}kbps"))
            return json.loads(resp)
    except: pass
    return {"quality_score":sc,"quality_tier":tier,"analysis":f"{s['format']} {s['bit_depth']}bit/{s['sample_rate']}Hz","recommendations":[f"Bit-Perfect: {'Yes' if ll else 'Optional'}",f"64-bit: {'Yes' if hr else 'Optional'}"],"optimal_settings":{"sample_rate":s['sample_rate'],"bit_depth":s['bit_depth']}}

@api_router.post("/ai-enhance")
async def ai_enhance(body: AIEnhanceRequest):
    s = await db.songs.find_one({"id":body.song_id},{"_id":0})
    if not s: raise HTTPException(404)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        k = os.environ.get('EMERGENT_LLM_KEY','')
        if k:
            chat = LlmChat(api_key=k,session_id=f"e-{uuid.uuid4()}",system_message="AI audio enhancer. Given a track and mode, return JSON with optimal DSP settings: {eq_adjustments:{bass,mid,treble},spatial_width,clarity_boost,dynamic_range,warmth,recommended_effects:[]}").with_model("openai","gpt-4o-mini")
            resp = await chat.send_message(UserMessage(text=f"Enhance '{s['title']}' ({s['format']} {s['bit_depth']}bit/{s['sample_rate']}Hz) mode={body.mode}"))
            return json.loads(resp)
    except: pass
    modes = {"balanced":{"bass":1,"mid":0,"treble":1},"clarity":{"bass":-1,"mid":2,"treble":3},"warmth":{"bass":3,"mid":1,"treble":-1},"spacious":{"bass":0,"mid":-1,"treble":2},"bass_heavy":{"bass":5,"mid":0,"treble":-1}}
    adj = modes.get(body.mode,modes["balanced"])
    return {"eq_adjustments":adj,"spatial_width":0.6,"clarity_boost":0.5,"dynamic_range":0.7,"warmth":0.5,"recommended_effects":["Am3D","Crystallizer"]}

@api_router.get("/playlists")
async def get_playlists(): return await db.playlists.find({},{"_id":0}).to_list(100)
@api_router.post("/playlists")
async def create_playlist(d:PlaylistCreate):
    p=Playlist(name=d.name,song_ids=d.song_ids); await db.playlists.insert_one(p.dict()); return p.dict()
@api_router.delete("/playlists/{pid}")
async def delete_playlist(pid:str):
    r=await db.playlists.delete_one({"id":pid});
    if r.deleted_count==0: raise HTTPException(404)
    return {"status":"deleted"}

@api_router.get("/eq-presets")
async def get_eq_presets(): return await db.eq_presets.find({},{"_id":0}).to_list(100)
@api_router.post("/eq-presets")
async def create_eq_preset(d:EQPreset): d.is_custom=True; await db.eq_presets.insert_one(d.dict()); return d.dict()

@api_router.get("/settings")
async def get_settings():
    s=await db.audio_settings.find_one({"_key":"default"},{"_id":0,"_key":0})
    return s if s else AudioSettings().dict()
@api_router.put("/settings")
async def update_settings(d:AudioSettings):
    await db.audio_settings.update_one({"_key":"default"},{"$set":d.dict()},upsert=True); return d.dict()

@api_router.get("/health")
async def health(): return {"status":"ok"}

app.include_router(api_router)
app.add_middleware(CORSMiddleware,allow_credentials=True,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown(): client.close()
