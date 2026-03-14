# LifeOS — Personal Life Dashboard

Track sleep, gym, money, habits, and mood in one dark command-center interface. See your life as data and watch how it changes your behavior.

![LifeOS Dashboard](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react) ![Recharts](https://img.shields.io/badge/Recharts-2-22B5BF?style=flat-square) ![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?style=flat-square)

---

## Features

- **🌙 Sleep** — Log hours + quality, bar chart, streak counter
- **💪 Gym** — Workout type + duration, 7-day dot grid, streak
- **💰 Money** — Income/expense tracker, net balance, recent entries
- **✅ Habits** — Custom habit list, one-tap check-off, 7-day trail + fire streaks
- **🧠 Mood** — Emoji-based daily log, weekly line chart
- **Life Score** — Composite 0–100 score across all 5 domains
- **PWA** — Install on iPhone/Android home screen, works offline
- **Local storage** — All data stays on your device, never leaves

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run dev

# 3. Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173)

---

## Install on your phone (PWA)

**iPhone:** Open in Safari → Share → "Add to Home Screen"

**Android:** Open in Chrome → three dots menu → "Add to Home screen"

---

## Deploy (free)

**Vercel (recommended):**
```bash
npm i -g vercel
vercel
```

**Netlify:**
```bash
npm run build
# drag the `dist/` folder to netlify.com/drop
```

---

## Tech stack

- [React 18](https://react.dev)
- [Vite](https://vitejs.dev)
- [Recharts](https://recharts.org)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app)
- `localStorage` for persistence

