// ── SCALE PROGRESSION LEVELS ─────────────────────────────────────────────
// Each level unlocks wider intervals. Users progress based on performance.
export const SCALE_LEVELS = [
  {
    level: 1,
    name: 'Pentatonic',
    description: 'No half steps — the gentlest intervals for your voice',
    notes: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
    intervals: [0, 2, 4, 7, 9, 12],
    color: '#00d4aa',
    xpRequired: 0,
  },
  {
    level: 2,
    name: 'Major',
    description: 'Bright and stable — the classic do-re-mi scale',
    notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    intervals: [0, 2, 4, 5, 7, 9, 11, 12],
    color: '#5bc4f5',
    xpRequired: 100,
  },
  {
    level: 3,
    name: 'Natural Minor',
    description: 'Introduces smaller intervals for expressive control',
    notes: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
    intervals: [0, 2, 3, 5, 7, 8, 10, 12],
    color: '#c77dff',
    xpRequired: 250,
  },
  {
    level: 4,
    name: 'Dorian',
    description: 'Minor with a lifted 6th — flowing and expressive',
    notes: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4', 'C5'],
    intervals: [0, 2, 3, 5, 7, 9, 10, 12],
    color: '#ff9f68',
    xpRequired: 450,
  },
  {
    level: 5,
    name: 'Harmonic Minor',
    description: 'Advanced — wide augmented 2nd interval challenge',
    notes: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'B4', 'C5'],
    intervals: [0, 2, 3, 5, 7, 8, 11, 12],
    color: '#ff6b35',
    xpRequired: 700,
  },
]

// ── XP REWARDS ────────────────────────────────────────────────────────────
export const XP_REWARDS = {
  completeNote: 5,        // user confirms they matched a note
  completeRep: 15,        // completed one full rep
  completeExercise: 50,   // finished the whole exercise
  perfectRep: 25,         // bonus for completing rep without stopping
  dailyBonus: 30,         // first exercise of the day
  streakBonus: 20,        // completing 3+ exercises in a session
}

// ── COACHING MESSAGES ─────────────────────────────────────────────────────
export const COACHING = {
  start: [
    "Let's warm up that voice! 🎵",
    "Take a breath — you've got this! 💪",
    "Remember: easy and forward. Let's go!",
    "Gentle and relaxed — start soft! 🌊",
  ],
  noteMatch: [
    "Great match! Keep that forward resonance! ✨",
    "Beautiful! Feel the buzz in your lips!",
    "Perfect! Stay relaxed and open!",
    "Excellent! You're finding that sweet spot!",
    "Lovely tone! Keep it effortless!",
  ],
  repComplete: [
    "Rep complete! You're doing brilliantly! 🌟",
    "Amazing work! Feel how free that sounds!",
    "Fantastic! Your voice is opening up!",
    "Superb! Notice how relaxed that felt!",
    "Outstanding! Keep that easy placement!",
  ],
  levelUp: [
    "You've unlocked a new scale level! 🏆",
    "Incredible progress! New intervals await!",
    "Level up! Your voice is getting stronger!",
  ],
  encouragement: [
    "Keep going — you're doing great! 💫",
    "Steady and easy — perfect! 🎶",
    "Your voice sounds wonderful!",
    "Stay soft — less is more! ✨",
    "Beautiful resonance! Keep it forward!",
  ],
  complete: [
    "Exercise complete! Incredible session! 🎉",
    "You crushed it! Your voice thanks you! 🌟",
    "Brilliant work today! Rest that voice! 💪",
    "Amazing session! Come back tomorrow! ⭐",
  ],
  streak: [
    "3 exercises done — you're on fire! 🔥",
    "Incredible streak! Your consistency shows!",
    "5 in a row! You're a vocal warrior! ⚡",
  ],
}

export function randomCoach(type) {
  const msgs = COACHING[type] || COACHING.encouragement
  return msgs[Math.floor(Math.random() * msgs.length)]
}

// ── ABILITY LEVELS ────────────────────────────────────────────────────────
export const ABILITY_TITLES = [
  { min: 0,    title: 'Beginner',    emoji: '🌱' },
  { min: 100,  title: 'Warming Up',  emoji: '🌿' },
  { min: 250,  title: 'Developing',  emoji: '🌳' },
  { min: 450,  title: 'Intermediate',emoji: '⭐' },
  { min: 700,  title: 'Advanced',    emoji: '🌟' },
  { min: 1000, title: 'Expert',      emoji: '🏆' },
]

export function getAbilityTitle(xp) {
  return [...ABILITY_TITLES].reverse().find(a => xp >= a.min) || ABILITY_TITLES[0]
}

export function getCurrentScaleLevel(xp) {
  return [...SCALE_LEVELS].reverse().find(l => xp >= l.xpRequired) || SCALE_LEVELS[0]
}

export function getNextScaleLevel(xp) {
  return SCALE_LEVELS.find(l => l.xpRequired > xp) || null
}

// ── NOTE FREQS for scale levels ───────────────────────────────────────────
const NOTE_FREQS = {
  'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63,
  'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'Ab4': 415.30,
  'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88, 'C5': 523.25,
}

export function noteFreq(noteName) {
  return NOTE_FREQS[noteName] || 440
}
