# photobooth

Interactive browser photo booth.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy On VPS

```bash
docker compose up -d --build
```

## Features

- ✅ Curated poster themes with a live selector
- ✅ 2×2 capture grid during shooting, then a hero-style final poster
- ✅ Clean shareable poster
- ✅ Direct download via data URL (works offline)
- ✅ Countdown overlay + flash effect
- ✅ Responsive mobile UI
- ✅ Browser smoke test for poster rendering

### Smoke Test

```bash
npm run test:smoke
```

This checks the theme selector and poster render.
