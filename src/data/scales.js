export const ALL_NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
export const ENHARMONIC = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' }

export const SCALES = {
  'Major':         { intervals:[0,2,4,5,7,9,11], formula:'W-W-H-W-W-W-H', degrees:['I','II','III','IV','V','VI','VII'], desc:'The major scale is the foundation of Western music. Bright and stable — ideal for humming warm-ups and smooth interval training.' },
  'Natural Minor': { intervals:[0,2,3,5,7,8,10], formula:'W-H-W-W-H-W-W', degrees:['I','II','♭III','IV','V','♭VI','♭VII'], desc:'Darker and melancholic. Works well for smooth gliding and sustained tone exercises.' },
  'Pentatonic Maj':{ intervals:[0,2,4,7,9],      formula:'W-W-3H-W-3H',   degrees:['I','II','III','V','VI'], desc:'Five consonant notes with no half steps — reduced laryngeal strain. Excellent for MTD warm-ups.' },
  'Pentatonic Min':{ intervals:[0,3,5,7,10],     formula:'3H-W-W-3H-W',   degrees:['I','♭III','IV','V','♭VII'], desc:'Minor pentatonic avoids tension-prone intervals, ideal for low-effort vocal practice.' },
  'Blues':         { intervals:[0,3,5,6,7,10],   formula:'3H-W-H-H-3H',   degrees:['I','♭III','IV','♭V','V','♭VII'], desc:'Adds the expressive blue note. Use gently — avoid pushing on the ♭5 interval.' },
  'Dorian':        { intervals:[0,2,3,5,7,9,10], formula:'W-H-W-W-W-H-W', degrees:['I','II','♭III','IV','V','VI','♭VII'], desc:'Minor with a raised 6th — flowing quality useful for sustained tone exercises.' },
  'Harmonic Min.': { intervals:[0,2,3,5,7,8,11], formula:'W-H-W-W-H-A-H', degrees:['I','II','♭III','IV','V','♭VI','VII'], desc:'The augmented 2nd interval requires careful production — best for advanced practice.' },
  'Lydian':        { intervals:[0,2,4,6,7,9,11], formula:'W-W-W-H-W-W-H', degrees:['I','II','III','♯IV','V','VI','VII'], desc:'Dreamy, floating quality. Good for easy forward placement exercises.' },
  'Mixolydian':    { intervals:[0,2,4,5,7,9,10], formula:'W-W-H-W-W-H-W', degrees:['I','II','III','IV','V','VI','♭VII'], desc:'Major with a lowered 7th. Smooth intervals make it comfortable for sustained vocal exercises.' },
  'Whole Tone':    { intervals:[0,2,4,6,8,10],   formula:'W-W-W-W-W-W',   degrees:['I','II','III','♯IV','♯V','♭VII'], desc:'Uniform whole steps create an even glide — excellent for smooth portamento exercises.' },
}

export function getScaleNotes(root, scaleName) {
  const scale = SCALES[scaleName]
  const rootIdx = ALL_NOTES.indexOf(root)
  return scale.intervals.map(i => ALL_NOTES[(rootIdx + i) % 12])
}
