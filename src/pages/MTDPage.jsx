import { useState } from 'react'
import styles from './MTDPage.module.css'
import { MTD_EXERCISES, MTD_CATEGORIES, DAILY_ROUTINE_IDS } from '../data/exercises'
import ExerciseModal from '../components/ExerciseModal'

export default function MTDPage() {
  const [category, setCategory] = useState('All')
  const [completed, setCompleted] = useState(new Set())
  const [activeExercise, setActiveExercise] = useState(null)

  const filtered = category === 'All'
    ? MTD_EXERCISES
    : MTD_EXERCISES.filter(e => e.category === category)

  function markComplete(id) {
    setCompleted(prev => new Set([...prev, id]))
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroTitle}>🫁 MTD VOICE THERAPY</div>
        <div className={styles.heroSub}>
          Exercises for Muscle Tension Dysphonia — gentle, progressive vocal rehabilitation guided by sound and breath cues.
        </div>
      </div>

      <div className={styles.disclaimer}>
        <span className={styles.disclaimerIcon}>⚕️</span>
        <span>These exercises are supplemental tools. Always follow your speech-language pathologist's guidance. Stop immediately if you feel pain or increased strain.</span>
      </div>

      <div className="section-label">TODAY'S ROUTINE</div>
      <div className={styles.routineCard}>
        <div className={styles.routineTitle}>DAILY EXERCISES — TAP TO OPEN</div>
        {DAILY_ROUTINE_IDS.map(id => {
          const ex = MTD_EXERCISES.find(e => e.id === id)
          if (!ex) return null
          const done = completed.has(id)
          return (
            <div key={id} className={styles.routineRow} onClick={() => setActiveExercise(ex)}>
              <span className={`${styles.routineName} ${done ? styles.routineNameDone : ''}`}>{ex.name}</span>
              <div className={styles.dots}>
                {[0,1,2].map(i => (
                  <div key={i} className={`${styles.dot} ${done ? styles.dotDone : ''}`} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-label">EXERCISE LIBRARY</div>
      <div className={`${styles.catTabs} hide-scrollbar`}>
        {MTD_CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`${styles.catTab} ${cat === category ? styles.catTabActive : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.map(ex => (
        <div key={ex.id} className={styles.exCard} onClick={() => setActiveExercise(ex)}>
          <div className={styles.exHeader}>
            <span className={styles.exName}>{ex.name}</span>
            <span className={`${styles.badge} ${styles['badge_' + ex.difficulty]}`}>
              {ex.difficulty.toUpperCase()}
            </span>
          </div>
          <div className={styles.exDesc}>{ex.desc}</div>
          <div className={styles.exMeta}>
            <span>⏱ {ex.duration}</span>
            <span>🔁 {ex.reps}</span>
            <span>{ex.category}</span>
            {completed.has(ex.id) && <span className={styles.doneBadge}>✓ Done</span>}
          </div>
        </div>
      ))}

      <div style={{ height: 24 }} />

      {activeExercise && (
        <ExerciseModal
          exercise={activeExercise}
          onClose={() => setActiveExercise(null)}
          onComplete={() => {
            markComplete(activeExercise.id)
            setActiveExercise(null)
          }}
        />
      )}
    </div>
  )
}
