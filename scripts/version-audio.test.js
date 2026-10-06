import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { versionAudio } from './version-audio.js';

test('build gives changed audio a new URL and keeps unchanged audio URLs stable', t => {
  const directory = mkdtempSync(join(tmpdir(), 'miri-version-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const manifest = join(directory, 'manifest.json');
  writeFileSync(manifest, JSON.stringify([{ id: 1, src: '/audio/miri-01.mp3', duration: 1 }]));
  writeFileSync(join(directory, 'miri-01.mp3'), 'first recording');
  const first = versionAudio(directory)[0];
  assert.match(first.src, /^\/audio\/miri-01-[a-f0-9]{12}\.mp3$/);
  assert.equal(versionAudio(directory)[0].src, first.src);
  const oldFile = join(directory, first.src.slice(7));
  writeFileSync(oldFile, 'replacement recording');
  const updated = versionAudio(directory)[0];
  assert.notEqual(updated.src, first.src);
  assert.equal(updated.duration, 1);
  assert.equal(readFileSync(join(directory, updated.src.slice(7)), 'utf8'), 'replacement recording');
  assert.equal(existsSync(oldFile), false);
});

test('missing audio prevents a build from publishing a broken manifest', t => {
  const directory = mkdtempSync(join(tmpdir(), 'miri-missing-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const manifest = join(directory, 'manifest.json');
  const original = JSON.stringify([{ id: 1, src: '/audio/miri-01.mp3', duration: 1 }]);
  writeFileSync(manifest, original);
  assert.throws(() => versionAudio(directory), /ENOENT/);
  assert.equal(readFileSync(manifest, 'utf8'), original);
});
