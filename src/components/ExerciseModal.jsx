import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './ExerciseModal.module.css'
import { useAudio, unlockAudio } from '../hooks/useAudio'
import { noteFreq, transposeScale, randomCoach, XP_REWARDS } from '../data/progression'
import XPFloat from './XPFloat'

const CIRCUMFERENCE = 2 * Math.PI * 54
const TOTAL_SEMITONES = 12   // one full octave of cycles
const NOTE_DURATION   = 1400 // ms per note

// ── PIANO HELPERS ─────────────────────────────────────────────────────────
const WHITE_LETTERS = ['C','D','E','F','G','A','B']
const BLACK_AFTER   = { 'C':'C#','D':'D#','F':'F#','G':'G#','A':'A#' }
const FLAT_TO_SHARP = { 'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#' }
const SHARP_TO_FLAT = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' }

function parseNoteName(name) {
  const m = name.match(/^([A-G])(b|#)?(\d)$/)
  if (!m) return null
  const letter = m[1], acc = m[2] || '', oct = parseInt(m[3])
  const display  = letter + acc
  const asSharp  = FLAT_TO_SHARP[display] || display
  return { letter, acc, oct, display, asSharp }
}

// True if a piano key (by sharp name + oct) matches a scale note
function keyMatchesScaleNote(keySharp, keyOct, scaleNote) {
  const p = parseNoteName(scaleNote)
  if (!p) return false
  const snSharp = p.asSharp
  const snOct   = p.oct
  return snSharp === keySharp && snOct === keyOct
}

// Build white + black key list for the given set of scale notes
function buildKeyboard(scaleNotes) {
  const octaves = [...new Set(scaleNotes.map(n => parseNoteName(n)?.oct).filter(Boolean))].sort()
  const whites = []
  const blacks = []
  octaves.forEach(oct => {
    WHITE_LETTERS.forEach((letter, li) => {
      whites.push({ letter, oct, sharp: letter, fullName: letter + oct, whiteIdx: whites.length })
      const bSharp = BLACK_AFTER[letter]
      if (bSharp) {
        blacks.push({
          sharp: bSharp,
          oct,
          fullName: bSharp + oct,
          flatName: (SHARP_TO_FLAT[bSharp] || bSharp) + oct,
          afterWhiteIdx: whites.length - 1,
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

  function isInScale(sharpName, oct) {
    return scaleNotes.some(sn => keyMatchesScaleNote(sharpName, oct, sn))
  }
  function isPassed(sharpName, oct) {
    return passedNotes.some(sn => keyMatchesScaleNote(sharpName, oct, sn))
  }
  function isActive(sharpName, oct) {
    if (!activeNote) return false
    return keyMatchesScaleNote(sharpName, oct, activeNote)
  }
  function getPlayName(sharpName, oct, scaleNotes) {
    // Return the exact scale note name (flat or sharp) so freq lookup works
    return scaleNotes.find(sn => keyMatchesScaleNote(sharpName, oct, sn)) || (sharpName + oct)
  }

  return (
    <div className={styles.pianoWrap}>
      <div className={styles.pianoScroll} ref={containerRef}>
        <div className={styles.pianoKeys} style={{ width: whites.length * KEY_W }}>

          {/* White keys */}
          {whites.map((k, i) => {
            const inS = isInScale(k.sharp, k.oct)
            const pass = isPassed(k.sharp, k.oct)
            const act  = isActive(k.sharp, k.oct)
            return (
              <div key={k.fullName}
                data-active={act ? 'true' : 'false'}
                className={`${styles.whiteKey} ${inS ? styles.whiteInScale : ''} ${pass ? styles.whitePassed : ''} ${act ? styles.whiteActive : ''}`}
                style={act ? { background: levelColor, boxShadow: `0 0 18px ${levelColor}` } : {}}
                onPointerDown={() => onPlay && onPlay(getPlayName(k.sharp, k.oct, scaleNotes))}
              >
                <span className={styles.keyLabel}>{k.letter}{k.oct}</span>
              </div>
            )
          })}

          {/* Black keys */}
          {blacks.map((bk) => {
            const inS = isInScale(bk.sharp, bk.oct)
            const pass = isPassed(bk.sharp, bk.oct)
            const act  = isActive(bk.sharp, bk.oct)
            const playName = getPlayName(bk.sharp, bk.oct, scaleNotes)
            return (
              <div key={bk.fullName}
                data-active={act ? 'true' : 'false'}
                className={`${styles.blackKey} ${inS ? styles.blackInScale : ''} ${pass ? styles.blackPassed : ''} ${act ? styles.blackActive : ''}`}
                style={{
                  left: bk.afterWhiteIdx * KEY_W + KEY_W * 0.64,
                  ...(act ? { background: levelColor, boxShadow: `0 0 14px ${levelColor}` } : {})
                }}
                onPointerDown={e => { e.stopPropagation(); onPlay && onPlay(playName) }}
              >
                <span className={styles.blackLabel}>
                  {bk.flatName.replace(/\d/, '')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Note name + Hz below piano */}
      <div className={styles.pianoNoteDisplay} style={{ color: levelColor }}>
        {activeNote
          ? <>{activeNote.replace(/\d/, '')} <span className={styles.pianoNoteHz}>{Math.round(noteFreq(activeNote))} Hz</span></>
          : <span style={{ opacity: 0.3 }}>—</span>}
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function ExerciseModal({ exercise: ex, currentLevel, onClose, onComplete, onAddNoteXP, onAddRepXP }) {
  const [phase, setPhase] = useState('intro')       // intro | active | complete
  const [semitone, setSemitone] = useState(0)        // current transposition (0-11)
  const [currentNotes, setCurrentNotes] = useState(currentLevel.notes) // transposed scale
  const [activeNote, setActiveNote] = useState(null)
  const [passedNotes, setPassedNotes] = useState([])
  const [direction, setDirection] = useState('up')   // 'up' | 'down'
  const [coachMsg, setCoachMsg] = useState(randomCoach('start'))
  const [xpFloats, setXpFloats] = useState([])
  const [totalXP, setTotalXP] = useState(0)
  const [remaining, setRemaining] = useState(null)   // null = no timer shown until active
  const [breathPhase, setBreathPhase] = useState(0)
  const [glidePos, setGlidePos] = useState(0)

  const { playToneHz, playGlide, playTrill, stopAll } = useAudio()
  const timerRef     = useRef(null)
  const breathRef    = useRef(null)
  const glideRef     = useRef(null)
  const walkTimeout  = useRef(null)
  const coachTimeout = useRef(null)
  const xpIdRef      = useRef(0)
  const semitoneRef  = useRef(0)   // always current, safe inside timeouts
  const stoppedRef   = useRef(false)

  // Full session duration = 12 cycles × (notes up + notes down - 1) × NOTE_DURATION
  const baseNotes   = currentLevel.notes
  const seqLength   = baseNotes.length * 2 - 1   // up + down (top note not repeated)
  const sessionSecs = Math.ceil((TOTAL_SEMITONES * seqLength * NOTE_DURATION) / 1000) + 4

  const clearAll = useCallback(() => {
    stoppedRef.current = true
    clearInterval(timerRef.current)
    clearTimeout(breathRef.current)
    clearTimeout(walkTimeout.current)
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

  // Tap a key manually
  function handleKeyTap(noteName) {
    unlockAudio()
    const freq = noteFreq(noteName)
    if (freq) playToneHz(freq, 0.7, 'sine', 0.22)
  }

  // Play one note — light it up, play audio
  function playOneNote(noteName) {
    setActiveNote(noteName)
    const freq = noteFreq(noteName)
    if (freq) playToneHz(freq, NOTE_DURATION / 1000 * 0.85, 'sine', 0.22)
    spawnXP(XP_REWARDS.completeNote)
    onAddNoteXP()
  }

  // Walk up then down one cycle of transposedNotes
  // After finishing, advance semitone and call back
  function walkCycle(transposedNotes, onDone) {
    const asc  = transposedNotes
    const desc = [...transposedNotes].reverse().slice(1) // skip top (already played)
    const seq  = [...asc, ...desc]
    let idx = 0

    setPassedNotes([])
    setCurrentNotes(transposedNotes)

    function step() {
      if (stoppedRef.current) return
      if (idx >= seq.length) {
        setActiveNote(null)
        onAddRepXP(true)
        spawnXP(XP_REWARDS.perfectRep)
        onDone()
        return
      }
      const note = seq[idx]
      const isDesc = idx >= asc.length
      setDirection(isDesc ? 'down' : 'up')
      if (idx > 0) setPassedNotes(prev => [...prev, seq[idx - 1]])
      playOneNote(note)
      idx++
      walkTimeout.current = setTimeout(step, NOTE_DURATION)
    }
    step()
  }

  // Run all 12 semitone cycles in sequence
  function runAllCycles(startSemitone = 0) {
    if (stoppedRef.current) return
    if (startSemitone >= TOTAL_SEMITONES) {
      // All 12 done — exercise complete
      completeExercise()
      return
    }
    const transposed = transposeScale(baseNotes, startSemitone)
    semitoneRef.current = startSemitone
    setSemitone(startSemitone)

    if (startSemitone > 0) showCoach('semitoneUp')
    else showCoach('start')

    walkCycle(transposed, () => {
      showCoach('repComplete', 200)
      // Brief pause between cycles then move up a semitone
      walkTimeout.current = setTimeout(() => {
        runAllCycles(startSemitone + 1)
      }, 1800)
    })
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
    stoppedRef.current = false
    setPhase('active')
    setSemitone(0)
    setPassedNotes([])
    setActiveNote(null)
    setDirection('up')
    setRemaining(sessionSecs)

    // Background audio for non-note exercise types
    if (ex.audioType === 'sigh')  playGlide(480, 200, sessionSecs * 0.85)
    if (ex.audioType === 'trill' || ex.audioType === 'straw') playTrill(sessionSecs)
    if (ex.audioType === 'glide') {
      const up = ex.glideDir !== 'down'
      playGlide(up ? 185 : 440, up ? 440 : 185, sessionSecs)
      animateGlide(up)
    }
    if (ex.audioType === 'breathCycle') startBreath()

    // Countdown
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev === null || prev <= 1) return prev
        return prev - 1
      })
    }, 1000)

    // Start cycling
    walkTimeout.current = setTimeout(() => runAllCycles(0), 600)
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

  // Semitone progress bar
  const semitoneProgress = (semitone / TOTAL_SEMITONES) * 100

  // ── INTRO ───────────────────────────────────────────────────────────────
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
          <div className={styles.scalePreviewLabel}>YOUR STARTING SCALE — TAP KEYS TO HEAR</div>
          <ScalePiano
            scaleNotes={currentLevel.notes}
            activeNote={null}
            passedNotes={[]}
            levelColor={currentLevel.color}
            onPlay={handleKeyTap}
          />
          <div className={styles.scaleDesc}>{currentLevel.description}</div>
          <div className={styles.cycleInfo}>
            The scale will rise by one semitone after each pass — completing a full octave over 12 cycles.
          </div>
        </div>

        <button className={styles.startBtn} onClick={startExercise}>BEGIN EXERCISE</button>
        <button className={styles.closeBtn} onClick={onClose}>NOT NOW</button>
      </div>
    </div>
  )

  // ── COMPLETE ─────────────────────────────────────────────────────────────
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

  // ── ACTIVE ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.activeHeader}>
          <div className={styles.activeTitle}>{ex.name.toUpperCase()}</div>
          <div className={styles.repBadge} style={{ borderColor: currentLevel.color, color: currentLevel.color }}>
            Cycle {semitone + 1}/{TOTAL_SEMITONES}
          </div>
        </div>

        {/* Coach */}
        <div className={styles.coachBubble}>
          <div className={styles.coachIcon}>🎤</div>
          <div className={styles.coachText}>{coachMsg}</div>
        </div>

        {/* Semitone progress bar */}
        <div className={styles.semitoneRow}>
          <span className={styles.semitoneLabel}>+{semitone} semitone{semitone !== 1 ? 's' : ''}</span>
          <div className={styles.semitoneBar}>
            <div className={styles.semitoneFill}
              style={{ width: `${semitoneProgress}%`, background: currentLevel.color }} />
            {Array.from({ length: TOTAL_SEMITONES }).map((_, i) => (
              <div key={i} className={`${styles.semitoneTick} ${i < semitone ? styles.semitoneTickDone : ''}`}
                style={i < semitone ? { background: currentLevel.color } : {}} />
            ))}
          </div>
          <span className={styles.semitoneLabel}>+12</span>
        </div>

        {/* Direction */}
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
          {xpFloats.map(f => <XPFloat key={f.id} amount={f.amount} onDone={() => removeXPFloat(f.id)} />)}
          <ScalePiano
            scaleNotes={currentNotes}
            activeNote={activeNote}
            passedNotes={passedNotes}
            levelColor={currentLevel.color}
            onPlay={handleKeyTap}
          />
        </div>

        {/* Timer + XP */}
        <div className={styles.timerXpRow}>
          <div className={styles.timerRing}>
            <svg width="80" height="80" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
              <circle fill="none" stroke="var(--border)" strokeWidth="8" cx="60" cy="60" r="54" />
              <circle fill="none" stroke={currentLevel.color} strokeWidth="8" strokeLinecap="round"
                cx="60" cy="60" r="54"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={remaining !== null ? CIRCUMFERENCE * (1 - remaining / sessionSecs) : 0}
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

        {/* Breath */}
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

        <div className={styles.followHint}>🎤 Follow each note — match it with your voice</div>

        <button className={styles.stopBtn} onClick={() => { clearAll(); onClose() }}>END SESSION</button>
      </div>
    </div>
  )
}
