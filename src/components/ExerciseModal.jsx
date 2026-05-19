import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './ExerciseModal.module.css'
import { useAudio, unlockAudio } from '../hooks/useAudio'
import { noteFreq, randomCoach, XP_REWARDS } from '../data/progression'
import XPFloat from './XPFloat'

const CIRCUMFERENCE = 2 * Math.PI * 54
const REPS_PER_EXERCISE = 3

export default function ExerciseModal({ exercise: ex, currentLevel, onClose, onComplete, onAddNoteXP, onAddRepXP }) {
  const [phase, setPhase] = useState('intro')
  const [noteIdx, setNoteIdx] = useState(0)
  const [currentRep, setCurrentRep] = useState(1)
  const [repStartTime, setRepStartTime] = useState(null)
  const [noteState, setNoteState] = useState('idle')
  const [coachMsg, setCoachMsg] = useState(randomCoach('start'))
  const [xpFloats, setXpFloats] = useState([])
  const [totalXP, setTotalXP] = useState(0)
  const [breathPhase, setBreathPhase] = useState(0)
  const [glidePos, setGlidePos] = useState(0)
  const [remaining, setRemaining] = useState(ex.timerSecs)
  const [notesPassed, setNotesPassed] = useState([])
  const [pulseNote, setPulseNote] = useState(false)

  const { playToneHz, playGlide, playTrill, stopAll } = useAudio()
  const timerRef     = useRef(null)
  const breathRef    = useRef(null)
  const glideRef     = useRef(null)
  const noteTimeout  = useRef(null)
  const coachTimeout = useRef(null)
  const xpIdRef      = useRef(0)
  // Keep a ref to the current note index so timeouts always read the latest value
  const noteIdxRef   = useRef(0)
  const noteStateRef = useRef('idle')
  const phaseRef     = useRef('intro')

  const scaleNotes = currentLevel.notes
  const offset     = CIRCUMFERENCE * (1 - remaining / ex.timerSecs)

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

  // Always pass the note name explicitly — never rely on state inside timeouts
  function playNoteByName(noteName) {
    unlockAudio()
    if (!noteName) return
    const freq = noteFreq(noteName)
    if (!freq) return
    noteStateRef.current = 'playing'
    setNoteState('playing')
    setPulseNote(true)
    setTimeout(() => setPulseNote(false), 600)
    playToneHz(freq, 2.0, 'sine', 0.22)
    noteTimeout.current = setTimeout(() => {
      noteStateRef.current = 'waiting'
      setNoteState('waiting')
    }, 2300)
  }

  // Called from the PLAY NOTE button - reads current note from ref
  function handlePlayNoteButton() {
    if (noteStateRef.current === 'playing') return
    const noteName = scaleNotes[noteIdxRef.current]
    playNoteByName(noteName)
  }

  function advanceToNote(idx) {
    noteIdxRef.current = idx
    noteStateRef.current = 'idle'
    setNoteIdx(idx)
    setNoteState('idle')
  }

  function confirmNote() {
    if (noteStateRef.current !== 'waiting' && noteStateRef.current !== 'playing') return
    const idx = noteIdxRef.current
    noteStateRef.current = 'confirmed'
    setNoteState('confirmed')
    setNotesPassed(prev => [...prev, idx])
    spawnXP(XP_REWARDS.completeNote)
    onAddNoteXP()
    showCoach('noteMatch')

    setTimeout(() => {
      const nextIdx = idx + 1
      if (nextIdx >= scaleNotes.length) {
        finishRep()
      } else {
        advanceToNote(nextIdx)
        // Auto play next note after a short pause
        noteTimeout.current = setTimeout(() => {
          playNoteByName(scaleNotes[nextIdx])
        }, 600)
      }
    }, 700)
  }

  function finishRep() {
    const elapsed = Date.now() - repStartTime
    const perfect = elapsed < ex.timerSecs * 1000 * 1.5
    onAddRepXP(perfect)
    spawnXP(perfect ? XP_REWARDS.perfectRep : XP_REWARDS.completeRep)
    showCoach('repComplete')

    setCurrentRep(rep => {
      const nextRep = rep + 1
      if (nextRep > REPS_PER_EXERCISE) {
        setTimeout(() => completeExercise(), 1400)
      } else {
        setTimeout(() => {
          advanceToNote(0)
          setNotesPassed([])
          setRepStartTime(Date.now())
          showCoach('encouragement', 600)
          // Auto play first note of next rep
          noteTimeout.current = setTimeout(() => {
            playNoteByName(scaleNotes[0])
          }, 1000)
        }, 1400)
      }
      return nextRep
    })
  }

  function completeExercise() {
    clearAll()
    phaseRef.current = 'complete'
    setPhase('complete')
    spawnXP(XP_REWARDS.completeExercise)
    showCoach('complete')
    onComplete()
  }

  function startExercise() {
    unlockAudio()
    phaseRef.current = 'active'
    setPhase('active')
    noteIdxRef.current = 0
    noteStateRef.current = 'idle'
    setNoteIdx(0)
    setNoteState('idle')
    setNotesPassed([])
    setCurrentRep(1)
    setRepStartTime(Date.now())
    setRemaining(ex.timerSecs)
    showCoach('start')

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

    // Play first note after 1 second — pass note name directly, never rely on state
    const firstNote = scaleNotes[0]
    noteTimeout.current = setTimeout(() => {
      playNoteByName(firstNote)
    }, 1000)
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
  const currentNote  = scaleNotes[noteIdx]

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
          <div className={styles.scalePreviewLabel}>YOUR SCALE TODAY</div>
          <div className={styles.scaleNoteRow}>
            {currentLevel.notes.map((n, i) => (
              <div key={i} className={styles.scaleNotePill}
                style={{ background: currentLevel.color + '22', borderColor: currentLevel.color + '66', color: currentLevel.color }}>
                {n.replace(/\d/, '')}
              </div>
            ))}
          </div>
          <div className={styles.scaleDesc}>{currentLevel.description}</div>
        </div>

        <div className={styles.xpPreview}>
          ⭐ Up to {XP_REWARDS.completeExercise + currentLevel.notes.length * REPS_PER_EXERCISE * XP_REWARDS.completeNote + REPS_PER_EXERCISE * XP_REWARDS.perfectRep} XP available
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
            <div className={styles.statNum}>{currentLevel.notes.length * REPS_PER_EXERCISE}</div>
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

        {/* Scale note progress dots */}
        <div className={styles.noteProgress}>
          {scaleNotes.map((n, i) => (
            <div key={i}
              className={`${styles.noteDot} ${i === noteIdx ? styles.noteDotActive : ''} ${notesPassed.includes(i) ? styles.noteDotDone : ''}`}
              style={
                i === noteIdx
                  ? { background: currentLevel.color, boxShadow: `0 0 10px ${currentLevel.color}`, color: '#000' }
                  : notesPassed.includes(i)
                  ? { background: currentLevel.color + '44', color: currentLevel.color }
                  : {}
              }>
              {n.replace(/\d/, '')}
            </div>
          ))}
        </div>

        {/* Big note display */}
        <div className={styles.noteDisplayWrap}>
          {xpFloats.map(f => <XPFloat key={f.id} amount={f.amount} onDone={() => removeXPFloat(f.id)} />)}
          <div
            className={`${styles.bigNote} ${pulseNote ? styles.bigNotePulse : ''} ${noteState === 'confirmed' ? styles.bigNoteConfirmed : ''}`}
            style={{ color: currentLevel.color, textShadow: `0 0 40px ${currentLevel.color}88` }}>
            {currentNote ? currentNote.replace(/\d/, '') : '—'}
          </div>
          <div className={styles.noteHz}>
            {currentNote ? `${Math.round(noteFreq(currentNote))} Hz` : ''}
          </div>
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

        {/* Breath ball */}
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

        {/* Action buttons */}
        <div className={styles.actionRow}>
          <button
            className={`${styles.playNoteBtn} ${noteState === 'playing' ? styles.playNoteBtnActive : ''}`}
            style={{
              borderColor: currentLevel.color,
              color: noteState === 'playing' ? '#000' : currentLevel.color,
              background: noteState === 'playing' ? currentLevel.color : 'transparent'
            }}
            onClick={handlePlayNoteButton}
            disabled={noteState === 'confirmed'}>
            ▶ PLAY NOTE
          </button>
          <button
            className={`${styles.matchBtn} ${(noteState === 'waiting' || noteState === 'playing') ? styles.matchBtnReady : ''}`}
            style={(noteState === 'waiting' || noteState === 'playing') ? {
              background: `linear-gradient(135deg, ${currentLevel.color}, var(--mtd2))`,
              color: '#000',
              borderColor: currentLevel.color
            } : {}}
            onClick={confirmNote}
            disabled={noteState === 'idle' || noteState === 'confirmed'}>
            {noteState === 'confirmed' ? '✓ MATCHED!' : '✓ I MATCHED IT'}
          </button>
        </div>

        <button className={styles.stopBtn} onClick={() => { clearAll(); onClose() }}>END SESSION</button>
      </div>
    </div>
  )
}
