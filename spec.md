# Videro

## Current State
A full-stack video editing platform on the Internet Computer. Frontend is React + TypeScript + Vite. No PWA support currently exists -- no manifest, no service worker, no install prompt.

## Requested Changes (Diff)

### Add
- `manifest.webmanifest` in `public/` with app name, icons, theme color, display mode (standalone), orientation, start URL
- App icons at multiple sizes (192x192, 512x512, maskable) in `public/assets/`
- Service worker (`sw.js`) for offline caching of the app shell
- PWA meta tags in `index.html` (theme-color, apple-touch-icon, manifest link)
- `vite-plugin-pwa` or manual PWA registration in `main.tsx` to register the service worker
- "Add to Home Screen" install banner component that appears for eligible users (beforeinstallprompt event)

### Modify
- `index.html` -- add `<link rel="manifest">`, `<meta name="theme-color">`, `<link rel="apple-touch-icon">`, update `<title>` to "Videro"
- `vite.config.js` -- integrate vite-plugin-pwa if available, else keep manual SW
- `main.tsx` -- register service worker on load

### Remove
- Nothing removed

## Implementation Plan
1. Generate Videro app icon (512x512 and 192x192)
2. Write `public/manifest.webmanifest` with correct PWA metadata
3. Write `public/sw.js` service worker with cache-first strategy for app shell
4. Update `index.html` with PWA meta tags
5. Add install prompt component to `App.tsx` or a standalone `PWAInstallBanner` component
6. Register service worker in `main.tsx`
7. Validate build
