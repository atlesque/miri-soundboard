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
  const contexts = [];
  class AudioContext {
    constructor() {
      this.destination = {};
      this.sources = [];
      contexts.push(this);
    }
    createGain() {
      this.output = { gain: { value: 1 }, connect: destination => { this.output.destination = destination; } };
      return this.output;
    }
    createMediaElementSource(audio) {
      const source = { audio, connect: output => { source.output = output; }, disconnect: () => { source.disconnected = true; } };
      this.sources.push(source);
      return source;
    }
    resume() { this.resumed = true; return Promise.resolve(); }
  }
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
    allSounds: sounds, soundPages: [sounds], status: {}, Audio, window: { AudioContext },
  };
  runInNewContext(main.slice(main.indexOf('let audioContext;')), context);
  return { ...context, recordings, contexts, element };
}

test('volume controls the shared output for current and future sounds even when media volume is ignored', async () => {
  const app = setupPlayback();
  const setVolume = value => app.element('#volume').emit('input', { target: { value: String(value) } });
  assert.equal(app.contexts.length, 0);
  setVolume(25);
  const first = app.play(1);
  const context = app.contexts[0];
  assert.equal(context.resumed, true);
  assert.equal(context.output.gain.value, .25);
  assert.equal(context.output.destination, context.destination);
  app.recordings[0].resolve();
  await first;
  const second = app.play(2);
  app.recordings[1].resolve();
  await second;
  assert.equal(app.contexts.length, 1);
  for (const source of context.sources) assert.equal(source.output, context.output);
  for (const value of [0, 50, 100]) {
    setVolume(value);
    assert.equal(context.output.gain.value, value / 100);
    assert.equal(app.element('output').value, String(value));
  }
  app.element('#stop').emit('click');
  assert.ok(context.sources.every(source => source.disconnected));
  const replay = app.play(1);
  assert.equal(context.output.gain.value, 1);
  assert.equal(context.sources[2].output, context.output);
  app.recordings[2].resolve();
  await replay;
});

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
