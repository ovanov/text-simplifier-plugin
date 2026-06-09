# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EinfachLesen** — a cross-browser Extension (Manifest V3, Chrome + Firefox) that simplifies German news articles for L2 learners. It injects simplification buttons into article paragraphs on supported news sites (srf.ch, 20min.ch), sends text to a research-study backend API, and displays simplified results inline.

## Build Commands

- `npm run build` — stage a Chrome build under `build/chrome/` (`scripts/build.mjs`)
- `npm run build:chrome` / `npm run build:firefox` — stage a per-browser build
- `npm run package:chrome` / `npm run package:firefox` — build + zip into `releases/`
- `npm run watch` — recompile on file change

The production backend URL is injected at build time via the `BACKEND_URL` env var
(e.g. `BACKEND_URL=https://pub.cl.uzh.ch/projects/einfach-lesen npm run package:chrome`).
It is never committed — `src/config.ts` always defaults to `http://localhost:8000`.
No test or lint tooling is configured.

## Architecture

Three TypeScript entry points compiled to `dist/`:

- **content.ts** → `dist/content.js` — Content script injected into news sites. Finds article `<p>` tags, adds "✨ Text vereinfachen" buttons, and renders simplified results inline. Network calls are delegated to the background worker via `chrome.runtime.sendMessage`.
- **background.ts** → `dist/background.js` — Background service worker (Firefox: `background.scripts`). Performs all `fetch` calls to the backend, attaching the stored Bearer `authToken`.
- **popup.ts** → `dist/popup.js` — Extension popup UI. Handles study enrollment (`/auth/study-enroll`), checks auth status (`/auth/me`), and stores `authToken` in `chrome.storage.local`.

Supporting files:
- **src/config.ts** — single source of `BACKEND_URL` (rewritten at build time)
- **popup.html** — popup markup (includes the Datenschutz/privacy-policy link)
- **style.css** — injected styles for buttons and result boxes
- **manifest.chrome.json** / **manifest.firefox.json** — per-browser configs; permissions: `storage` + host permissions for srf.ch, 20min.ch, and the build-time backend host

## Backend Integration

Expects a REST API (default `http://localhost:8000`, production injected via `BACKEND_URL`):
- `POST /auth/study-enroll` — enrolls a participant, returns an auth token
- `GET /auth/me` — verifies the stored token
- `POST /simplify` — accepts `{ text, source_url, simplified_text? }`, returns `{ simplified_text }`

Authentication is a Bearer JWT stored in `chrome.storage.local` as `authToken` and attached by `background.ts`.

## Key Types

- `SimplifyResponse` (`content.ts`) — backend response from `/simplify`
- `ApiRequest` / `ApiResult<T>` (`content.ts`, `background.ts`) — the `chrome.runtime` message contract between content script and background worker

## Conventions

- All user-facing text is in German
- Strict TypeScript (`strict: true`, target ES2020, module ESNext)
- No bundler — `scripts/build.mjs` stages a per-browser build (manifest placeholder substitution + `tsc`); `scripts/package.mjs` zips it
- DevDeps only: `@types/chrome`, `typescript`, and `pngjs` (icon generation in `scripts/make-icons.mjs`); no production dependencies
