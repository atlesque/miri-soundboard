import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

function setupPlayback() {
  const elements = new Map();
  function element(selector) {
    if (!elements.has(selector)) {
      const attributes = new Map();
      const listeners = new Map();
      const classes = new Set();
      elements.set(selector, {
        disabled: false,
        setAttribute: (name, value) => attributes.set(name, value),
        getAttribute: name => attributes.get(name),
        addEventListener: (type, listener) => listeners.set(type, listener),
        emit: (type, event) => listeners.get(type)?.(event),
        classList: {
          add: name => classes.add(name),
          remove: name => classes.delete(name),
          toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
        },
      });
    }
    return elements.get(selector);
  }
  const recordings = [];
  class Audio {
    constructor() {
      this.listeners = new Map();
      this.currentTime = 0;
      recordings.push(this);
    }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    play() { return new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; }); }
    pause() { this.paused = true; }
    end() { this.listeners.get('ended')(); }
  }
  const sounds = [{ id: 1, name: 'Meow', src: '/one.mp3' }, { id: 2, name: 'Purr', src: '/two.mp3' }];
  const context = {
    $: element,
    document: { querySelector: element, addEventListener: (type, listener) => element('document').addEventListener(type, listener) },
    active: new Map(), volume: .75, page: 0,
    allSounds: sounds, soundPages: [sounds], status: {}, Audio,
  };
  runInNewContext(main.slice(main.indexOf('function clear(id)')), context);
  return { ...context, recordings, element };
}

test('a playing sound cannot restart through clicks or keyboard shortcuts, including while loading', async () => {
  const app = setupPlayback();
  const button = app.element('[data-id="1"]');
  const pending = app.play(1);
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute('aria-disabled'), 'true');
  app.element('.pads').emit('click', { target: { closest: () => ({ dataset: { id: '1' } }) } });
  app.element('document').emit('keydown', { key: '1', target: { tagName: 'BODY' }, preventDefault() {} });
  assert.equal(app.recordings.length, 1);
  app.recordings[0].resolve();
  await pending;
  await app.play(1);
  assert.equal(app.recordings.length, 1);
  const other = app.play(2);
  assert.equal(app.recordings.length, 2);
  app.recordings[1].resolve();
  await other;
});

test('finishing or pressing stop re-enables the button and allows replay', async () => {
  for (const finish of ['ended', 'stop']) {
    const app = setupPlayback();
    const pending = app.play(1);
    app.recordings[0].resolve();
    await pending;
    if (finish === 'ended') app.recordings[0].end();
    else app.element('#stop').emit('click');
    const button = app.element('[data-id="1"]');
    assert.equal(button.disabled, false);
    assert.equal(button.getAttribute('aria-disabled'), 'false');
    assert.equal(button.getAttribute('aria-pressed'), 'false');
    const replay = app.play(1);
    assert.equal(app.recordings.length, 2);
    app.recordings[1].resolve();
    await replay;
  }
});

test('failed playback unlocks the button, and a stopped recording cannot unlock its replacement', async () => {
  const app = setupPlayback();
  const failed = app.play(1);
  app.recordings[0].reject(new Error('Playback failed'));
  await failed;
  assert.equal(app.element('[data-id="1"]').disabled, false);
  const stopped = app.play(1);
  app.element('#stop').emit('click');
  const replay = app.play(1);
  app.recordings[1].reject(new Error('Stopped'));
  await stopped;
  app.recordings[1].end();
  assert.equal(app.element('[data-id="1"]').disabled, true);
  assert.equal(app.active.get(1), app.recordings[2]);
  app.recordings[2].resolve();
  await replay;
});
