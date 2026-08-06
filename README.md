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

## Features

- ✅ Curated poster themes with a live selector
- ✅ 2×2 capture grid during shooting, then a hero-style final poster
- ✅ Clean shareable poster
- ✅ Direct download via data URL (works offline)
- ✅ Countdown overlay + flash effect
- ✅ Responsive mobile UI
- ✅ Browser smoke test for poster rendering

## Upload (Production Deployment)

Photos can be uploaded to **Vercel Blob Storage** through the API routes.

### Setup Production Deployment

1. **Get Vercel Blob Token:**
   - Log in to https://vercel.com/account/tokens
   - Create token with **Blob read/write** scope
   - Copy the token value

2. **Add to Project:**
   - Open your Vercel project dashboard → Settings → Environment Variables
   - Add variable: `BLOB_READ_WRITE_TOKEN` = `<your-token>`
   - Set scope to **Production** (or all environments)
   - Save & redeploy

3. **Deploy:**
   ```bash
   git push origin main
   ```

### Smoke Test

```bash
npm run test:smoke
```

This checks the theme selector and poster render.

### No Token / Offline Mode

If token is missing:
- ✅ Users can still **download photos directly**
- App remains fully functional
