import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, CARD, formatDuration, formatSampleRate, formatFileSize, isLossless, isHiRes, isMQA } from '../src/constants/theme';
import { usePlayer } from '../src/context/PlayerContext';
import SpectrumBars from '../src/components/SpectrumBars';
import AppHeader from '../src/components/AppHeader';
import { useDrawer } from './_layout';

const { width: SW } = Dimensions.get('window');

export default function NowPlayingScreen() {
  const { currentTrack: t, isPlaying, currentPosition, repeatMode, shuffle, togglePlay, nextTrack, prevTrack, seekTo, setRepeatMode, toggleShuffle } = usePlayer();
  const { toggle } = useDrawer();
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const API = process.env.EXPO_PUBLIC_BACKEND_URL;
  const seekPan = useRef(PanResponder.create({ onStartShouldSetPanResponder:()=>true, onPanResponderGrant:(e)=>doSeek(e.nativeEvent.locationX), onPanResponderMove:(e)=>doSeek(e.nativeEvent.locationX) })).current;
  const doSeek = (x: number) => { if (!t) return; seekTo(Math.floor(Math.max(0,Math.min(1,x/(SW-48)))*t.duration)); };
  const cycleRepeat = () => { const m:('off'|'one'|'all')[]=['off','all','one']; setRepeatMode(m[(m.indexOf(repeatMode)+1)%3]); };
  const analyze = async () => { if(!t) return; setAnalyzing(true); try { const r=await fetch(`${API}/api/songs/${t.id}/analyze`); setAnalysis(await r.json()); } catch(e){} setAnalyzing(false); };

  if (!t) return <SafeAreaView style={s.container} edges={['top']}><AppHeader title="Reproductor" onMenu={toggle} /><View style={s.empty}><Ionicons name="disc-outline" size={56} color={C.textTer} /><Text style={s.emptyText}>Selecciona una pista</Text></View></SafeAreaView>;
  const prog = t.duration>0?currentPosition/t.duration:0;
  const ll=isLossless(t.format); const hr=isHiRes(t.bit_depth,t.sample_rate); const mqa=isMQA(t.format);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <AppHeader title="Reproductor" onMenu={toggle} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.artWrap}><View style={[s.art, CARD]}><Ionicons name="disc" size={60} color={C.primary} /><Text style={s.artFmt}>{t.format}</Text></View></View>
        <View style={s.info}><Text style={s.trackTitle} numberOfLines={1}>{t.title}</Text><Text style={s.trackSub} numberOfLines={1}>{t.artist} — {t.album}</Text>
          <View style={s.badgeRow}>
            {mqa && <View style={[s.qb,{backgroundColor:C.mqaBg,borderColor:C.mqa+'30'}]}><Text style={[s.qbText,{color:C.mqa}]}>MQA</Text></View>}
            {hr && !mqa && <View style={[s.qb,{backgroundColor:C.hiResBg,borderColor:C.hiRes+'30'}]}><Text style={[s.qbText,{color:C.hiRes}]}>Hi-Res</Text></View>}
            {ll && <View style={[s.qb,{backgroundColor:C.primaryDim,borderColor:C.primaryBorder}]}><Text style={[s.qbText,{color:C.primary}]}>LOSSLESS</Text></View>}
            {t.format==='DSD' && <View style={[s.qb,{backgroundColor:C.dsdBg,borderColor:C.dsd+'30'}]}><Text style={[s.qbText,{color:C.dsd}]}>DSD</Text></View>}
          </View>
          <Text style={s.tech}>{t.format==='DSD'?`DSD${Math.round(t.sample_rate/44100)}`:`${t.bit_depth}bit`} / {formatSampleRate(t.sample_rate)} / {t.bitrate}kbps / {formatFileSize(t.file_size)}</Text>
        </View>
        <View style={[s.specCard, CARD]}><SpectrumBars isPlaying={isPlaying} height={48} accent={C.primary} /></View>
        <View style={s.progSection}><View style={s.progBar} {...seekPan.panHandlers}><View style={s.progTrack}><View style={[s.progFill,{width:`${prog*100}%`}]} /></View><View style={[s.progThumb,{left:`${prog*100}%`}]} /></View>
          <View style={s.timeRow}><Text style={s.time}>{formatDuration(currentPosition)}</Text><Text style={s.time}>{formatDuration(t.duration)}</Text></View></View>
        <View style={s.controls}>
          <TouchableOpacity testID="shuffle-btn" onPress={toggleShuffle}><Ionicons name="shuffle-outline" size={22} color={shuffle?C.primary:C.textTer} /></TouchableOpacity>
          <TouchableOpacity testID="prev-btn" onPress={prevTrack}><Ionicons name="play-skip-back" size={26} color={C.text} /></TouchableOpacity>
          <TouchableOpacity testID="play-pause-btn" onPress={togglePlay} style={s.playBtn}><Ionicons name={isPlaying?'pause':'play'} size={28} color={C.surface} /></TouchableOpacity>
          <TouchableOpacity testID="next-btn" onPress={nextTrack}><Ionicons name="play-skip-forward" size={26} color={C.text} /></TouchableOpacity>
          <TouchableOpacity testID="repeat-btn" onPress={cycleRepeat}><Ionicons name="repeat-outline" size={22} color={repeatMode!=='off'?C.primary:C.textTer} />{repeatMode==='one' && <Text style={s.rep1}>1</Text>}</TouchableOpacity>
        </View>
        <TouchableOpacity testID="analyze-btn" style={[s.analyzeBtn, CARD]} onPress={analyze} disabled={analyzing}>
          <Ionicons name="sparkles-outline" size={16} color={C.primary} /><Text style={s.analyzeTxt}>{analyzing?'ANALIZANDO...':'ANALISIS IA DE CALIDAD'}</Text></TouchableOpacity>
        {analysis && <View style={[s.aCard, CARD]}>
          <View style={s.aHead}><View style={s.aCircle}><Text style={s.aScore}>{analysis.quality_score}</Text></View><View style={{flex:1}}><Text style={s.aTier}>{analysis.quality_tier}</Text><Text style={s.aText}>{analysis.analysis}</Text></View></View>
          {analysis.recommendations?.map((r:string,i:number)=><View key={i} style={s.aRec}><Ionicons name="checkmark-circle" size={14} color={C.success} /><Text style={s.aRecText}>{r}</Text></View>)}
        </View>}
        <View style={{height:30}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.bg}, scroll:{paddingHorizontal:20}, empty:{flex:1,justifyContent:'center',alignItems:'center',gap:8}, emptyText:{color:C.textSec,fontSize:14},
  artWrap:{alignItems:'center',paddingVertical:12}, art:{width:SW*0.5,height:SW*0.5,maxWidth:240,maxHeight:240,alignItems:'center',justifyContent:'center',borderRadius:20}, artFmt:{fontFamily:'monospace',fontSize:11,fontWeight:'700',color:C.primary,marginTop:8,letterSpacing:2},
  info:{alignItems:'center',marginBottom:10}, trackTitle:{fontSize:18,fontWeight:'700',color:C.text,marginBottom:3}, trackSub:{fontSize:13,color:C.textSec,marginBottom:8},
  badgeRow:{flexDirection:'row',gap:6,marginBottom:6}, qb:{paddingHorizontal:8,paddingVertical:3,borderWidth:1,borderRadius:8}, qbText:{fontFamily:'monospace',fontSize:9,fontWeight:'700',letterSpacing:0.5},
  tech:{fontFamily:'monospace',fontSize:10,color:C.textTer},
  specCard:{padding:10,marginBottom:10,borderRadius:14}, progSection:{marginBottom:12}, progBar:{height:28,justifyContent:'center',position:'relative'},
  progTrack:{height:3,backgroundColor:C.border,borderRadius:2,overflow:'hidden'}, progFill:{height:'100%',backgroundColor:C.primary,borderRadius:2},
  progThumb:{position:'absolute',width:14,height:14,borderRadius:7,backgroundColor:C.primary,top:7,marginLeft:-7},
  timeRow:{flexDirection:'row',justifyContent:'space-between',marginTop:2}, time:{fontFamily:'monospace',fontSize:10,color:C.textTer},
  controls:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:28,marginBottom:14},
  playBtn:{width:60,height:60,borderRadius:30,backgroundColor:C.primary,alignItems:'center',justifyContent:'center',paddingLeft:2},
  rep1:{fontFamily:'monospace',fontSize:8,fontWeight:'700',color:C.primary,position:'absolute',bottom:-2,alignSelf:'center'},
  analyzeBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:12,borderRadius:14,marginBottom:12},
  analyzeTxt:{fontFamily:'monospace',fontSize:10,fontWeight:'700',color:C.primary,letterSpacing:1},
  aCard:{borderRadius:14,marginBottom:12}, aHead:{flexDirection:'row',alignItems:'center',gap:14,marginBottom:10},
  aCircle:{width:48,height:48,borderRadius:24,borderWidth:2,borderColor:C.primary,alignItems:'center',justifyContent:'center'},
  aScore:{fontFamily:'monospace',fontSize:18,fontWeight:'700',color:C.primary}, aTier:{fontSize:14,fontWeight:'700',color:C.text,marginBottom:2}, aText:{fontSize:11,color:C.textSec},
  aRec:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}, aRecText:{fontSize:11,color:C.textSec,flex:1},
});
