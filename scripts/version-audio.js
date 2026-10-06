import { createHash } from 'node:crypto';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run before Vite reads the bundled manifest or copies public assets.
export function versionAudio(directory) {
  const manifestPath = join(directory, 'manifest.json');
  const recordings = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const updates = recordings.map(recording => {
    if (!/^\/audio\/miri-\d{2}(?:-[a-f0-9]{12})?\.mp3$/.test(recording.src)) {
      throw new Error(`Invalid recording source: ${recording.src}`);
    }
    const source = join(directory, recording.src.slice('/audio/'.length));
    const hash = createHash('sha256').update(readFileSync(source)).digest('hex').slice(0, 12);
    const filename = `miri-${String(recording.id).padStart(2, '0')}-${hash}.mp3`;
    return { recording, source, filename };
  });
  let changed = false;
  for (const { recording, source, filename } of updates) {
    const src = `/audio/${filename}`;
    if (recording.src === src) continue;
    renameSync(source, join(directory, filename));
    recording.src = src;
    changed = true;
  }
  if (changed) writeFileSync(manifestPath, JSON.stringify(recordings, null, 2) + '\n');
  return recordings;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  versionAudio(fileURLToPath(new URL('../public/audio', import.meta.url)));
}
