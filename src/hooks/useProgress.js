import { useState, useEffect } from 'react'
import { getCurrentScaleLevel, getNextScaleLevel, getAbilityTitle, XP_REWARDS } from '../data/progression'

const STORAGE_KEY = 'scaleforge_progress'

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return { xp:0, totalExercises:0, lastSessionDate:null, completedToday:[], sessionCount:0 }
}

function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch (_) {}
}

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress)

  useEffect(() => { saveProgress(progress) }, [progress])

  // Reset daily completions on new day
  useEffect(() => {
    const today = new Date().toDateString()
    if (progress.lastSessionDate !== today) {
      setProgress(p => ({ ...p, completedToday:[], lastSessionDate:today, sessionCount:0 }))
    }
  }, [])

  function completeExercise(exerciseId) {
    const today = new Date().toDateString()
    setProgress(p => {
      const isFirstToday = p.lastSessionDate !== today
      const alreadyDone = p.completedToday.includes(exerciseId)
      let bonusXP = XP_REWARDS.completeExercise
      if (isFirstToday) bonusXP += XP_REWARDS.dailyBonus
      const newSessionCount = p.sessionCount + 1
      if (newSessionCount % 3 === 0) bonusXP += XP_REWARDS.streakBonus
      return {
        ...p,
        xp: p.xp + bonusXP,
        totalExercises: p.totalExercises + 1,
        completedToday: alreadyDone ? p.completedToday : [...p.completedToday, exerciseId],
        lastSessionDate: today,
        sessionCount: newSessionCount,
      }
    })
  }

  function addNoteXP() {
    setProgress(p => ({ ...p, xp: p.xp + XP_REWARDS.completeNote }))
    return XP_REWARDS.completeNote
  }

  function addRepXP(perfect = false) {
    const amount = perfect ? XP_REWARDS.perfectRep : XP_REWARDS.completeRep
    setProgress(p => ({ ...p, xp: p.xp + amount }))
    return amount
  }

  const currentLevel    = getCurrentScaleLevel(progress.xp)
  const nextLevel       = getNextScaleLevel(progress.xp)
  const abilityTitle    = getAbilityTitle(progress.xp)
  const xpToNext        = nextLevel ? nextLevel.xpRequired - progress.xp : 0
  const xpInLevel       = progress.xp - currentLevel.xpRequired
  const xpRangeInLevel  = nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 300
  const levelProgress   = Math.min(1, xpInLevel / xpRangeInLevel)

  return { progress, currentLevel, nextLevel, abilityTitle, xpToNext, levelProgress, completeExercise, addNoteXP, addRepXP }
}
