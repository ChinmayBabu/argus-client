# ARGUS Client (Mission Dashboard)

Frontend dashboard for the ARGUS platform. It visualizes live satellite telemetry, AI threat detections, mission logs, simulation state, and blockchain verification feedback.

## Stack

1. React 19 + TypeScript
2. Vite
3. Zustand (state)
4. WebSocket streaming
5. Cesium + Recharts for map and charting

## Features

1. Authentication gate (demo mode enabled by default)
2. Real-time telemetry and threat event rendering
3. Mission map and signal graphs
4. Simulation attack mode controls
5. Blockchain verification panel

## Local Development

### Prerequisites

1. Node.js 20+
2. npm 10+
3. Backend running on `http://localhost:8000`

### Install and run

```bash
npm install
npm run dev
```

By default Vite serves on `http://localhost:5173`.

## Demo Login

The UI currently defaults to demo auth in [`src/components/auth/Auth.tsx`](src/components/auth/Auth.tsx).

1. Email: `operator@argus.space`
2. Password: `argus123`

## Runtime Integration Points

1. WebSocket stream: `ws://localhost:8000/stream` (configured in [`src/services/websocket.ts`](src/services/websocket.ts))
2. REST base URL: `http://localhost:8000/api/v1` (configured in [`src/services/api.ts`](src/services/api.ts))
3. Simulation controls call `/api/v1/simulation/control`
4. Simulation status polls `/api/v1/simulation/status`

## Key Scripts

1. `npm run dev` - start local dev server
2. `npm run build` - type-check + production build
3. `npm run preview` - preview production bundle
4. `npm run lint` - lint project

## Project Layout

1. `src/components` - dashboard UI modules (auth, telemetry, threats, controls, logs, blockchain, map, status)
2. `src/services` - API and WebSocket client logic
3. `src/stores` - Zustand dashboard store
4. `src/types` - shared frontend types

## Notes and Known Gaps

1. Backend URLs are currently hardcoded (no env-based switching yet).
2. Demo auth is enabled (`DEMO_MODE = true`) and bypasses backend login.
3. Some API helpers in `src/services/api.ts` are stubs for future expansion.
