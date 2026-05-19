export const SCALE_LEVELS = [
  { level:1, name:'Pentatonic',     description:'No half steps — the gentlest intervals for your voice',     notes:['C4','D4','E4','G4','A4','C5'],              color:'#00d4aa', xpRequired:0   },
  { level:2, name:'Major',          description:'Bright and stable — the classic do-re-mi scale',           notes:['C4','D4','E4','F4','G4','A4','B4','C5'],    color:'#5bc4f5', xpRequired:100 },
  { level:3, name:'Natural Minor',  description:'Introduces smaller intervals for expressive control',       notes:['C4','D4','Eb4','F4','G4','Ab4','Bb4','C5'], color:'#c77dff', xpRequired:250 },
  { level:4, name:'Dorian',         description:'Minor with a lifted 6th — flowing and expressive',         notes:['C4','D4','Eb4','F4','G4','A4','Bb4','C5'],  color:'#ff9f68', xpRequired:450 },
  { level:5, name:'Harmonic Minor', description:'Advanced — wide augmented 2nd interval challenge',         notes:['C4','D4','Eb4','F4','G4','Ab4','B4','C5'],  color:'#ff6b35', xpRequired:700 },
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
  start:        ["Let's warm up that voice! 🎵","Take a breath — you've got this! 💪","Remember: easy and forward. Let's go!","Gentle and relaxed — start soft! 🌊"],
  noteMatch:    ["Great match! Keep that forward resonance! ✨","Beautiful! Feel the buzz in your lips!","Perfect! Stay relaxed and open!","Excellent! You're finding that sweet spot!","Lovely tone! Keep it effortless!"],
  repComplete:  ["Cycle complete! You're doing brilliantly! 🌟","Amazing — going up a semitone now!","Fantastic! Your voice is climbing beautifully!","Superb! One step higher — you've got this!","Outstanding! Keep that easy placement!"],
  encouragement:["Keep going — you're doing great! 💫","Steady and easy — perfect! 🎶","Your voice sounds wonderful!","Stay soft — less is more! ✨","Beautiful resonance! Keep it forward!"],
  complete:     ["Exercise complete! Incredible session! 🎉","You crushed it! Your voice thanks you! 🌟","Brilliant work today! Rest that voice! 💪","Amazing session! Come back tomorrow! ⭐"],
  semitoneUp:   ["⬆ Up a semitone — nice and easy!","⬆ One step higher — stay relaxed!","⬆ Climbing beautifully — keep going!","⬆ New key — feel it forward!"],
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

// ── NOTES & FREQUENCIES ───────────────────────────────────────────────────
export const ALL_CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

const FLAT_TO_SHARP = { 'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#' }

// Full equal temperament table, A4 = 440Hz, C2–B6
const NOTE_FREQS = {
  'C2':65.41,'C#2':69.3,'D2':73.42,'D#2':77.78,'E2':82.41,'F2':87.31,'F#2':92.5,'G2':98.0,'G#2':103.83,'A2':110.0,'A#2':116.54,'B2':123.47,
  'C3':130.81,'C#3':138.59,'D3':146.83,'D#3':155.56,'E3':164.81,'F3':174.61,'F#3':185.0,'G3':196.0,'G#3':207.65,'A3':220.0,'A#3':233.08,'B3':246.94,
  'C4':261.63,'C#4':277.18,'D4':293.66,'D#4':311.13,'E4':329.63,'F4':349.23,'F#4':369.99,'G4':392.0,'G#4':415.3,'A4':440.0,'A#4':466.16,'B4':493.88,
  'C5':523.25,'C#5':554.37,'D5':587.33,'D#5':622.25,'E5':659.26,'F5':698.46,'F#5':739.99,'G5':783.99,'G#5':830.61,'A5':880.0,'A#5':932.33,'B5':987.77,
  'C6':1046.5,'C#6':1108.73,'D6':1174.66,'D#6':1244.51,'E6':1318.51,'F6':1396.91,'F#6':1479.98,'G6':1567.98,'G#6':1661.22,'A6':1760.0,'A#6':1864.66,'B6':1975.53,
}

export function noteFreq(noteName) {
  if (!noteName) return 261.63
  // Handle flats — look up sharp equivalent
  const m = noteName.match(/^([A-G]b?)(\d)$/)
  if (m) {
    const sharp = FLAT_TO_SHARP[m[1]]
    if (sharp) return NOTE_FREQS[sharp + m[2]] || 261.63
  }
  return NOTE_FREQS[noteName] || 261.63
}

// Transpose a note name (e.g. "C4") up by n semitones
// Returns sharp note names (e.g. "C#4")
export function transposeNote(noteName, semitones) {
  if (!noteName) return noteName
  const m = noteName.match(/^([A-G])(b|#)?(\d)$/)
  if (!m) return noteName
  const letter = m[1], acc = m[2] || '', oct = parseInt(m[3])
  const display = letter + acc
  const sharp   = FLAT_TO_SHARP[display] || display
  const idx     = ALL_CHROMATIC.indexOf(sharp)
  if (idx === -1) return noteName
  const newSemi = oct * 12 + idx + semitones
  const newOct  = Math.floor(newSemi / 12)
  const newIdx  = ((newSemi % 12) + 12) % 12
  return ALL_CHROMATIC[newIdx] + newOct
}

// Transpose an entire scale by n semitones
export function transposeScale(notes, semitones) {
  return notes.map(n => transposeNote(n, semitones))
}
