export const SCALE_LEVELS = [
  { level:1, name:'Pentatonic',     description:'No half steps — the gentlest intervals for your voice',         notes:['C4','D4','E4','G4','A4','C5'],                       color:'#00d4aa', xpRequired:0   },
  { level:2, name:'Major',          description:'Bright and stable — the classic do-re-mi scale',               notes:['C4','D4','E4','F4','G4','A4','B4','C5'],             color:'#5bc4f5', xpRequired:100 },
  { level:3, name:'Natural Minor',  description:'Introduces smaller intervals for expressive control',           notes:['C4','D4','Eb4','F4','G4','Ab4','Bb4','C5'],          color:'#c77dff', xpRequired:250 },
  { level:4, name:'Dorian',         description:'Minor with a lifted 6th — flowing and expressive',             notes:['C4','D4','Eb4','F4','G4','A4','Bb4','C5'],           color:'#ff9f68', xpRequired:450 },
  { level:5, name:'Harmonic Minor', description:'Advanced — wide augmented 2nd interval challenge',             notes:['C4','D4','Eb4','F4','G4','Ab4','B4','C5'],           color:'#ff6b35', xpRequired:700 },
]

export const XP_REWARDS = {
  completeNote:    5,
  completeRep:     15,
  completeExercise:50,
  perfectRep:      25,
  dailyBonus:      30,
  streakBonus:     20,
}

export const COACHING = {
  start:       ["Let's warm up that voice! 🎵","Take a breath — you've got this! 💪","Remember: easy and forward. Let's go!","Gentle and relaxed — start soft! 🌊"],
  noteMatch:   ["Great match! Keep that forward resonance! ✨","Beautiful! Feel the buzz in your lips!","Perfect! Stay relaxed and open!","Excellent! You're finding that sweet spot!","Lovely tone! Keep it effortless!"],
  repComplete: ["Rep complete! You're doing brilliantly! 🌟","Amazing work! Feel how free that sounds!","Fantastic! Your voice is opening up!","Superb! Notice how relaxed that felt!","Outstanding! Keep that easy placement!"],
  encouragement:["Keep going — you're doing great! 💫","Steady and easy — perfect! 🎶","Your voice sounds wonderful!","Stay soft — less is more! ✨","Beautiful resonance! Keep it forward!"],
  complete:    ["Exercise complete! Incredible session! 🎉","You crushed it! Your voice thanks you! 🌟","Brilliant work today! Rest that voice! 💪","Amazing session! Come back tomorrow! ⭐"],
}

export function randomCoach(type) {
  const msgs = COACHING[type] || COACHING.encouragement
  return msgs[Math.floor(Math.random() * msgs.length)]
}

export const ABILITY_TITLES = [
  { min:0,    title:'Beginner',     emoji:'🌱' },
  { min:100,  title:'Warming Up',   emoji:'🌿' },
  { min:250,  title:'Developing',   emoji:'🌳' },
  { min:450,  title:'Intermediate', emoji:'⭐' },
  { min:700,  title:'Advanced',     emoji:'🌟' },
  { min:1000, title:'Expert',       emoji:'🏆' },
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

// Standard equal temperament, A4 = 440Hz
const NOTE_FREQS = {
  'C3':130.81,'D3':146.83,'Eb3':155.56,'E3':164.81,'F3':174.61,'F#3':185.00,
  'G3':196.00,'Ab3':207.65,'A3':220.00,'Bb3':233.08,'B3':246.94,
  'C4':261.63,'D4':293.66,'Eb4':311.13,'E4':329.63,'F4':349.23,'F#4':369.99,
  'G4':392.00,'Ab4':415.30,'A4':440.00,'Bb4':466.16,'B4':493.88,
  'C5':523.25,'D5':587.33,'E5':659.25,
}

export function noteFreq(noteName) {
  return NOTE_FREQS[noteName] || 261.63
}
