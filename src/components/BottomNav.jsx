import styles from './BottomNav.module.css'

const TABS = [
  {
    id: 'scales',
    label: 'Scales',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
      </svg>
    ),
  },
  {
    id: 'mtd',
    label: 'MTD',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="12" cy="12" rx="10" ry="6" />
        <path d="M12 6v12M6 9c0 0 2 3 6 3s6-3 6-3" />
      </svg>
    ),
  },
]

export default function BottomNav({ activePage, setActivePage }) {
  return (
    <nav className={styles.nav}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activePage === tab.id ? styles.active : ''} ${activePage === tab.id && tab.id === 'mtd' ? styles.mtdActive : ''}`}
          onClick={() => setActivePage(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
