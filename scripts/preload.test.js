import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreloader } from '../src/preload.js';

function setup(fetchImpl) {
  const ready = [];
  const fetched = [];
  const preloader = createPreloader({
    fetch: src => { fetched.push(src); return fetchImpl(src); },
    createObjectURL: blob => `blob:${blob}`,
    onReady: src => ready.push(src),
  });
  return { preloader, ready, fetched };
}
const ok = src => Promise.resolve({ ok: true, blob: async () => src });

test('sounds are not ready until fetched, then play from an in-memory copy', async () => {
  const { preloader, ready } = setup(ok);
  assert.equal(preloader.isReady('/a.mp3'), false);
  await preloader.loadAll(['/a.mp3', '/b.mp3']);
  assert.equal(preloader.isReady('/a.mp3'), true);
  assert.equal(preloader.urlFor('/a.mp3'), 'blob:/a.mp3');
  assert.deepEqual(ready, ['/a.mp3', '/b.mp3']);
});

test('each source is fetched only once, even across overlapping page loads', async () => {
  const { preloader, fetched } = setup(ok);
  await Promise.all([preloader.loadAll(['/a.mp3']), preloader.loadAll(['/a.mp3', '/b.mp3'])]);
  await preloader.load('/a.mp3');
  assert.deepEqual(fetched, ['/a.mp3', '/b.mp3']);
});

test('a failed download unlocks the pad and falls back to the original file', async () => {
  for (const fetchImpl of [() => Promise.reject(new Error('offline')), () => Promise.resolve({ ok: false, status: 404 })]) {
    const { preloader, ready } = setup(fetchImpl);
    await preloader.load('/a.mp3');
    assert.equal(preloader.isReady('/a.mp3'), true);
    assert.equal(preloader.urlFor('/a.mp3'), '/a.mp3');
    assert.deepEqual(ready, ['/a.mp3']);
  }
});

test('pads without a recording never wait on loading', () => {
  const { preloader, fetched } = setup(ok);
  assert.equal(preloader.isReady(null), true);
  preloader.load(null);
  assert.deepEqual(fetched, []);
});
