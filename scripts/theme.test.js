import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const themeCode = main.slice(main.indexOf('let theme;'), main.indexOf('// Shared portrait:'));

function setupTheme() {
  function element(dataset = {}) {
    const listeners = new Map();
    const attributes = new Map();
    const classes = new Set();
    return {
      dataset,
      addEventListener(type, listener) {
        const handlers = listeners.get(type) || [];
        handlers.push(listener);
        listeners.set(type, handlers);
      },
      emit(type, properties = {}) {
        const event = { type, target: this, pointerId: 1, isPrimary: true, button: 0, ...properties };
        for (const listener of listeners.get(type) || []) listener(event);
      },
      setAttribute: (name, value) => attributes.set(name, value),
      getAttribute: name => attributes.get(name),
      classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
      style: { removeProperty(name) { delete this[name]; } },
      focus() {},
    };
  }
  const buttons = ['light', 'system', 'dark'].map((theme, index) => ({
    ...element({ theme }),
    tagName: 'BUTTON',
    getBoundingClientRect: () => ({ left: index * 36 }),
  }));
  const toggle = element();
  const thumb = element();
  const window = element();
  const root = element();
  let capture = false;
  let stored = 'light';
  toggle.querySelectorAll = () => buttons;
  toggle.setPointerCapture = () => { capture = true; };
  toggle.hasPointerCapture = () => capture;
  toggle.releasePointerCapture = () => { capture = false; };
  runInNewContext(themeCode, {
    $: selector => selector === '.theme-switch' ? toggle : thumb,
    document: { documentElement: root, querySelectorAll: () => buttons },
    window,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    localStorage: { getItem: () => stored, setItem: (_, value) => { stored = value; } },
  });
  return { toggle, thumb, buttons, window, root, stored: () => stored };
}

test('touch swipes survive the starting button losing implicit pointer capture', () => {
  const { toggle, thumb, buttons, window, root, stored } = setupTheme();
  for (const [from, to, start, end] of [[0, 2, 18, 90], [2, 0, 90, 18], [0, 1, 18, 54]]) {
    toggle.emit('pointerdown', { target: buttons[from], clientX: start, pointerType: 'touch' });
    toggle.emit('pointermove', { target: buttons[from], clientX: start + (end > start ? 7 : -7) });
    toggle.emit('lostpointercapture', { target: buttons[from] });
    assert.equal(toggle.classList.contains('dragging'), true);
    toggle.emit('pointermove', { clientX: end });
    window.emit('pointerup', { clientX: end });
    assert.equal(toggle.dataset.position, buttons[to].dataset.theme);
    assert.equal(stored(), buttons[to].dataset.theme);
    assert.equal(buttons[to].getAttribute('aria-pressed'), 'true');
    assert.equal(root.dataset.theme, to === 2 ? 'dark' : 'light');
    assert.equal(thumb.style.transform, undefined);
    let suppressed = false;
    toggle.emit('click', { detail: 1, preventDefault() {}, stopImmediatePropagation() { suppressed = true; } });
    assert.equal(suppressed, true);
  }
});

test('losing the switch capture or cancelling a gesture restores the selected theme', () => {
  for (const type of ['lostpointercapture', 'pointercancel']) {
    const { toggle, thumb, window } = setupTheme();
    toggle.emit('pointerdown', { clientX: 18 });
    toggle.emit('pointermove', { clientX: 90 });
    (type === 'pointercancel' ? window : toggle).emit(type);
    assert.equal(toggle.dataset.position, 'light');
    assert.equal(toggle.classList.contains('dragging'), false);
    assert.equal(thumb.style.transform, undefined);
    window.emit('pointerup', { clientX: 90 });
    assert.equal(toggle.dataset.position, 'light');
  }
});

test('taps continue to select individual appearance buttons', () => {
  const { toggle, buttons, window } = setupTheme();
  toggle.emit('pointerdown', { target: buttons[2], clientX: 90 });
  window.emit('pointerup', { clientX: 90 });
  buttons[2].emit('click');
  assert.equal(toggle.dataset.position, 'dark');
});

test('a touch click with zero detail cannot undo a completed swipe', () => {
  const { toggle, buttons, window } = setupTheme();
  toggle.emit('pointerdown', { target: buttons[0], clientX: 18, pointerType: 'touch' });
  toggle.emit('pointermove', { clientX: 90 });
  window.emit('pointerup', { clientX: 90 });
  let suppressed = false;
  toggle.emit('click', {
    target: buttons[0], detail: 0, pointerType: 'touch',
    preventDefault() {}, stopImmediatePropagation() { suppressed = true; },
  });
  if (!suppressed) buttons[0].emit('click');
  assert.equal(toggle.dataset.position, 'dark');
  assert.equal(suppressed, true);
});

test('keyboard clicks still work when a swipe did not generate a click', () => {
  const { toggle, buttons, window } = setupTheme();
  toggle.emit('pointerdown', { clientX: 18 });
  toggle.emit('pointermove', { clientX: 90 });
  window.emit('pointerup', { clientX: 90 });
  let suppressed = false;
  toggle.emit('click', {
    target: buttons[1], detail: 0, pointerType: '',
    preventDefault() {}, stopImmediatePropagation() { suppressed = true; },
  });
  assert.equal(suppressed, false);
  buttons[1].emit('click');
  assert.equal(toggle.dataset.position, 'system');
});
