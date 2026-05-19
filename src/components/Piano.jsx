import styles from './Piano.module.css'
import { ALL_NOTES } from '../data/scales'

const WHITE_NOTES = ['C','D','E','F','G','A','B']
const BLACK_OFFSETS = { 'C#':0,'D#':1,'F#':3,'G#':4,'A#':5 }

export default function Piano({ root, notes, octave, playNote }) {
  const octaves = [octave, octave + 1]
  return (
    <div className={`${styles.container} hide-scrollbar`}>
      <div className={styles.keys}>
        {octaves.map(oct => WHITE_NOTES.map(note => {
          const inScale = notes.includes(note)
          const isRoot = note === root && inScale
          return (
            <div key={`${note}${oct}`}
              className={`${styles.white} ${isRoot ? styles.rootKey : inScale ? styles.inScale : ''}`}
              onPointerDown={() => playNote(note, oct, 0.8)}>
              <span className={styles.keyLabel}>{note}{oct}</span>
            </div>
          )
        }))}
        {octaves.map((oct, octIdx) => Object.entries(BLACK_OFFSETS).map(([note, wo]) => {
          const left = (octIdx * 7 + wo) * 42 + 28
          const inScale = notes.includes(note)
          const isRoot = note === root && inScale
          return (
            <div key={`${note}${oct}`} className={styles.blackWrapper} style={{ left }}>
              <div className={`${styles.black} ${isRoot ? styles.rootBlack : inScale ? styles.inScaleBlack : ''}`}
                onPointerDown={e => { e.stopPropagation(); playNote(note, oct, 0.8) }}>
                <span className={styles.keyLabel}>{note}{oct}</span>
              </div>
            </div>
          )
        }))}
      </div>
    </div>
  )
}
