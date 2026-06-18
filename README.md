<div align="center">

<img src="./public/logo.png" alt="Honrly" width="140" height="140" />

# Honrly

### local-first interview integrity, without the lock-in

[![License: AGPL v3](https://img.shields.io/badge/license-AGPL%20v3-blue.svg)](./LICENSE)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-24C8DB.svg)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-stable-DEA584.svg)](https://www.rust-lang.org)
[![Open Source](https://img.shields.io/badge/open%20source-%E2%9D%A4-7C3AED.svg)](#license)

**[Getting Started](#getting-started)** · **[How Detection Works](#how-detection-works)** · **[Connect Video](#connecting-a-video-service)**

</div>

---

A **local-first, self-hostable interview-integrity tool** built for a simple reality: "undetectable" tools are not magic. Apps like **Cluely**, **LockedIN**, **Interview Coder**, and **Parkaeet** market themselves as invisible, but that is marketing fiction, not a reality, THEY ARE SUPER EASY TO DETECT. FEEL FREE TO FIND IT OUT for yourself! : )
 
Honrly runs on your own machine and does two things:

1. **Self-Monitor** — scans your running processes in real time and flags known AI cheating tools such as **Cluely** and **Interview Coder**, plus any custom apps you add to a watchlist. Everything happens locally; nothing is uploaded.
2. **Video Call Preview** — shows exactly how a monitored video call will look, then lets you connect a real room from a hosted provider (Daily.co) **or your own self-hosted service** (e.g. Jitsi via iframe).

There are **no accounts, no login, and no company database**. This is a clean, hackable starting point you can build on.

## Purpose

Interviews should reward preparation, skill, and honest effort. People put real time into studying, practicing, and showing up ready; they deserve a fair shot without being undercut by tools that try to turn cheating into a product.

## Tech stack

- **Tauri 2** (Rust) desktop shell
- **React 18 + Vite + TypeScript** frontend
- **Tailwind CSS** + a small set of Radix UI primitives
- **@daily-co/daily-js** for the optional hosted video provider

## How detection works

The Rust backend exposes two local commands (`src-tauri/src/main.rs`):

- `list_processes` — enumerates running processes (`ps` on macOS/Linux, `tasklist` on Windows).
- `get_input_activity` — reports recent keyboard/mouse activity (macOS implemented).

The frontend (`src/screens/LocalMonitor.tsx`) polls `list_processes` every few seconds and applies simple, fully local heuristics to flag suspicious apps. Add your own rules in `isSuspiciousProcess`, or add app names at runtime via the **Custom Apps** panel.

## Connecting a video service

Open **Video Call Preview** and either:

- **Daily.co** — paste a room URL like `https://your-team.daily.co/room-name`.
- **Self-hosted** — paste any iframe-embeddable meeting URL (e.g. a Jitsi room on your own domain).

Without a URL you still get a full layout preview with mock participants and call controls, so you can see the experience before wiring up a backend.

> Tip: run the **Self-Monitor** in one window while a call is live to demonstrate live cheating-tool detection.

## Getting started

```bash
# install JS deps
npm install

# run the web frontend only (browser, no native process scanning)
npm run dev

# run the full desktop app (requires the Rust toolchain)
npm run tauri:dev

# build a production desktop bundle
npm run tauri:build
```

Process scanning relies on the Tauri (Rust) backend, so use `npm run tauri:dev` to exercise the Self-Monitor. In a plain browser (`npm run dev`) the monitor will show a permission/availability error because the native `list_processes` command isn't present.

### Prerequisites

- Node.js 18+
- Rust toolchain (`rustup`) and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS

## Project layout

```
src/                      # React + Vite frontend
  App.tsx                 # routes: / (Home), /monitor, /video
  screens/Home.tsx        # landing page
  screens/LocalMonitor.tsx# process scan + Cluely detection
  screens/VideoCallScreen.tsx # call preview + connect Daily/self-hosted
  components/ui/          # small Tailwind/Radix UI primitives + VideoCall
src-tauri/                # Tauri (Rust) backend
  src/main.rs             # list_processes, get_input_activity
```

## License

GNU Affero General Public License v3.0 (AGPL-3.0). See [`LICENSE`](./LICENSE).

