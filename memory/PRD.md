# Reproductor de Musica Audiofilo - PRD

## Vision
Reproductor de musica para Android de alta fidelidad inspirado en Neutron Player, con interfaz glassmorphism ultra-moderna, busqueda y analisis de audio potenciados por IA, y configuracion audiofila completa.

## Funcionalidades Core

### 1. Biblioteca Musical (Coral #FF6B6B)
- Lista de canciones con badges de formato (FLAC, DSD, WAV, AIFF, ALAC, MP3, AAC, OGG, WMA)
- Sub-tabs: Canciones, Artistas, Generos, Listas de Reproduccion
- Busqueda global con IA (OpenAI GPT-4o-mini) - busqueda semantica
- Pull-to-refresh, indicadores de calidad por pista

### 2. Reproductor (Azul Electrico #2D5BFF)
- Arte de album con efecto glass
- Badges de formato: LOSSLESS, HI-RES, readout tecnico completo
- Controles: Play/Pause, Next, Prev, Shuffle, Repeat (off/one/all)
- Barra de progreso con seek tactil
- Espectro animado mini
- Analisis de calidad IA (score 1-100, tier, recomendaciones)

### 3. Ecualizador (Lima #CDFF00)
- 3 modos: Presets, 10 Bandas, 31 Bandas Parametrico
- 10 presets: Flat, Rock, Jazz, Classical, Pop, Electronic, Vocal, Bass Boost, Treble Boost, Loudness
- Sliders verticales con feedback visual neon
- Control de pre-amplificacion (-12 a +12 dB)
- Toggle ON/OFF, boton RESET

### 4. Audio/Espectro (Naranja #FF8A00)
- Visualizador de espectro animado (32 barras, 60fps)
- Controles de procesamiento: Pre-amp, Tono Graves, Tono Agudos, Crossfeed, Balance
- Modos estereo: Stereo, Mono, Reverse, Mid-Side
- Persistencia de configuracion en MongoDB

### 5. Configuracion (Azul Hielo #E0F2FE)
- Motor de Audio: Bit-Perfect, 64-bit, Gapless, Normalizacion
- Dispositivo de Salida: default, OpenSL ES, AAudio, USB DAC, Bluetooth A2DP, HDMI
- Frecuencia de Muestreo: 44.1kHz a 384kHz
- Buffer: 64 a 4096
- DSP: Dither (none/rectangular/triangular/noise_shaped), Resampler, Replay Gain
- Formatos Soportados: FLAC, DSD, WAV, AIFF, ALAC, MP3, AAC, OGG, WMA

## Stack Tecnico
- **Frontend**: Expo React Native (SDK 54), expo-router tabs
- **Backend**: FastAPI + Motor (MongoDB async)
- **IA**: OpenAI GPT-4o-mini via emergentintegrations
- **Base de datos**: MongoDB (songs, playlists, eq_presets, audio_settings)
- **Diseno**: Glassmorphism con colores vividos por seccion, fondo deep space (#050505)

## Datos Semilla
- 24 canciones demo en multiples formatos y calidades
- 10 presets de ecualizador
- Configuracion de audio por defecto optimizada

## Mejora de Negocio Sugerida
Modelo freemium: version gratuita con EQ basico y 5 presets, version premium ($4.99/mes) con EQ 31 bandas parametrico, analisis IA ilimitado, y soporte USB DAC exclusivo.
