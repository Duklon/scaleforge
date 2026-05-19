import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './ExerciseModal.module.css'
import { useAudio, unlockAudio, playPianoNote, getSamplerReady } from '../hooks/useAudio'
import { noteFreq, transposeScale, randomCoach, XP_REWARDS } from '../data/progression'
import XPFloat from './XPFloat'

const CIRCUMFERENCE  = 2 * Math.PI * 54
const TOTAL_SEMITONES = 12
const NOTE_DURATION  = 1300  // ms between notes

// ── PIANO HELPERS ─────────────────────────────────────────────────────────
const WHITE_LETTERS = ['C','D','E','F','G','A','B']
const BLACK_AFTER   = { C:'C#', D:'D#', F:'F#', G:'G#', A:'A#' }
const FLAT_TO_SHARP = { Db:'C#', Eb:'D#', Gb:'F#', Ab:'G#', Bb:'A#' }
const SHARP_TO_FLAT = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' }

function toSharp(display) {
  return FLAT_TO_SHARP[display] || display
}

function parseNote(name) {
  const m = name && name.match(/^([A-G])(b|#)?(\d)$/)
  if (!m) return null
  const display = m[1] + (m[2] || '')
  return { display, sharp: toSharp(display), oct: parseInt(m[3]) }
}

function noteMatchesKey(scaleNote, keySharp, keyOct) {
  const p = parseNote(scaleNote)
  if (!p) return false
  return p.sharp === keySharp && p.oct === keyOct
}

function buildKeyboard(scaleNotes) {
  const octaves = [...new Set(scaleNotes.map(n => parseNote(n)?.oct).filter(Boolean))].sort()
  const whites = [], blacks = []
  octaves.forEach(oct => {
    WHITE_LETTERS.forEach(letter => {
      whites.push({ sharp: letter, oct, fullName: letter + oct, wIdx: whites.length })
      const bSharp = BLACK_AFTER[letter]
      if (bSharp) {
        blacks.push({
          sharp: bSharp, oct,
          fullName: bSharp + oct,
          flatName: (SHARP_TO_FLAT[bSharp] || bSharp) + oct,
          afterWIdx: whites.length - 1,
        })
      }
    })
  })
  return { whites, blacks }
}

function ScalePiano({ scaleNotes, activeNote, passedNotes, levelColor, onPlay }) {
  const containerRef = useRef(null)
  const { whites, blacks } = buildKeyboard(scaleNotes)
  const KEY_W = 44

  useEffect(() => {
    if (!activeNote || !containerRef.current) return
    const el = containerRef.current.querySelector('[data-active="true"]')
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeNote])

  function matchScale(sharp, oct) {
    return scaleNotes.some(sn => noteMatchesKey(sn, sharp, oct))
  }
  function matchPassed(sharp, oct) {
    return passedNotes.some(sn => noteMatchesKey(sn, sharp, oct))
  }
  function matchActive(sharp, oct) {
    if (!activeNote) return false
    return noteMatchesKey(activeNote, sharp, oct)
  }
  function getPlayName(sharp, oct) {
    return scaleNotes.find(sn => noteMatchesKey(sn, sharp, oct)) || sharp + oct
  }

  return (
    <div className={styles.pianoWrap}>
      <div className={styles.pianoScroll} ref={containerRef}>
        <div className={styles.pianoKeys} style={{ width: whites.length * KEY_W }}>

          {whites.map((k) => {
            const inS = matchScale(k.sharp, k.oct)
            const pass = matchPassed(k.sharp, k.oct)
            const act  = matchActive(k.sharp, k.oct)
            return (
              <div key={k.fullName}
                data-active={act ? 'true' : 'false'}
                className={`${styles.whiteKey} ${inS ? styles.whiteInScale : ''} ${pass ? styles.whitePassed : ''} ${act ? styles.whiteActive : ''}`}
                style={act ? { background: levelColor, boxShadow: `0 0 18px ${levelColor}`, transform: 'translateY(3px)' } : {}}
                onPointerDown={() => onPlay && onPlay(getPlayName(k.sharp, k.oct))}
              >
                <span className={styles.keyLabel}>{k.sharp}{k.oct}</span>
              </div>
            )
          })}

          {blacks.map((bk) => {
            const inS = matchScale(bk.sharp, bk.oct)
            const pass = matchPassed(bk.sharp, bk.oct)
            const act  = matchActive(bk.sharp, bk.oct)
            const playName = getPlayName(bk.sharp, bk.oct)
            return (
              <div key={bk.fullName}
                data-active={act ? 'true' : 'false'}
                className={`${styles.blackKey} ${inS ? styles.blackInScale : ''} ${pass ? styles.blackPassed : ''} ${act ? styles.blackActive : ''}`}
                style={{
                  left: bk.afterWIdx * KEY_W + KEY_W * 0.64,
                  ...(act ? { background: levelColor, boxShadow: `0 0 14px ${levelColor}`, transform: 'translateY(2px)' } : {})
                }}
                onPointerDown={e => { e.stopPropagation(); onPlay && onPlay(playName) }}
              >
                <span className={styles.blackLabel}>{bk.flatName.replace(/\d/, '')}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.pianoNoteDisplay} style={{ color: levelColor }}>
        {activeNote
          ? <>{activeNote.replace(/\d/, '')} <span className={styles.pianoNoteHz}>{Math.round(noteFreq(activeNote))} Hz</span></>
          : <span style={{ opacity: 0.3 }}>—</span>
        }
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function ExerciseModal({ exercise: ex, currentLevel, onClose, onComplete, onAddNoteXP, onAddRepXP }) {
  const [phase, setPhase]             = useState('intro')
  const [semitone, setSemitone]       = useState(0)
  const [currentNotes, setCurrentNotes] = useState(currentLevel.notes)
  const [activeNote, setActiveNote]   = useState(null)
  const [passedNotes, setPassedNotes] = useState([])
  const [direction, setDirection]     = useState('up')
  const [coachMsg, setCoachMsg]       = useState(randomCoach('start'))
  const [xpFloats, setXpFloats]       = useState([])
  const [totalXP, setTotalXP]         = useState(0)
  const [remaining, setRemaining]     = useState(null)
  const [breathPhase, setBreathPhase] = useState(0)
  const [glidePos, setGlidePos]       = useState(0)

  const [samplerReady, setSamplerReady] = useState(getSamplerReady())

  // Poll for sampler ready — updates the loading state
  useEffect(() => {
    if (getSamplerReady()) { setSamplerReady(true); return }
    const interval = setInterval(() => {
      if (getSamplerReady()) { setSamplerReady(true); clearInterval(interval) }
    }, 300)
    return () => clearInterval(interval)
  }, [])

  const { playToneHz, playGlide, playTrill, stopAll } = useAudio()

  // All timers stored in one ref object — easy to clear all
  const timers   = useRef({ walk: null, timer: null, breath: null, coach: null, glide: null })
  const running  = useRef(false)  // true while exercise is active
  const xpId     = useRef(0)
  const baseNotes = currentLevel.notes

  // Total seconds for all 12 cycles
  const seqLen     = baseNotes.length * 2 - 1
  const sessionSecs = Math.ceil(TOTAL_SEMITONES * seqLen * NOTE_DURATION / 1000) + 5

  function killTimers() {
    running.current = false
    clearTimeout(timers.current.walk)
    clearInterval(timers.current.timer)
    clearTimeout(timers.current.breath)
    clearTimeout(timers.current.coach)
    cancelAnimationFrame(timers.current.glide)
    stopAll()
  }

  useEffect(() => () => killTimers(), [])

  function coach(type, delay = 0) {
    clearTimeout(timers.current.coach)
    timers.current.coach = setTimeout(() => setCoachMsg(randomCoach(type)), delay)
  }

  function xp(amount) {
    const id = xpId.current++
    setXpFloats(prev => [...prev, { id, amount }])
    setTotalXP(prev => prev + amount)
  }

  function removeFloat(id) {
    setXpFloats(prev => prev.filter(f => f.id !== id))
  }

  function tapKey(noteName) {
    unlockAudio()
    playPianoNote(noteName, 1.0)
  }

  // ── SCALE WALK ENGINE ─────────────────────────────────────────────────
  // Plays the scale up and down for one semitone, then calls onDone
  function playCycle(transposedNotes, onDone) {
    const asc = transposedNotes
    const desc = [...transposedNotes].reverse().slice(1)
    const seq = [...asc, ...desc]
    let i = 0

    setCurrentNotes(transposedNotes)
    setPassedNotes([])
    setActiveNote(null)

    function tick() {
      if (!running.current) return

      if (i >= seq.length) {
        // Cycle finished
        setActiveNote(null)
        onAddRepXP(true)
        xp(XP_REWARDS.perfectRep)
        onDone()
        return
      }

      const note = seq[i]
      setDirection(i >= asc.length ? 'down' : 'up')
      if (i > 0) setPassedNotes(prev => [...prev, seq[i - 1]])
      setActiveNote(note)

      // Play the note audio — real piano sample
      playPianoNote(note, NOTE_DURATION / 1000 * 0.82)

      xp(XP_REWARDS.completeNote)
      onAddNoteXP()

      i++
      timers.current.walk = setTimeout(tick, NOTE_DURATION)
    }

    // Small delay before first note so UI can settle
    timers.current.walk = setTimeout(tick, 300)
  }

  // Runs all 12 semitone cycles recursively
  function runCycle(semiIdx) {
    if (!running.current) return
    if (semiIdx >= TOTAL_SEMITONES) {
      finishExercise()
      return
    }

    const transposed = transposeScale(baseNotes, semiIdx)
    setSemitone(semiIdx)

    coach(semiIdx === 0 ? 'start' : 'semitoneUp')

    playCycle(transposed, () => {
      coach('repComplete', 300)
      // Pause between cycles, then next semitone
      timers.current.walk = setTimeout(() => runCycle(semiIdx + 1), 1600)
    })
  }

  function finishExercise() {
    killTimers()
    setPhase('complete')
    setActiveNote(null)
    xp(XP_REWARDS.completeExercise)
    coach('complete')
    onComplete()
  }

  function startExercise() {
    unlockAudio()
    killTimers()          // clear any old state
    running.current = true

    setPhase('active')
    setSemitone(0)
    setCurrentNotes(baseNotes)
    setPassedNotes([])
    setActiveNote(null)
    setDirection('up')
    setTotalXP(0)
    setXpFloats([])
    setRemaining(sessionSecs)

    // Background audio for certain exercise types
    if (ex.audioType === 'sigh')  playGlide(480, 200, sessionSecs * 0.85)
    if (ex.audioType === 'trill' || ex.audioType === 'straw') playTrill(sessionSecs)
    if (ex.audioType === 'glide') {
      const up = ex.glideDir !== 'down'
      playGlide(up ? 185 : 440, up ? 440 : 185, sessionSecs)
      animateGlide(up)
    }
    if (ex.audioType === 'breathCycle') startBreath()

    // Countdown timer
    timers.current.timer = setInterval(() => {
      setRemaining(prev => (prev && prev > 1 ? prev - 1 : prev))
    }, 1000)

    // Kick off first cycle immediately
    runCycle(0)
  }

  function startBreath() {
    if (!ex.breathPattern) return
    const durs = ex.breathPattern
    let ph = 0
    function tick() {
      setBreathPhase(ph)
      timers.current.breath = setTimeout(() => { ph = (ph + 1) % 3; tick() }, durs[ph] * 1000)
    }
    tick()
  }

  function animateGlide(up) {
    let pos = up ? 0 : 1
    function tick() {
      pos += up ? 0.003 : -0.003
      if (pos > 1) pos = 0
      if (pos < 0) pos = 1
      setGlidePos(pos)
      timers.current.glide = requestAnimationFrame(tick)
    }
    tick()
  }

  const breathLabels = ['INHALE...', 'HOLD', 'EXHALE...']
  const breathScales = [1.9, 1.9, 1]
  const timerOffset  = remaining !== null ? CIRCUMFERENCE * (1 - remaining / sessionSecs) : 0

  // ── INTRO ──────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.title}>{ex.name.toUpperCase()}</div>
        <div className={styles.subtitle}>{ex.category} · {ex.difficulty} · {ex.duration}</div>

        <div className={styles.levelBadge} style={{ borderColor: currentLevel.color, color: currentLevel.color }}>
          🎵 {currentLevel.name} Scale — Level {currentLevel.level}
        </div>

        <div className={styles.steps}>
          {ex.steps.map((s, i) => (
            <div key={i} className={styles.step}>
              <span className={styles.stepNum}>{i + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className={styles.scalePreview}>
          <div className={styles.scalePreviewLabel}>STARTING SCALE — TAP KEYS TO HEAR</div>
          <ScalePiano
            scaleNotes={currentLevel.notes}
            activeNote={null}
            passedNotes={[]}
            levelColor={currentLevel.color}
            onPlay={tapKey}
          />
          <div className={styles.cycleInfo}>
            The scale rises by one semitone each cycle — climbing a full octave over 12 passes.
          </div>
        </div>

        <div className={styles.samplerStatus}>
          {samplerReady
            ? <span className={styles.samplerReady}>🎹 Real piano loaded</span>
            : <span className={styles.samplerLoading}>⏳ Loading piano samples…</span>}
        </div>
        <button className={styles.startBtn} onClick={startExercise}>BEGIN EXERCISE</button>
        <button className={styles.closeBtn} onClick={onClose}>NOT NOW</button>
      </div>
    </div>
  )

  // ── COMPLETE ────────────────────────────────────────────────────────────
  if (phase === 'complete') return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} />
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.completeEmoji}>🎉</div>
        <div className={styles.completeTitle}>EXERCISE COMPLETE!</div>
        <div className={styles.coachBubble} style={{ marginBottom: 20 }}>
          <div className={styles.coachIcon}>🎤</div>
          <div className={styles.coachText}>{coachMsg}</div>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <div className={styles.statNum}>{TOTAL_SEMITONES}</div>
            <div className={styles.statLabel}>CYCLES</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum} style={{ color: '#ffd700' }}>+{totalXP}</div>
            <div className={styles.statLabel}>XP EARNED</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum}>1</div>
            <div className={styles.statLabel}>OCTAVE</div>
          </div>
        </div>
        <button className={styles.startBtn} onClick={onClose}>BACK TO EXERCISES</button>
      </div>
    </div>
  )

  // ── ACTIVE ──────────────────────────────────────────────────────────────
  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.activeHeader}>
          <div className={styles.activeTitle}>{ex.name.toUpperCase()}</div>
          <div className={styles.repBadge} style={{ borderColor: currentLevel.color, color: currentLevel.color }}>
            Cycle {semitone + 1} / {TOTAL_SEMITONES}
          </div>
        </div>

        <div className={styles.coachBubble}>
          <div className={styles.coachIcon}>🎤</div>
          <div className={styles.coachText}>{coachMsg}</div>
        </div>

        {/* Semitone progress */}
        <div className={styles.semitoneRow}>
          <span className={styles.semitoneLabel}>+{semitone} st</span>
          <div className={styles.semitoneBar}>
            <div className={styles.semitoneFill}
              style={{ width: `${(semitone / TOTAL_SEMITONES) * 100}%`, background: currentLevel.color }} />
            {Array.from({ length: TOTAL_SEMITONES }).map((_, i) => (
              <div key={i} className={`${styles.semitoneTick} ${i < semitone ? styles.semitoneTickDone : ''}`}
                style={i < semitone ? { background: currentLevel.color } : {}} />
            ))}
          </div>
          <span className={styles.semitoneLabel}>+12</span>
        </div>

        {/* Direction + root label */}
        <div className={styles.directionRow}>
          <div className={`${styles.dirArrow} ${direction === 'up' ? styles.dirArrowActive : ''}`}
            style={direction === 'up' ? { color: currentLevel.color } : {}}>↑ UP</div>
          <div className={styles.rootKeyLabel} style={{ color: currentLevel.color }}>
            {currentNotes[0]?.replace(/\d/, '')} {currentLevel.name}
          </div>
          <div className={`${styles.dirArrow} ${direction === 'down' ? styles.dirArrowActive : ''}`}
            style={direction === 'down' ? { color: currentLevel.color } : {}}>DOWN ↓</div>
        </div>

        {/* Piano */}
        <div className={styles.pianoSection}>
          {xpFloats.map(f => (
            <XPFloat key={f.id} amount={f.amount} onDone={() => removeFloat(f.id)} />
          ))}
          <ScalePiano
            scaleNotes={currentNotes}
            activeNote={activeNote}
            passedNotes={passedNotes}
            levelColor={currentLevel.color}
            onPlay={tapKey}
          />
        </div>

        {/* Timer + XP */}
        <div className={styles.timerXpRow}>
          <div className={styles.timerRing}>
            <svg width="80" height="80" viewBox="0 0 120 120"
              style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
              <circle fill="none" stroke="var(--border)" strokeWidth="8" cx="60" cy="60" r="54" />
              <circle fill="none" stroke={currentLevel.color} strokeWidth="8" strokeLinecap="round"
                cx="60" cy="60" r="54"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={timerOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className={styles.timerInner}>
              <div className={styles.timerCount}>{remaining ?? '—'}</div>
              <div className={styles.timerUnit}>SEC</div>
            </div>
          </div>
          <div className={styles.xpSoFar}>
            <div className={styles.xpAmount}>+{totalXP}</div>
            <div className={styles.xpLabel}>XP EARNED</div>
          </div>
        </div>

        {/* Breath ball */}
        {ex.audioType === 'breathCycle' && (
          <div className={styles.breathWrap}>
            <div className={styles.breathBall}
              style={{
                transform: `scale(${breathScales[breathPhase]})`,
                transition: `transform ${ex.breathPattern?.[breathPhase] || 4}s ease-in-out`,
                borderColor: currentLevel.color,
              }} />
            <div className={styles.breathLabel}>{breathLabels[breathPhase]}</div>
          </div>
        )}

        {/* Glide bar */}
        {(ex.audioType === 'glide' || ex.audioType === 'trill' || ex.audioType === 'straw') && (
          <div className={styles.glideCard}>
            <div className={styles.glideLabel}>{ex.audioType === 'glide' ? 'PITCH GLIDE' : 'AIRFLOW'}</div>
            <div className={styles.glideBar}
              style={{ background: `linear-gradient(90deg, ${currentLevel.color}, var(--mtd2))` }}>
              <div className={styles.glideThumb} style={{ left: `${glidePos * 86}%` }} />
            </div>
          </div>
        )}

        <div className={styles.followHint}>🎤 Follow each note — match it with your voice</div>

        <button className={styles.stopBtn} onClick={() => { killTimers(); onClose() }}>
          END SESSION
        </button>
      </div>
    </div>
  )
}
