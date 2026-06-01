StarClaim — React Prototype (MVP / UX validation)

Purpose
- Fast MVP to validate UX and motion using React + Web (R3F) prototype.
- This prototype is *not* final mobile app; it's a rapid way to test flows, timing and Nebula transitions.

Approach
- Create a small web app using Vite + React + @react-three/fiber for 3D canvas.
- Use Lottie for NebulaTransition (or simple particle sprite system) during prototyping.
- Host the prototype on Vercel or Netlify and test on mobile browsers.

Quick setup (local)
```bash
# from repo root
cd mobile/react_native_prototype
npm create vite@latest web-proto --template react
cd web-proto
npm install @react-three/fiber three lottie-react
npm run dev
```

Prototype components
- `ThreeScene` — simple rotating galaxy background (low-poly sphere + stars)
- `FloatingWheel` — bottom action wheel (buttons) that trigger transitions
- `NebulaTransition` — Lottie-based full-screen animation triggered on navigation
- `LoadingScene` — simple progress bar with console text lines

Integration note (to React Native)
- If you later want to embed the prototype inside a React Native shell, use a `WebView` to point to the hosted prototype while native UI wraps it.
- For in-app native 3D later, replace the web prototype with Unity view or native GL render.

Deliverables
- Hosted prototype URL
- Short video/gif captures of transitions and timings
- JSON Lottie files for Nebula animation (or spritesheet assets)
