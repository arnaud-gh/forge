# Forge

Personal fitness PWA for iPhone: guided workout player with progressive-overload
logging, and Wim Hof style breathing. Offline first, single user in v1.

- Live: https://forge-cee4c.web.app
- Requirements: `docs/PRD.md` · Visual system: `docs/DESIGN.md` · Progress: `docs/PROGRESS.md`
- Working agreements for coding agents: `CLAUDE.md`

## Stack

React 18 + TypeScript (strict) + Vite, Tailwind (DESIGN.md tokens), Framer Motion,
Zustand, Firebase (Google Auth, Firestore offline persistence, Hosting),
vite-plugin-pwa, react-i18next, Recharts, Vitest.

## Develop

```bash
npm install
cp .env.example .env.local   # fill in the Firebase web config
npm run dev                  # http://localhost:5173  (design gallery: /dev/components)
npm test                     # Vitest
npm run lint                 # ESLint + Prettier
npm run build                # tsc + vite build (+ service worker)
npm run build:exercises      # regenerate the exercise library + images from free-exercise-db
npm run deploy               # build + firebase deploy --only hosting
```

Firestore security rules live in `firestore.rules` (`firebase deploy --only firestore:rules`).

## Credits

Type: Anton and Archivo (Google Fonts). Exercise data and images:
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain).
