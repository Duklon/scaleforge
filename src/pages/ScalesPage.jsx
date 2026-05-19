import { useState, useCallback } from 'react'
import styles from './ScalesPage.module.css'
import { ALL_NOTES, ENHARMONIC, SCALES, getScaleNotes } from '../data/scales'
import { useAudio, unlockAudio } from '../hooks/useAudio'
import Piano from '../components/Piano'

export default function ScalesPage({ isPlaying, setIsPlaying }) {
  const [root, setRoot] = useState('C')
  const [scaleName, setScaleName] = useState('Major')
  const [octave, setOctave] = useState(4)
  const [bpm, setBpm] = useState(120)
  const [playingIdx, setPlayingIdx] = useState(-1)
  const { playNote, stopAll } = useAudio()

  const scaleData = SCALES[scaleName]
  const notes = getScaleNotes(root, scaleName)

  const handlePlayScale = useCallback((arpMode = false) => {
    unlockAudio()
    if (isPlaying) { stopAll(); setIsPlaying(false); setPlayingIdx(-1); return }
    const allNotes = arpMode ? [...notes, ...notes.slice(1).reverse()] : [...notes, notes[0]]
    const beatDur = 60 / bpm
    setIsPlaying(true)
    allNotes.forEach((n, i) => {
      const isUp = arpMode && i >= notes.length
      playNote(n, octave + (isUp ? 1 : 0), beatDur * 0.85, i * beatDur)
    })
    let idx = 0
    function tick() {
      setPlayingIdx(idx)
      idx++
      if (idx < allNotes.length + 1) setTimeout(tick, beatDur * 1000)
      else setTimeout(() => { setIsPlaying(false); setPlayingIdx(-1) }, beatDur * 1000)
    }
    tick()
  }, [isPlaying, notes, bpm, octave, playNote, stopAll, setIsPlaying])

  return (
    <div className={styles.page}>
      <div className="section-label">ROOT NOTE</div>
      <div className={styles.rootGrid}>
        {ALL_NOTES.map(note => (
          <button key={note} className={`${styles.noteBtn} ${note===root?styles.noteBtnActive:''}`}
            onClick={() => { setRoot(note) }}>
            <span>{note}{ENHARMONIC[note] && <small>{ENHARMONIC[note]}</small>}</span>
          </button>
        ))}
      </div>

      <div className="section-label">SCALE TYPE</div>
      <div className={`${styles.scaleScroll} hide-scrollbar`}>
        {Object.keys(SCALES).map(name => (
          <button key={name} className={`${styles.chip} ${name===scaleName?styles.chipActive:''}`}
            onClick={() => setScaleName(name)}>{name}</button>
        ))}
      </div>

      <div className={styles.infoCard}>
        <div className={styles.cardGlow} />
        <div className={styles.cardTitle}>{root} {scaleName.toUpperCase()}</div>
        <div className={styles.cardFormula}>INTERVALS: {scaleData.formula}</div>
        <div className={styles.notePills}>
          {notes.map((n, i) => (
            <button key={i} className={`${styles.notePill} ${i===0?styles.rootPill:''} ${i===playingIdx?styles.playingPill:''}`}
              onClick={() => { unlockAudio(); playNote(n, octave, 0.8) }}>{n}</button>
          ))}
        </div>
        <div className={styles.degrees}>
          {notes.map((_, i) => <span key={i} className={styles.degree}>{scaleData.degrees[i]||''}</span>)}
        </div>
      </div>

      <div className={styles.pianoCard}>
        <div className="section-label" style={{marginBottom:12}}>KEYBOARD</div>
        <div className={styles.octaveRow}>
          <span className={styles.octaveLabel}>OCTAVE</span>
          <div className={styles.octaveBtns}>
            <button className={styles.octBtn} onClick={() => setOctave(o=>Math.max(2,o-1))}>−</button>
            <span className={styles.octValue}>{octave}</span>
            <button className={styles.octBtn} onClick={() => setOctave(o=>Math.min(6,o+1))}>+</button>
          </div>
        </div>
        <Piano root={root} notes={notes} octave={octave} playNote={(n,o,d) => { unlockAudio(); playNote(n,o,d) }} />
      </div>

      <div className={styles.bpmCard}>
        <span className={styles.bpmLabel}>BPM</span>
        <span className={styles.bpmValue}>{bpm}</span>
        <input type="range" className={styles.bpmSlider} min={40} max={240} value={bpm}
          onChange={e => setBpm(parseInt(e.target.value))} />
      </div>

      <div className={styles.playBtns}>
        <button className={`${styles.playBtn} ${styles.playBtnPrimary}`} onClick={() => handlePlayScale(false)}>
          {isPlaying ? '■ STOP' : '▶ PLAY SCALE'}
        </button>
        <button className={`${styles.playBtn} ${styles.playBtnSecondary}`} onClick={() => handlePlayScale(true)}>
          ⟳ ARPEGGIO
        </button>
      </div>

      <div className={styles.desc}>{scaleData.desc}</div>
    </div>
  )
}
