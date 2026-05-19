import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './ExerciseModal.module.css'
import { useAudio, unlockAudio } from '../hooks/useAudio'
import { noteFreq, randomCoach, XP_REWARDS } from '../data/progression'
import XPFloat from './XPFloat'

const CIRCUMFERENCE = 2 * Math.PI * 54
const REPS_PER_EXERCISE = 3

// All white notes and which ones have a black key to the right
const WHITE_NOTES  = ['C','D','E','F','G','A','B']
const BLACK_AFTER  = { 'C':'C#','D':'D#','F':'F#','G':'G#','A':'A#' }

// Parse a note name like "Eb4" into { natural:"E", sharp:false, flat:true, name:"Eb", octave:4 }
function parseNote(fullName) {
  const m = fullName.match(/^([A-G])(b|#)?(\d)$/)
  if (!m) return null
  return { letter: m[1], accidental: m[2] || '', octave: parseInt(m[3]), display: m[1] + (m[2] || '') }
}

// Build the list of white keys to render for the scale octave range
function buildKeyboard(scaleNotes) {
  // Find octave range from scale notes
  const octaves = [...new Set(scaleNotes.map(n => parseNote(n)?.octave).filter(Boolean))].sort()
  const keys = []
  octaves.forEach(oct => {
    WHITE_NOTES.forEach(letter => {
      keys.push({ letter, octave: oct, isBlack: false, fullName: letter + oct })
      const blackNote = BLACK_AFTER[letter]
      if (blackNote) {
        // Check for flat enharmonic — e.g. Bb = A#
        const flatName  = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' }[blackNote + oct] || null
        keys.push({ letter: blackNote.replace('#',''), accidental: '#', octave: oct, isBlack: true,
          fullName: blackNote + oct, flatName: flatName ? flatName.replace(/\d/,'') + oct : null })
      }
    })
  })
  return keys
}

// Check if a scale note matches a keyboard key (handles enharmonic equivalents)
function noteMatches(keyFullName, keyFlatName, scaleNote) {
  if (!scaleNote) return false
  if (keyFullName === scaleNote) return true
  if (keyFlatName && keyFlatName === scaleNote) return true
  return false
}

function ScalePiano({ scaleNotes, activeNote, passedNotes, levelColor }) {
  const containerRef = useRef(null)
  const keys = buildKeyboard(scaleNotes)
  const whiteKeys = keys.filter(k => !k.isBlack)
  const blackKeys = keys.filter(k => k.isBlack)

  // Scroll to center the active note
  useEffect(() => {
    if (!activeNote || !containerRef.current) return
    const activeEl = containerRef.current.querySelector('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeNote])

  const KEY_W = 44  // white key width + gap

  return (
    <div className={styles.pianoWrap}>
      <div className={styles.pianoScroll} ref={containerRef}>
        <div className={styles.pianoKeys} style={{ width: whiteKeys.length * KEY_W }}>
          {/* White keys */}
          {whiteKeys.map((k, i) => {
            const inScale  = scaleNotes.some(sn => noteMatches(k.fullName, null, sn))
            const isPassed = passedNotes.some(sn => noteMatches(k.fullName, null, sn))
            const isActive = activeNote && noteMatches(k.fullName, null, activeNote)
            return (
              <div key={k.fullName}
                data-active={isActive ? 'true' : 'false'}
                className={`${styles.whiteKey}
                  ${inScale  ? styles.whiteInScale : ''}
                  ${isPassed ? styles.whitePassed  : ''}
                  ${isActive ? styles.whiteActive  : ''}`}
                style={isActive ? { background: levelColor, boxShadow: `0 0 16px ${levelColor}` } : {}}
              >
                <span className={styles.keyLabel}>{k.letter}{k.octave}</span>
              </div>
            )
          })}

          {/* Black keys — positioned absolutely */}
          {whiteKeys.map((wk, i) => {
            const blackNote = BLACK_AFTER[wk.letter]
            if (!blackNote) return null
            const bk = blackKeys.find(b => b.fullName === blackNote + wk.octave)
            if (!bk) return null
            const inScale  = scaleNotes.some(sn => noteMatches(bk.fullName, bk.flatName, sn))
            const isPassed = passedNotes.some(sn => noteMatches(bk.fullName, bk.flatName, sn))
            const isActive = activeNote && noteMatches(bk.fullName, bk.flatName, activeNote)
            return (
              <div key={bk.fullName}
                data-active={isActive ? 'true' : 'false'}
                className={`${styles.blackKey}
                  ${inScale  ? styles.blackInScale : ''}
                  ${isPassed ? styles.blackPassed  : ''}
                  ${isActive ? styles.blackActive  : ''}`}
                style={{
                  left: i * KEY_W + KEY_W * 0.64,
                  ...(isActive ? { background: levelColor, boxShadow: `0 0 12px ${levelColor}` } : {})
                }}
              >
                <span className={styles.blackLabel}>
                  {bk.flatName ? bk.flatName.replace(/\d/,'') : bk.fullName.replace(/\d/,'')}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      {/* Active note name display below piano */}
      <div className={styles.pianoNoteDisplay} style={{ color: levelColor }}>
        {activeNote ? activeNote.replace(/\d/, '') : '—'}
        <span className={styles.pianoNoteHz}>
          {activeNote ? `  ${Math.round(noteFreq(activeNote))} Hz` : ''}
        </span>
      </div>
    </div>
  )
}

export default function ExerciseModal({ exercise: ex, currentLevel, onClose, onComplete, onAddNoteXP, onAddRepXP }) {
  const [phase, setPhase] = useState('intro')
  const [activeNote, setActiveNote] = useState(null)
  const [passedNotes, setPassedNotes] = useState([])
  const [direction, setDirection] = useState('up')   // 'up' | 'down'
  const [noteIdx, setNoteIdx] = useState(0)
  const [currentRep, setCurrentRep] = useState(1)
  const [noteState, setNoteState] = useState('idle') // idle | playing | waiting | confirmed
  const [coachMsg, setCoachMsg] = useState(randomCoach('start'))
  const [xpFloats, setXpFloats] = useState([])
  const [totalXP, setTotalXP] = useState(0)
  const [breathPhase, setBreathPhase] = useState(0)
  const [glidePos, setGlidePos] = useState(0)
  const [remaining, setRemaining] = useState(ex.timerSecs)

  const { playToneHz, playGlide, playTrill, stopAll } = useAudio()
  const timerRef     = useRef(null)
  const breathRef    = useRef(null)
  const glideRef     = useRef(null)
  const noteTimeout  = useRef(null)
  const coachTimeout = useRef(null)
  const xpIdRef      = useRef(0)
  const noteIdxRef   = useRef(0)
  const directionRef = useRef('up')
  const noteStateRef = useRef('idle')
  const repStartRef  = useRef(null)

  // Build ascending then descending sequence: [C,D,E,G,A,C5, A,G,E,D,C]
  const ascNotes  = currentLevel.notes
  const descNotes = [...currentLevel.notes].reverse().slice(1) // skip top note (already played)
  const fullSequence = [...ascNotes, ...descNotes]

  const offset = CIRCUMFERENCE * (1 - remaining / ex.timerSecs)

  const clearAll = useCallback(() => {
    clearInterval(timerRef.current)
    clearTimeout(breathRef.current)
    clearTimeout(noteTimeout.current)
    clearTimeout(coachTimeout.current)
    cancelAnimationFrame(glideRef.current)
    stopAll()
  }, [stopAll])

  useEffect(() => () => clearAll(), [clearAll])

  function showCoach(type, delay = 0) {
    clearTimeout(coachTimeout.current)
    coachTimeout.current = setTimeout(() => setCoachMsg(randomCoach(type)), delay)
  }

  function spawnXP(amount) {
    const id = xpIdRef.current++
    setXpFloats(prev => [...prev, { id, amount }])
    setTotalXP(prev => prev + amount)
  }

  function removeXPFloat(id) {
    setXpFloats(prev => prev.filter(f => f.id !== id))
  }

  // Play a note by name — no state dependencies inside
  function playNoteByName(noteName) {
    unlockAudio()
    if (!noteName) return
    const freq = noteFreq(noteName)
    if (!freq) return
    noteStateRef.current = 'playing'
    setNoteState('playing')
    setActiveNote(noteName)
    playToneHz(freq, 0.9, 'sine', 0.22)
    noteTimeout.current = setTimeout(() => {
      noteStateRef.current = 'waiting'
      setNoteState('waiting')
    }, 1000)
  }

  // Auto-walk the full up+down sequence with a set interval
  function startScaleWalk(rep) {
    noteIdxRef.current = 0
    directionRef.current = 'up'
    setNoteIdx(0)
    setDirection('up')
    setPassedNotes([])
    setActiveNote(null)
    repStartRef.current = Date.now()

    const NOTE_INTERVAL = 1400 // ms between notes

    function playNoteAtIdx(idx) {
      if (idx >= fullSequence.length) {
        // Finished one full up+down pass — that's one rep
        finishRep(rep)
        return
      }
      const noteName = fullSequence[idx]
      const isDescending = idx >= ascNotes.length
      directionRef.current = isDescending ? 'down' : 'up'
      setDirection(isDescending ? 'down' : 'up')
      noteIdxRef.current = idx
      setNoteIdx(idx)

      // Mark previous note as passed
      if (idx > 0) {
        setPassedNotes(prev => [...prev, fullSequence[idx - 1]])
      }

      playNoteByName(noteName)
      spawnXP(XP_REWARDS.completeNote)
      onAddNoteXP()

      noteTimeout.current = setTimeout(() => {
        playNoteAtIdx(idx + 1)
      }, NOTE_INTERVAL)
    }

    noteTimeout.current = setTimeout(() => playNoteAtIdx(0), 600)
  }

  function finishRep(rep) {
    const perfect = true // auto-walk is always guided so always perfect
    onAddRepXP(perfect)
    spawnXP(XP_REWARDS.perfectRep)
    showCoach('repComplete')

    const nextRep = rep + 1
    if (nextRep > REPS_PER_EXERCISE) {
      setTimeout(() => completeExercise(), 1200)
    } else {
      setCurrentRep(nextRep)
      setPassedNotes([])
      setActiveNote(null)
      showCoach('encouragement', 400)
      setTimeout(() => startScaleWalk(nextRep), 1800)
    }
  }

  function completeExercise() {
    clearAll()
    setPhase('complete')
    setActiveNote(null)
    spawnXP(XP_REWARDS.completeExercise)
    showCoach('complete')
    onComplete()
  }

  function startExercise() {
    unlockAudio()
    setPhase('active')
    setCurrentRep(1)
    setPassedNotes([])
    setActiveNote(null)
    setNoteState('idle')
    setRemaining(ex.timerSecs)
    showCoach('start')

    // Background audio for certain exercise types
    if (ex.audioType === 'sigh')  playGlide(480, 200, ex.timerSecs * 0.85)
    if (ex.audioType === 'trill' || ex.audioType === 'straw') playTrill(ex.timerSecs)
    if (ex.audioType === 'glide') {
      const up = ex.glideDir !== 'down'
      playGlide(up ? 185 : 440, up ? 440 : 185, ex.timerSecs)
      animateGlide(up)
    }
    if (ex.audioType === 'breathCycle') startBreath()

    // Countdown timer
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearAll(); completeExercise(); return 0 }
        return prev - 1
      })
    }, 1000)

    // Start walking the scale
    startScaleWalk(1)
  }

  function startBreath() {
    if (!ex.breathPattern) return
    const durs = ex.breathPattern
    let ph = 0
    function doPhase() {
      setBreathPhase(ph)
      breathRef.current = setTimeout(() => { ph = (ph + 1) % 3; doPhase() }, durs[ph] * 1000)
    }
    doPhase()
  }

  function animateGlide(goingUp) {
    let pos = goingUp ? 0 : 1
    function step() {
      pos += goingUp ? 0.003 : -0.003
      if (pos > 1) pos = 0
      if (pos < 0) pos = 1
      setGlidePos(pos)
      glideRef.current = requestAnimationFrame(step)
    }
    step()
  }

  const breathLabels = ['INHALE...', 'HOLD', 'EXHALE...']
  const breathScales = [1.9, 1.9, 1]

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

        {/* Piano preview */}
        <div className={styles.scalePreview}>
          <div className={styles.scalePreviewLabel}>YOUR SCALE — LISTEN THEN FOLLOW</div>
          <ScalePiano
            scaleNotes={currentLevel.notes}
            activeNote={null}
            passedNotes={[]}
            levelColor={currentLevel.color}
          />
          <div className={styles.scaleDesc}>{currentLevel.description}</div>
        </div>

        <div className={styles.xpPreview}>
          ⭐ Up to {XP_REWARDS.completeExercise + fullSequence.length * REPS_PER_EXERCISE * XP_REWARDS.completeNote + REPS_PER_EXERCISE * XP_REWARDS.perfectRep} XP available
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
            <div className={styles.statNum}>{REPS_PER_EXERCISE}</div>
            <div className={styles.statLabel}>REPS</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum} style={{ color: '#ffd700' }}>+{totalXP}</div>
            <div className={styles.statLabel}>XP EARNED</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum}>{fullSequence.length * REPS_PER_EXERCISE}</div>
            <div className={styles.statLabel}>NOTES</div>
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
            Rep {Math.min(currentRep, REPS_PER_EXERCISE)}/{REPS_PER_EXERCISE}
          </div>
        </div>

        <div className={styles.coachBubble}>
          <div className={styles.coachIcon}>🎤</div>
          <div className={styles.coachText}>{coachMsg}</div>
        </div>

        {/* Direction indicator */}
        <div className={styles.directionRow}>
          <div className={`${styles.dirArrow} ${direction === 'up' ? styles.dirArrowActive : ''}`}
            style={direction === 'up' ? { color: currentLevel.color } : {}}>
            ↑ ASCENDING
          </div>
          <div className={`${styles.dirArrow} ${direction === 'down' ? styles.dirArrowActive : ''}`}
            style={direction === 'down' ? { color: currentLevel.color } : {}}>
            DESCENDING ↓
          </div>
        </div>

        {/* Piano */}
        <div className={styles.pianoSection}>
          {xpFloats.map(f => <XPFloat key={f.id} amount={f.amount} onDone={() => removeXPFloat(f.id)} />)}
          <ScalePiano
            scaleNotes={currentLevel.notes}
            activeNote={activeNote}
            passedNotes={passedNotes}
            levelColor={currentLevel.color}
          />
        </div>

        {/* Timer + XP */}
        <div className={styles.timerXpRow}>
          <div className={styles.timerRing}>
            <svg width="80" height="80" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
              <circle fill="none" stroke="var(--border)" strokeWidth="8" cx="60" cy="60" r="54" />
              <circle fill="none" stroke={currentLevel.color} strokeWidth="8" strokeLinecap="round"
                cx="60" cy="60" r="54" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className={styles.timerInner}>
              <div className={styles.timerCount}>{remaining}</div>
              <div className={styles.timerUnit}>SEC</div>
            </div>
          </div>
          <div className={styles.xpSoFar}>
            <div className={styles.xpAmount}>+{totalXP}</div>
            <div className={styles.xpLabel}>XP THIS SESSION</div>
          </div>
        </div>

        {/* Breath ball for breath exercises */}
        {ex.audioType === 'breathCycle' && (
          <div className={styles.breathWrap}>
            <div className={styles.breathBall}
              style={{ transform: `scale(${breathScales[breathPhase]})`, transition: `transform ${ex.breathPattern?.[breathPhase] || 4}s ease-in-out`, borderColor: currentLevel.color }} />
            <div className={styles.breathLabel}>{breathLabels[breathPhase]}</div>
          </div>
        )}

        {/* Glide bar */}
        {(ex.audioType === 'glide' || ex.audioType === 'trill' || ex.audioType === 'straw') && (
          <div className={styles.glideCard}>
            <div className={styles.glideLabel}>{ex.audioType === 'glide' ? 'PITCH GLIDE' : 'AIRFLOW'}</div>
            <div className={styles.glideBar} style={{ background: `linear-gradient(90deg, ${currentLevel.color}, var(--mtd2))` }}>
              <div className={styles.glideThumb} style={{ left: `${glidePos * 86}%` }} />
            </div>
          </div>
        )}

        <div className={styles.followHint}>🎤 Follow along — match each note as it plays</div>

        <button className={styles.stopBtn} onClick={() => { clearAll(); onClose() }}>END SESSION</button>
      </div>
    </div>
  )
}
