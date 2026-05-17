import { useState, useEffect } from 'react'
import styles from './Toast.module.css'

let toastFn = null

export function showToast(msg) {
  toastFn?.(msg)
}

export default function Toast() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    toastFn = (m) => {
      setMsg(m)
      setVisible(true)
      setTimeout(() => setVisible(false), 2200)
    }
    return () => { toastFn = null }
  }, [])

  return (
    <div className={`${styles.toast} ${visible ? styles.visible : ''}`}>
      {msg}
    </div>
  )
}
