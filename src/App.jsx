import { useState } from 'react'
import styles from './App.module.css'
import ScalesPage from './pages/ScalesPage'
import MTDPage from './pages/MTDPage'
import Header from './components/Header'
import BottomNav from './components/BottomNav'

export default function App() {
  const [activePage, setActivePage] = useState('scales')
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className={styles.app}>
      <Header activePage={activePage} isPlaying={isPlaying} />
      <div className={styles.pages}>
        <div className={`${styles.page} ${activePage === 'scales' ? styles.active : ''}`}>
          <ScalesPage isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
        </div>
        <div className={`${styles.page} ${activePage === 'mtd' ? styles.active : ''}`}>
          <MTDPage />
        </div>
      </div>
      <BottomNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  )
}
