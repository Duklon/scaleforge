import { useState, useEffect } from 'react'
import styles from './XPFloat.module.css'

export default function XPFloat({ amount, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 400)
    }, 900)
    return () => clearTimeout(t)
  }, [onDone])

  if (!visible) return null

  return (
    <div className={`${styles.float} ${!visible ? styles.fadeOut : ''}`}>
      +{amount} XP
    </div>
  )
}
