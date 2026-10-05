# Miri sound machine

A static, responsive 3 × 3 soundboard for Miri. The device has sculpted buttons, recessed LED pixel cats, light/dark/system appearance, keyboard shortcuts (1–9 and Escape), a stop button, and volume control.

## Run locally

```sh
npm ci
npm run dev
```

Production build: `npm run build`. The publishable website is **only `dist/`**. Source videos, analysis files, and the local Python environment are ignored by Git and excluded from that directory.

## Recordings

Nine distinct Miri calls are connected to all nine pads. They come from IMG_4589, IMG_4968, IMG_5120, and IMG_5224; the final source was exported directly from Apple Photos. Labels are playful names, not interpretations of her intent.

Source videos belong in `source-videos/`. Exact selected intervals are in `scripts/clips.json`; times are seconds into each original. Rebuild the recordings with:

```sh
python3 scripts/extract-audio.py
```

Requires ffmpeg on PATH. The script selects the AAC stereo track, converts to mono MP3, removes video metadata, filters low-frequency rumble and high-frequency noise, adjusts volume, and adds short fades to avoid clicks. It never changes the originals. It generates `public/audio/manifest.json`; only the chosen clips are published.

Selection was assisted by local YAMNet/CLAP classification, spectrogram inspection, and video frames. No source videos were uploaded for analysis. Cat vocalizations can resemble speech and other animals; excluded ambiguous clips were not used to fill the board artificially.

## Cloudflare Pages

This app needs no server, database, Functions, or paid API. Fonts and audio are served by the website itself.

Connect this repository to a Cloudflare Pages project:

- Framework preset: Vite (or None)
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Node.js: 24

The `public/_headers` file is copied to `dist/` and applies security and audio caching headers on Pages.

Intended custom domain: **miri.atlesque.dev**. After deployment, add it in the Pages project's **Custom domains** tab first, then create the required CNAME pointing `miri` to the actual project’s `*.pages.dev` hostname if Cloudflare does not create it automatically. Adding only a DNS record without associating the domain with Pages is insufficient.

Hosting and DNS have not been changed yet.

Official references:
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/platform/limits/
