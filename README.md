# Miri sound machine

A static, responsive 3 × 3 soundboard for Miri, with four pages of recordings. The device has sculpted buttons, recessed LED pixel cats, a tiny LCD page display with rubber arrow buttons, light/dark/system appearance, keyboard shortcuts (1–9 for the displayed page and Escape to stop), a stop button, and volume control. The arrows cycle through pages in either direction; the display is not clickable. Changing pages stops any playing sounds.

## Run locally

```sh
npm ci
npm run dev
```

Production build: `npm run build`. The publishable website is **only `dist/`**. Source videos, analysis files, and the local Python environment are ignored by Git and excluded from that directory.

## Recordings

Pages one and two open with 17 new calls and short phrases from IMG_5533, IMG_5534, and IMG_5535, exported as unmodified originals from the three supplied Photos assets. There are 11 selections from the first video and three from each of the others. Calls remain together only when the silence between them is at most 0.5 seconds; the two-call phrase in IMG_5534 has a 0.06-second gap. Speech and purring are excluded. The second page has eight buttons; its unused ninth keyboard shortcut does nothing.

Page three contains nine excerpts from IMG_0916, IMG_2144, IMG_2489, and IMG_2823, exported as unmodified originals from Apple Photos. These run from 0.97 to 1.85 seconds, including a two-call phrase, with 25 ms fade-ins and 140–180 ms fade-outs. IMG_1298 was also reviewed; its purring was excluded from the meow selection. Each excerpt uses a separate, non-overlapping interval.

Page four contains the original nine Miri calls from IMG_4589, IMG_4968, IMG_5120, and IMG_5224. These have been recut from the original videos at their original speed, with extra audio before and after each call and gentle edge fades. Clips run from 0.76 to 1.20 seconds; the two closely spaced calls share a cut boundary to keep their excerpts separate. Filenames and IDs are preserved. Labels are playful names, not interpretations of her intent.

Source videos belong in `source-videos/`. Exact selected intervals are in `scripts/clips.json`; times are seconds into each original. Rebuild the recordings with:

```sh
python3 scripts/extract-audio.py
```

To rebuild only the latest recordings while preserving the existing pages: `python3 scripts/extract-audio.py --ids 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35`.

Requires ffmpeg on PATH. The script selects the AAC stereo track, converts to mono MP3, removes video metadata, filters low-frequency rumble and high-frequency noise, adjusts volume, and adds short fades to avoid clicks. It never changes the originals. It generates `public/audio/manifest.json`; only the chosen clips are published.

Selection was assisted by local YAMNet/CLAP classification, spectrogram inspection, and video frames. No source videos were uploaded for analysis. Cat vocalizations can resemble speech and other animals; excluded ambiguous clips were not used to fill the board artificially.

## Cloudflare Pages

This app needs no server, database, Functions, or paid API. Fonts and audio are served by the website itself.

The GitHub repository [atlesque/miri-soundboard](https://github.com/atlesque/miri-soundboard) is connected through Cloudflare Pages' native Git integration. Every push to `main` automatically builds and publishes production; other branches receive preview deployments.

- Project: `miri-soundboard`
- Production URL: https://miri.atlesque.dev
- Pages URL: https://miri-soundboard.pages.dev
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Node.js: 24 (selected by `.node-version`)

The `public/_headers` file is copied to `dist/` and applies security headers and mandatory cache revalidation to every response on Pages. On each visit or regular refresh, the browser checks the current deployment before reusing HTML, audio, or other cached files; unchanged files can still use an ETag/304 response. The recording manifest is bundled into the app's content-hashed JavaScript build, so each deployment's interface and recording list update together, even if a visitor previously cached an older `audio/manifest.json`. These settings ship with every deployment and require no manual cache purge or hard refresh.

The custom domain is associated with the Pages project. Cloudflare manages the CNAME `miri` → `miri-soundboard.pages.dev` in the `atlesque.dev` zone and provisions HTTPS automatically.

Deployment settings and history: https://dash.cloudflare.com/df08931372f873bc0c8edb7679dc0cf4/pages/view/miri-soundboard

Official references:
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/platform/limits/
