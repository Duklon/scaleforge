import styles from './ProgressDashboard.module.css'

export default function ProgressDashboard({ progress, currentLevel, nextLevel, abilityTitle, xpToNext, levelProgress }) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.left}>
          <div className={styles.emoji}>{abilityTitle.emoji}</div>
          <div>
            <div className={styles.title}>{abilityTitle.title}</div>
            <div className={styles.xp}>{progress.xp} XP total</div>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.sessionStat}>{progress.totalExercises}</div>
          <div className={styles.sessionLabel}>exercises</div>
        </div>
      </div>

      <div className={styles.levelRow}>
        <div className={styles.levelName} style={{ color: currentLevel.color }}>
          Level {currentLevel.level}: {currentLevel.name}
        </div>
        {nextLevel && (
          <div className={styles.nextLevel}>
            Next: {nextLevel.name} in {xpToNext} XP
          </div>
        )}
        {!nextLevel && (
          <div className={styles.nextLevel} style={{ color: '#ffd700' }}>Max Level! 🏆</div>
        )}
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: `${levelProgress * 100}%`,
            background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel?.color || '#ffd700'})`,
          }}
        />
      </div>

      <div className={styles.todayRow}>
        {progress.completedToday.length > 0 ? (
          <span className={styles.todayDone}>✓ {progress.completedToday.length} done today</span>
        ) : (
          <span className={styles.todayEmpty}>No exercises yet today — let's go!</span>
        )}
        {progress.sessionCount >= 3 && (
          <span className={styles.streakBadge}>🔥 On a streak!</span>
        )}
      </div>
    </div>
  )
}
