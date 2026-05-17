import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './ExerciseModal.module.css'
import { useAudio, noteNameToFreq } from '../hooks/useAudio'

const CIRCUMFERENCE = 2 * Math.PI * 54

export default function ExerciseModal({ exercise: ex, onClose, onComplete }) {
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(ex.timerSecs)
  const [breathPhase, setBreathPhase] = useState(0) // 0=inhale 1=hold 2=exhale
  const [toneNote, setToneNote] = useState(null)
  const [glidePos, setGlidePos] = useState(ex.glideDir === 'down' ? 1 : 0)

  const { playNote, playToneHz, playGlide, playTrill, stopAll } = useAudio()
  const timerRef = useRef(null)
  const breathRef = useRef(null)
  const toneRef = useRef(null)
  const glideRef = useRef(null)
  const glideGoingUp = useRef(ex.glideDir !== 'down')

  const offset = CIRCUMFERENCE * (1 - remaining / ex.timerSecs)

  const clearAll = useCallback(() => {
    clearInterval(timerRef.current)
    clearTimeout(breathRef.current)
    clearTimeout(toneRef.current)
    cancelAnimationFrame(glideRef.current)
    stopAll()
  }, [stopAll])

  useEffect(() => () => clearAll(), [clearAll])

  function startExercise() {
    setRunning(true)
    setRemaining(ex.timerSecs)

    // Audio
    if (ex.audioType === 'hum' || ex.audioType === 'resonant') {
      playToneHz(noteNameToFreq(ex.noteName || 'A3'), ex.timerSecs, 'sine', 0.2)
    }
    if (ex.audioType === 'sigh') {
      playGlide(480, 200, ex.timerSecs * 0.85)
    }
    if (ex.audioType === 'trill' || ex.audioType === 'straw') {
      playTrill(ex.timerSecs)
    }
    if (ex.audioType === 'glide') {
      const lo = 185, hi = 440
      const up = ex.glideDir !== 'down'
      playGlide(up ? lo : hi, up ? hi : lo, ex.timerSecs)
      animateGlide()
    }
    if (ex.audioType === 'breathCycle') startBreath()
    if (ex.audioType === 'toneMatch') scheduleTone(0)

    // Countdown
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearAll()
          setRunning(false)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopExercise() {
    clearAll()
    setRunning(false)
    setRemaining(ex.timerSecs)
    setBreathPhase(0)
    setToneNote(null)
    setGlidePos(ex.glideDir === 'down' ? 1 : 0)
  }

  function startBreath() {
    if (!ex.breathPattern) return
    const [inh, hold, exh] = ex.breathPattern
    let ph = 0
    function doPhase() {
      setBreathPhase(ph)
      const dur = [inh, hold, exh][ph] * 1000
      breathRef.current = setTimeout(() => { ph = (ph + 1) % 3; doPhase() }, dur)
    }
    doPhase()
  }

  function scheduleTone(idx) {
    const notes = ex.toneNotes
    const note = notes[idx % notes.length]
    setToneNote(note)
    playToneHz(noteNameToFreq(note), 2.5, 'sine', 0.22)
    const interval = (ex.timerSecs * 1000) / notes.length
    toneRef.current = setTimeout(() => scheduleTone(idx + 1), interval)
  }

  function animateGlide() {
    const up = glideGoingUp.current
    let pos = up ? 0 : 1
    function step() {
      pos += up ? 0.004 : -0.004
      if (pos > 1) pos = 0
      if (pos < 0) pos = 1
      setGlidePos(pos)
      glideRef.current = requestAnimationFrame(step)
    }
    step()
  }

  const breathLabels = ['INHALE...', 'HOLD', 'EXHALE...']
  const breathScales = [1.9, 1.9, 1]

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.title}>{ex.name.toUpperCase()}</div>
        <div className={styles.subtitle}>{ex.category} · {ex.difficulty} · {ex.duration}</div>

        {/* Steps */}
        <div className={styles.steps}>
          {ex.steps.map((s, i) => (
            <div key={i} className={styles.step}>
              <span className={styles.stepNum}>{i + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {/* Timer ring */}
        <div className={styles.timerRing}>
          <svg width="160" height="160" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
            <circle fill="none" stroke="var(--border)" strokeWidth="6" cx="60" cy="60" r="54" />
            <circle
              fill="none"
              stroke="var(--mtd)"
              strokeWidth="6"
              strokeLinecap="round"
              cx="60" cy="60" r="54"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={running ? offset : 0}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className={styles.timerInner}>
            <div className={styles.timerCount}>{remaining}</div>
            <div className={styles.timerUnit}>SECONDS</div>
          </div>
        </div>

        {/* Breath ball */}
        {ex.audioType === 'breathCycle' && (
          <div className={styles.breathWrap}>
            <div
              className={styles.breathBall}
              style={{ transform: running ? `scale(${breathScales[breathPhase]})` : 'scale(1)', transition: `transform ${running ? (ex.breathPattern[breathPhase]) : 0}s ease-in-out` }}
            />
            <div className={styles.breathLabel}>{running ? breathLabels[breathPhase] : 'TAP BEGIN'}</div>
          </div>
        )}

        {/* Glide bar */}
        {(ex.audioType === 'glide' || ex.audioType === 'trill' || ex.audioType === 'straw') && (
          <div className={styles.glideCard}>
            <div className={styles.glideLabel}>{ex.audioType === 'glide' ? 'PITCH GLIDE' : 'SEMI-OCCLUDED AIRFLOW'}</div>
            <div className={styles.glideBar}>
              <div className={styles.glideThumb} style={{ left: `${glidePos * 86}%` }} />
            </div>
          </div>
        )}

        {/* Hum reference */}
        {(ex.audioType === 'hum' || ex.audioType === 'resonant') && (
          <div className={styles.toneCard}>
            <div className={styles.toneNote}>{ex.noteName || 'A3'}</div>
            <div className={styles.toneFreq}>{Math.round(noteNameToFreq(ex.noteName || 'A3'))} Hz</div>
            <div className={styles.toneHint}>Tap BEGIN to hear the reference tone</div>
          </div>
        )}

        {/* Tone match */}
        {ex.audioType === 'toneMatch' && (
          <div className={styles.toneCard}>
            <div className={styles.toneNote}>{toneNote || '—'}</div>
            <div className={styles.toneFreq}>{toneNote ? `${Math.round(noteNameToFreq(toneNote))} Hz — match on "mmm"` : 'Listen, then match softly'}</div>
          </div>
        )}

        <button
          className={styles.startBtn}
          onClick={running ? stopExercise : startExercise}
        >
          {running ? '■ STOP' : 'BEGIN EXERCISE'}
        </button>
        <button className={styles.closeBtn} onClick={onClose}>CLOSE</button>
      </div>
    </div>
  )
}
