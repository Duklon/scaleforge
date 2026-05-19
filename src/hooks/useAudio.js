import * as Tone from 'tone'
import { useRef } from 'react'
import { ALL_NOTES } from '../data/scales'

// ── PIANO SAMPLER ─────────────────────────────────────────────────────────
// Uses the free Salamander Grand Piano samples hosted on GitHub
// Falls back to oscillator synth if samples haven't loaded yet

const SAMPLE_BASE = 'https://tonejs.github.io/audio/salamander/'

// Sparse set of sampled notes — Tone.js interpolates between them
const SAMPLE_NOTES = {
  'A0':  SAMPLE_BASE + 'A0.mp3',
  'C1':  SAMPLE_BASE + 'C1.mp3',
  'D#1': SAMPLE_BASE + 'Ds1.mp3',
  'F#1': SAMPLE_BASE + 'Fs1.mp3',
  'A1':  SAMPLE_BASE + 'A1.mp3',
  'C2':  SAMPLE_BASE + 'C2.mp3',
  'D#2': SAMPLE_BASE + 'Ds2.mp3',
  'F#2': SAMPLE_BASE + 'Fs2.mp3',
  'A2':  SAMPLE_BASE + 'A2.mp3',
  'C3':  SAMPLE_BASE + 'C3.mp3',
  'D#3': SAMPLE_BASE + 'Ds3.mp3',
  'F#3': SAMPLE_BASE + 'Fs3.mp3',
  'A3':  SAMPLE_BASE + 'A3.mp3',
  'C4':  SAMPLE_BASE + 'C4.mp3',
  'D#4': SAMPLE_BASE + 'Ds4.mp3',
  'F#4': SAMPLE_BASE + 'Fs4.mp3',
  'A4':  SAMPLE_BASE + 'A4.mp3',
  'C5':  SAMPLE_BASE + 'C5.mp3',
  'D#5': SAMPLE_BASE + 'Ds5.mp3',
  'F#5': SAMPLE_BASE + 'Fs5.mp3',
  'A5':  SAMPLE_BASE + 'A5.mp3',
  'C6':  SAMPLE_BASE + 'C6.mp3',
  'D#6': SAMPLE_BASE + 'Ds6.mp3',
  'F#6': SAMPLE_BASE + 'Fs6.mp3',
  'A6':  SAMPLE_BASE + 'A6.mp3',
  'C7':  SAMPLE_BASE + 'C7.mp3',
}

// Singleton sampler — created once, reused everywhere
let _sampler = null
let _samplerReady = false
let _samplerLoading = false
const _readyCallbacks = []

function onSamplerReady(cb) {
  if (_samplerReady) { cb(); return }
  _readyCallbacks.push(cb)
}

function initSampler() {
  if (_sampler || _samplerLoading) return
  _samplerLoading = true
  _sampler = new Tone.Sampler({
    urls: SAMPLE_NOTES,
    release: 1.2,
    onload: () => {
      _samplerReady = true
      _samplerLoading = false
      _readyCallbacks.forEach(cb => cb())
      _readyCallbacks.length = 0
    },
    onerror: (err) => {
      console.warn('Piano samples failed to load, using synth fallback:', err)
      _samplerLoading = false
    }
  }).toDestination()
}

// Start loading samples as soon as module is imported
initSampler()

export function getSamplerReady() { return _samplerReady }

// ── AUDIO CONTEXT UNLOCK ──────────────────────────────────────────────────
export function unlockAudio() {
  Tone.start()
  // Also resume the underlying Web Audio context
  const ctx = Tone.getContext().rawContext
  if (ctx && ctx.state === 'suspended') ctx.resume()
}

// ── OSCILLATOR FALLBACK ───────────────────────────────────────────────────
let _audioCtx = null
function getCtx() {
  if (!_audioCtx) _audioCtx = Tone.getContext().rawContext
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

// A4 = 440Hz
export function noteToFreq(note, octave) {
  const idx = ALL_NOTES.indexOf(note)
  const semitones = (octave - 4) * 12 + (idx - 9)
  return 440 * Math.pow(2, semitones / 12)
}

export function noteNameToFreq(full) {
  const m = full.match(/^([A-G]#?)(\d)$/)
  return m ? noteToFreq(m[1], parseInt(m[2])) : 261.63
}

// Fallback synth note (triangle wave) when sampler not ready
function playFallback(freq, duration) {
  const ctx = getCtx()
  const t   = ctx.currentTime
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  const filt = ctx.createBiquadFilter()
  osc.type = 'triangle'
  osc.frequency.value = freq
  filt.type = 'lowpass'; filt.frequency.value = 2200
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.3, t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination)
  osc.start(t); osc.stop(t + duration + 0.05)
}

// ── PUBLIC API ────────────────────────────────────────────────────────────
// Play a note name like "C4", "Eb4", "F#3"
export function playPianoNote(noteName, duration = 1.2) {
  unlockAudio()
  if (!noteName) return

  if (_samplerReady && _sampler) {
    try {
      // Convert flat names to sharp for Tone.js (e.g. Eb4 → D#4)
      const FLAT_TO_SHARP = { 'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#' }
      const m = noteName.match(/^([A-G]b?)(\d)$/)
      let toneNote = noteName
      if (m && FLAT_TO_SHARP[m[1]]) {
        toneNote = FLAT_TO_SHARP[m[1]] + m[2]
      }
      _sampler.triggerAttackRelease(toneNote, duration)
      return
    } catch (e) {
      console.warn('Sampler error, using fallback', e)
    }
  }

  // Fallback — use oscillator
  const FLAT_TO_SHARP_FREQ = { Db:'C#', Eb:'D#', Gb:'F#', Ab:'G#', Bb:'A#' }
  const m2 = noteName.match(/^([A-G]b?)(\d)$/)
  let lookupName = noteName
  if (m2 && FLAT_TO_SHARP_FREQ[m2[1]]) lookupName = FLAT_TO_SHARP_FREQ[m2[1]] + m2[2]
  const mSharp = lookupName.match(/^([A-G]#?)(\d)$/)
  if (mSharp) {
    const freq = noteToFreq(mSharp[1], parseInt(mSharp[2]))
    playFallback(freq, duration)
  }
}

// ── HOOK ──────────────────────────────────────────────────────────────────
export function useAudio() {
  const activeNodes = useRef([])

  function stopAll() {
    activeNodes.current.forEach(n => { try { n.stop() } catch (_) {} })
    activeNodes.current = []
    if (_sampler) {
      try { _sampler.releaseAll() } catch (_) {}
    }
  }

  // Used by Scales page — plays note name + octave separately
  function playNote(note, octave, duration = 0.8, delay = 0) {
    unlockAudio()
    if (delay > 0) {
      setTimeout(() => playPianoNote(note + octave, duration), delay * 1000)
    } else {
      playPianoNote(note + octave, duration)
    }
  }

  // Used by MTD glide/sigh exercises — oscillator glide
  function playToneHz(freq, dur = 1.5, wave = 'sine', vol = 0.22) {
    const ctx = getCtx()
    const t   = ctx.currentTime
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = wave; osc.frequency.value = freq
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol, t + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(t); osc.stop(t + dur + 0.1)
    activeNodes.current.push(osc)
  }

  function playGlide(startFreq, endFreq, dur = 2.0) {
    const ctx = getCtx()
    const t   = ctx.currentTime
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(startFreq, t)
    osc.frequency.linearRampToValueAtTime(endFreq, t + dur)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.1)
    gain.gain.setValueAtTime(0.18, t + dur - 0.1)
    gain.gain.linearRampToValueAtTime(0, t + dur)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(t); osc.stop(t + dur + 0.1)
    activeNodes.current.push(osc)
  }

  function playTrill(dur = 20) {
    const ctx  = getCtx()
    const osc  = ctx.createOscillator()
    const lfo  = ctx.createOscillator()
    const lfoG = ctx.createGain()
    const gain = ctx.createGain()
    osc.type = 'sine'; osc.frequency.value = 220
    lfo.type = 'sine'; lfo.frequency.value = 8
    lfoG.gain.value = 14; gain.gain.value = 0.14
    lfo.connect(lfoG); lfoG.connect(osc.frequency)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); lfo.start()
    osc.stop(ctx.currentTime + dur); lfo.stop(ctx.currentTime + dur)
    activeNodes.current.push(osc, lfo)
  }

  return { playNote, playToneHz, playGlide, playTrill, stopAll }
}
