import { useState } from 'react'
import styles from './MTDPage.module.css'
import { MTD_EXERCISES, MTD_CATEGORIES, DAILY_ROUTINE_IDS } from '../data/exercises'
import { useProgress } from '../hooks/useProgress'
import ProgressDashboard from '../components/ProgressDashboard'
import ExerciseModal from '../components/ExerciseModal'

export default function MTDPage() {
  const [category, setCategory] = useState('All')
  const [activeExercise, setActiveExercise] = useState(null)
  const { progress, currentLevel, nextLevel, abilityTitle, xpToNext, levelProgress, completeExercise, addNoteXP, addRepXP } = useProgress()

  const filtered = category === 'All' ? MTD_EXERCISES : MTD_EXERCISES.filter(e => e.category === category)

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroTitle}>🫁 MTD VOICE THERAPY</div>
        <div className={styles.heroSub}>Guided vocal rehabilitation — earn XP as you progress through increasingly challenging scales.</div>
      </div>

      <div className={styles.disclaimer}>
        <span className={styles.disclaimerIcon}>⚕️</span>
        <span>Supplemental tool only. Always follow your speech-language pathologist's guidance. Stop if you feel pain.</span>
      </div>

      <ProgressDashboard progress={progress} currentLevel={currentLevel} nextLevel={nextLevel}
        abilityTitle={abilityTitle} xpToNext={xpToNext} levelProgress={levelProgress} />

      <div className="section-label">TODAY'S ROUTINE</div>
      <div className={styles.routineCard}>
        <div className={styles.routineTitle}>DAILY EXERCISES — TAP TO START</div>
        {DAILY_ROUTINE_IDS.map(id => {
          const ex = MTD_EXERCISES.find(e => e.id === id)
          if (!ex) return null
          const done = progress.completedToday.includes(id)
          return (
            <div key={id} className={`${styles.routineRow} ${done?styles.routineRowDone:''}`} onClick={() => setActiveExercise(ex)}>
              <div className={styles.routineLeft}>
                <div className={`${styles.routineCheck} ${done?styles.routineCheckDone:''}`}>{done?'✓':''}</div>
                <span className={`${styles.routineName} ${done?styles.routineNameDone:''}`}>{ex.name}</span>
              </div>
              <div className={styles.routineRight}>
                <span className={styles.routineXP}>+XP</span>
                <span className={styles.routineArrow}>›</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-label">CURRENT SCALE LEVEL</div>
      <div className={styles.levelCard} style={{ borderColor:currentLevel.color+'44' }}>
        <div className={styles.levelCardLeft}>
          <div className={styles.levelNum} style={{ color:currentLevel.color }}>LVL {currentLevel.level}</div>
          <div>
            <div className={styles.levelCardName} style={{ color:currentLevel.color }}>{currentLevel.name}</div>
            <div className={styles.levelCardDesc}>{currentLevel.description}</div>
          </div>
        </div>
        <div className={styles.levelNotes}>
          {currentLevel.notes.slice(0,5).map((n,i) => (
            <div key={i} className={styles.levelNoteDot} style={{ background:currentLevel.color+'33', color:currentLevel.color }}>
              {n.replace(/\d/,'')}
            </div>
          ))}
          {currentLevel.notes.length > 5 && <div className={styles.levelNoteDot} style={{color:currentLevel.color}}>+{currentLevel.notes.length-5}</div>}
        </div>
      </div>

      <div className="section-label">EXERCISE LIBRARY</div>
      <div className={`${styles.catTabs} hide-scrollbar`}>
        {MTD_CATEGORIES.map(cat => (
          <button key={cat} className={`${styles.catTab} ${cat===category?styles.catTabActive:''}`}
            onClick={() => setCategory(cat)}>{cat}</button>
        ))}
      </div>

      {filtered.map(ex => {
        const done = progress.completedToday.includes(ex.id)
        return (
          <div key={ex.id} className={styles.exCard} onClick={() => setActiveExercise(ex)}>
            <div className={styles.exHeader}>
              <span className={styles.exName}>{ex.name}</span>
              <span className={`${styles.badge} ${styles['badge_'+ex.difficulty]}`}>{ex.difficulty.toUpperCase()}</span>
            </div>
            <div className={styles.exDesc}>{ex.desc}</div>
            <div className={styles.exMeta}>
              <span>⏱ {ex.duration}</span>
              <span>🔁 {ex.reps}</span>
              <span>{ex.category}</span>
              {done && <span className={styles.doneBadge}>✓ Done today</span>}
            </div>
          </div>
        )
      })}

      <div style={{height:24}} />

      {activeExercise && (
        <ExerciseModal
          exercise={activeExercise}
          currentLevel={currentLevel}
          onClose={() => setActiveExercise(null)}
          onComplete={() => { completeExercise(activeExercise.id); setActiveExercise(null) }}
          onAddNoteXP={addNoteXP}
          onAddRepXP={addRepXP}
        />
      )}
    </div>
  )
}
