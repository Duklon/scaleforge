import styles from './Header.module.css'

export default function Header({ activePage, isPlaying }) {
  const isMTD = activePage === 'mtd'

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        Scale<span>Forge</span>
      </div>
      <div className={styles.right}>
        <WaveIndicator active={isPlaying} />
        <div className={`${styles.pill} ${isMTD ? styles.mtdPill : ''}`}>
          {isPlaying ? 'PLAYING' : isMTD ? 'MTD MODE' : 'READY'}
        </div>
      </div>
    </header>
  )
}

function WaveIndicator({ active }) {
  return (
    <div className={styles.wave}>
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className={`${styles.bar} ${active ? styles.barActive : ''}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}
