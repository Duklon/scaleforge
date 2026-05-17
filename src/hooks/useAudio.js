import { useRef } from 'react'
import { ALL_NOTES } from '../data/scales'

let _audioCtx = null
function getCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return _audioCtx
}

export function noteToFreq(note, octave) {
  const idx = ALL_NOTES.indexOf(note)
  const semitones = (octave - 4) * 12 + idx
  return 440 * Math.pow(2, semitones / 12) * Math.pow(2, (ALL_NOTES.indexOf('A') - ALL_NOTES.indexOf('C')) / -12)
}

export function noteNameToFreq(full) {
  const m = full.match(/^([A-G]#?)(\d)$/)
  return m ? noteToFreq(m[1], parseInt(m[2])) : 220
}

export function useAudio() {
  const activeNodes = useRef([])

  function stopAll() {
    activeNodes.current.forEach(n => { try { n.stop() } catch (_) {} })
    activeNodes.current = []
  }

  function playNote(note, octave, duration = 0.5, delay = 0) {
    const ctx = getCtx()
    const freq = noteToFreq(note, octave)
    const t = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filt = ctx.createBiquadFilter()
    osc.type = 'triangle'
    osc.frequency.value = freq
    filt.type = 'lowpass'
    filt.frequency.value = 2000
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.35, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration)
    osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination)
    osc.start(t); osc.stop(t + duration + 0.05)
    activeNodes.current.push(osc)
  }

  function playToneHz(freq, dur = 1.5, wave = 'sine', vol = 0.22) {
    const ctx = getCtx()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = wave
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol, t + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(t); osc.stop(t + dur + 0.1)
    activeNodes.current.push(osc)
  }

  function playGlide(startFreq, endFreq, dur = 2.0) {
    const ctx = getCtx()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
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
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const lfo = ctx.createOscillator()
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
