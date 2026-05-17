# ScaleForge 🎵

A musical scales explorer and MTD (Muscle Tension Dysphonia) voice therapy app built with React + Vite + Capacitor.

## Features

- **Scales Tab** — 10 musical scales with interactive piano keyboard, arpeggio playback, BPM control
- **MTD Tab** — 12 guided voice therapy exercises with timer, breath animations, tone matching, and daily routine tracker

---

## Getting Started (Local Development)

### Prerequisites
- [Node.js 20+](https://nodejs.org)
- [Android Studio](https://developer.android.com/studio) (for Android builds)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/scaleforge.git
cd scaleforge

# Install dependencies
npm install

# Run in browser (hot reload)
npm run dev
```

---

## Building for Android

### First-time setup

```bash
# Build web assets
npm run build

# Add Android platform
npx cap add android

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

Then in Android Studio: **Build → Generate Signed Bundle/APK**

### Update workflow (after first setup)

```bash
# Edit your code, then:
npm run sync     # builds + syncs in one command
npx cap open android  # open Android Studio to build
```

---

## Play Store Deployment

1. Bump `versionCode` and `versionName` in `android/app/build.gradle`
2. Build a signed `.aab` (Android App Bundle) in Android Studio
3. Upload to [Google Play Console](https://play.google.com/console)

---

## Project Structure

```
src/
├── pages/
│   ├── ScalesPage.jsx       # Scales explorer
│   └── MTDPage.jsx          # Therapy exercises
├── components/
│   ├── Piano.jsx            # Interactive keyboard
│   ├── ExerciseModal.jsx    # Exercise detail + timer
│   ├── Header.jsx
│   ├── BottomNav.jsx
│   └── Toast.jsx
├── data/
│   ├── scales.js            # All scale data
│   └── exercises.js         # All MTD exercises
├── hooks/
│   └── useAudio.js          # Web Audio API hook
└── styles/
    └── global.css           # Design tokens + global styles
```

---

## Adding a New Scale

Open `src/data/scales.js` and add an entry to the `SCALES` object:

```js
'My Scale': {
  intervals: [0, 2, 3, 6, 7, 9, 11],
  formula: 'W-H-A-H-W-W-H',
  degrees: ['I', 'II', '♭III', '♯IV', 'V', 'VI', 'VII'],
  desc: 'Description of the scale.',
},
```

That's it — the UI updates automatically.

---

## Adding a New MTD Exercise

Open `src/data/exercises.js` and add an object to `MTD_EXERCISES`:

```js
{
  id: 'my-exercise',          // unique ID
  category: 'Relaxation',     // matches a category tab
  name: 'My Exercise',
  difficulty: 'easy',         // easy | medium | advanced
  duration: '3 min',
  reps: '5 reps',
  desc: 'Short description shown on the card.',
  steps: [
    'Step one instruction.',
    'Step two instruction.',
  ],
  timerSecs: 30,
  audioType: 'none',          // none | sigh | breathCycle | trill | straw | hum | resonant | glide | toneMatch | scalehum
},
```

---

## Automated Builds (GitHub Actions)

Every push to `main` triggers a debug APK build. Download it from the **Actions** tab in GitHub.

For release builds, add your keystore as GitHub Secrets and extend `.github/workflows/build.yml`.

---

## Medical Disclaimer

The MTD exercises in this app are supplemental tools intended to complement, not replace, professional speech-language pathology treatment. Users should always follow their clinician's guidance.

---

## License

MIT
