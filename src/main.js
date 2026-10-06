import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './style.css';
import { allSounds, soundPages, pageLabels } from './sounds.js';
const $ = (selector) => document.querySelector(selector);
const status = $('#status');
const active = new Map();
let volume = .75;
let page = 0;
let theme;
try { theme = localStorage.getItem('miri-theme') || 'system'; } catch { theme = 'system'; }
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const themeSwitch = $('.theme-switch');
const themeThumb = $('.switch-thumb');
const themeButtons = [...themeSwitch.querySelectorAll('button[data-theme]')];
let themeDrag = null;
let suppressThemeClick = false;
function applyTheme() {
  $('.theme-switch').dataset.position = theme;
  document.documentElement.dataset.theme = theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
  document.querySelectorAll('[data-theme]').forEach(button => {
    if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.theme === theme));
  });
}
function selectTheme(value) {
  theme = value;
  try { localStorage.setItem('miri-theme', theme); } catch {}
  applyTheme();
}
themeButtons.forEach(button => button.addEventListener('click', () => selectTheme(button.dataset.theme)));
// A drag also generates a click; don't let it select the button where it began.
themeSwitch.addEventListener('click', event => {
  if (suppressThemeClick && (event.detail > 0 || event.pointerType)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressThemeClick = false;
  }
}, true);
themeSwitch.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || themeDrag) return;
  suppressThemeClick = false;
  themeDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startPosition: themeButtons.findIndex(button => button.dataset.theme === theme),
    step: themeButtons[1].getBoundingClientRect().left - themeButtons[0].getBoundingClientRect().left,
    moved: false,
  };
});
function moveThemeThumb(event) {
  if (!themeDrag || event.pointerId !== themeDrag.pointerId) return;
  const delta = event.clientX - themeDrag.startX;
  if (!themeDrag.moved && Math.abs(delta) < 4) return;
  if (!themeDrag.moved) {
    themeDrag.moved = true;
    themeSwitch.setPointerCapture(event.pointerId);
    themeSwitch.classList.add('dragging');
  }
  themeDrag.position = Math.max(0, Math.min(2, themeDrag.startPosition + delta / themeDrag.step));
  themeThumb.style.transform = `translateX(${themeDrag.position * 100}%)`;
}
themeSwitch.addEventListener('pointermove', moveThemeThumb);
function finishThemeDrag(event) {
  if (!themeDrag || event.pointerId !== themeDrag.pointerId) return;
  const drag = themeDrag;
  const cancelled = event.type !== 'pointerup';
  if (!cancelled) moveThemeThumb(event);
  themeDrag = null;
  themeSwitch.classList.remove('dragging');
  themeThumb.style.removeProperty('transform');
  if (drag.moved) {
    suppressThemeClick = true;
    if (!cancelled) {
      const button = themeButtons[Math.round(drag.position)];
      selectTheme(button.dataset.theme);
      button.focus({ preventScroll: true });
    }
  }
  if (themeSwitch.hasPointerCapture(event.pointerId)) themeSwitch.releasePointerCapture(event.pointerId);
}
window.addEventListener('pointerup', finishThemeDrag);
window.addEventListener('pointercancel', finishThemeDrag);
themeSwitch.addEventListener('lostpointercapture', event => {
  // Touch starts with implicit capture on the button. Its capture-loss event
  // bubbles here when the drag transfers capture to the switch.
  if (event.target === themeSwitch) finishThemeDrag(event);
});
systemTheme.addEventListener('change', applyTheme);
applyTheme();
// Shared portrait: Miri's warm brown tabby coat, tall ears, round eyes and cream muzzle.
function pixelCat(expression) {
  const pixels = new Map();
  const rect = (x, y, w, h, color) => {
    for (let a=x; a<x+w; a++) for (let b=y; b<y+h; b++) pixels.set(`${a},${b}`, color);
  };
  const palette = {
    outline:'#34302b', fur:'#948574', gold:'#afa18a', shadow:'#71665b',
    stripe:'#45403a', ear:'#aa9188', cream:'#ddd6c8', iris:'#a5a17c',
    eye:'#111512', shine:'#fff9e8', nose:'#806c65', whisker:'#e6e1d6',
    blush:'#c79592', curtain:'#a68daa', curtainShadow:'#75637f'
  };
  // Upright ears and softly rounded cheeks.
  rect(5,2,3,12,'outline'); rect(8,5,3,9,'outline');
  rect(24,3,3,11,'outline'); rect(21,6,3,8,'outline');
  rect(6,3,1,7,'gold'); rect(7,5,2,7,'fur'); rect(7,6,1,5,'ear');
  rect(25,4,1,7,'gold'); rect(23,6,2,6,'fur'); rect(24,7,1,4,'ear');
  // An oval silhouette gives Miri fuller cheeks and a curved chin.
  for (let y=9; y<30; y++) for (let x=3; x<29; x++) {
    const outer=((x-15.5)/12.5)**2+((y-19)/10.5)**2;
    const inner=((x-15.5)/11.5)**2+((y-19)/9.5)**2;
    if (outer<=1) rect(x,y,1,1,inner<=1?'fur':'outline');
  }
  rect(11,26,10,2,'cream'); rect(13,28,6,1,'cream');
  rect(9,11,5,7,'gold'); rect(19,11,4,7,'gold'); rect(7,19,5,5,'gold');
  rect(21,19,4,5,'shadow'); rect(14,12,4,10,'gold');
  // M-shaped forehead stripes and the dark markings beside her eyes.
  rect(10,10,2,3,'stripe'); rect(12,12,2,2,'stripe'); rect(14,10,2,3,'stripe');
  rect(17,10,2,3,'stripe'); rect(19,12,2,2,'stripe'); rect(21,10,2,3,'stripe');
  rect(15,14,2,3,'shadow'); rect(6,16,2,1,'stripe'); rect(24,16,2,1,'stripe');
  rect(6,20,3,1,'stripe'); rect(23,20,3,1,'stripe');
  rect(7,23,3,1,'stripe'); rect(22,23,3,1,'stripe');
  // Round, oversized eyes keep the same tabby face across all expressions.
  for (const x of [8,19]) {
    rect(x,15,6,6,'outline'); rect(x-1,16,8,4,'outline');
    rect(x,16,6,4,'iris'); rect(x+1,16,4,4,'eye');
    rect(x+1,16,2,2,'shine'); rect(x+4,19,1,1,'shine');
  }
  if ([3,7,9].includes(expression)) {
    for (const x of [7,18]) {
      rect(x,15,8,6,'fur');
      if (expression===9) rect(x+1,18,6,1,'outline');
      else {rect(x+1,18,2,1,'outline');rect(x+3,17,2,1,'outline');rect(x+5,18,2,1,'outline');}
    }
  }
  if (expression===4) {rect(19,15,6,6,'fur');rect(19,18,6,1,'outline');}
  if (expression===6) {rect(7,15,8,2,'fur');rect(18,15,8,2,'fur');rect(8,16,6,1,'outline');rect(19,16,6,1,'outline');}
  if (expression===8) {rect(8,14,4,1,'outline');rect(22,14,3,1,'outline');}
  rect(11,22,10,4,'cream'); rect(10,23,12,2,'cream');
  if ([2,5].includes(expression)) {rect(14,24,4,3,'outline');rect(15,25,2,1,'ear');}
  rect(14,21,4,2,'outline'); rect(15,21,2,1,'nose');
  rect(15,23,2,1,'outline'); rect(14,24,1,1,'shadow'); rect(17,24,1,1,'shadow');
  if (expression===2) {rect(9,13,3,1,'outline');rect(21,13,3,1,'outline');}
  if (expression===7) {rect(8,22,2,1,'ear');rect(22,22,2,1,'ear');rect(15,25,2,1,'ear');}
  rect(3,22,7,1,'whisker'); rect(2,24,7,1,'whisker');
  rect(22,22,7,1,'whisker'); rect(23,24,7,1,'whisker');
  if (expression >= 10) {
    // Fresh portraits keep Miri's coat, with a separate expression for each new call.
    const eyes = (style, gaze = 0) => {
      for (const x of [7,18]) {
        rect(x,14,8,7,'fur');
        if (style === 'happy') {
          rect(x+1,18,2,1,'outline'); rect(x+3,17,2,1,'outline'); rect(x+5,18,2,1,'outline');
        } else if (style === 'sleepy') {
          rect(x+1,17,6,1,'outline'); rect(x+2,18,4,1,'shadow');
        } else {
          rect(x+1,15,6,6,'outline'); rect(x,16,8,4,'outline');
          rect(x+1,16,6,4,'iris'); rect(x+3+gaze,16,2,4,'eye');
          rect(x+2+gaze,16,1,1,'shine');
        }
      }
    };
    const mouth = (width, height) => {
      rect(11,23,10,5,'cream');
      rect(16-Math.ceil(width/2),24,width,height,'outline');
      if (height>2) rect(15,24+height-2,2,1,'blush');
    };
    const paw = x => {
      rect(x,26,6,5,'outline'); rect(x+1,26,4,4,'gold');
      rect(x+2,28,1,2,'shadow'); rect(x+4,28,1,2,'shadow');
    };
    switch (expression) {
      case 10: // Double take: wide pupils, raised brows and a surprised O.
        eyes('round');
        rect(9,12,4,1,'outline'); rect(20,12,4,1,'outline');
        for (const x of [10,21]) {rect(x,16,3,4,'eye');rect(x,16,1,2,'shine');}
        mouth(4,4);
        break;
      case 11: // Stairway chat: looking up, with a paw raised to say hello.
        eyes('round',1); mouth(3,2);
        rect(1,17,6,10,'outline'); rect(2,18,4,8,'gold');
        rect(2,18,4,2,'cream'); rect(3,19,1,2,'shadow');
        break;
      case 12: // Little question: mismatched brows and a tiny question mark.
        eyes('round',1); mouth(2,2);
        rect(8,13,5,1,'outline'); rect(21,12,4,1,'outline');
        rect(28,2,3,1,'gold'); rect(30,3,1,2,'gold');
        rect(29,5,2,1,'gold'); rect(29,6,1,1,'gold'); rect(29,8,1,1,'gold');
        break;
      case 13: // Shelf supervisor: a stern squint and neatly folded paws.
        eyes('round');
        for (const x of [8,19]) {rect(x,15,6,2,'fur');rect(x,16,6,1,'outline');}
        mouth(6,1); paw(5); paw(21);
        break;
      case 14: // Long story: eyes squeezed shut for a full-throated meow.
        eyes('happy'); mouth(6,5);
        rect(8,22,2,1,'blush'); rect(22,22,2,1,'blush');
        break;
      case 15: // Open the door: expectant eyes, peering over a little ledge.
        eyes('round'); mouth(3,2);
        rect(1,28,30,4,'curtainShadow'); rect(1,28,30,1,'curtain');
        paw(7); paw(19);
        break;
      case 16: // Another word: a wink and a cheeky little tongue.
        eyes('round',-1);
        rect(18,14,8,7,'fur'); rect(19,18,2,1,'outline');
        rect(21,17,2,1,'outline'); rect(23,18,2,1,'outline');
        mouth(4,2); rect(15,25,2,3,'blush'); rect(16,26,1,2,'nose');
        break;
      case 17: // Doorway duet: the same chatting face repeated as a pair below.
        eyes('happy'); mouth(4,3);
        break;
      case 18: // Curtain call: a sleepy tabby peeking from behind a curtain.
        eyes('sleepy'); mouth(2,1);
        rect(23,1,8,30,'curtain'); rect(25,1,2,30,'curtainShadow');
        rect(29,1,2,30,'curtainShadow'); rect(23,29,8,2,'outline');
        paw(21);
        break;
    }
  }
  if (expression === 17) {
    const face = [...pixels].map(([xy,c])=>{const [x,y]=xy.split(',');return `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[c]}"/>`;}).join('');
    return `<svg viewBox="0 0 32 32" class="pixel-cat" aria-hidden="true" shape-rendering="crispEdges"><g transform="translate(0 6) scale(.6)">${face}</g><g transform="translate(13 8) scale(.6)">${face}</g></svg>`;
  }
  return `<svg viewBox="0 0 32 32" class="pixel-cat" aria-hidden="true" shape-rendering="crispEdges">${[...pixels].map(([xy,c])=>{const [x,y]=xy.split(',');return `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[c]}"/>`;}).join('')}</svg>`;
}
function renderPads() {
  $('.pads').innerHTML = soundPages[page].map((s, i) => `<button class="pad" style="--pad-color:${s.color};--cat-light:${s.lightColor}" data-id="${s.id}" aria-label="${i + 1}. ${s.name}" aria-disabled="${!s.src}" aria-pressed="false"><span class="pad-face"><span class="led-screen">${pixelCat(s.portrait ?? s.id)}</span><span class="pad-caption"><span>${s.name}</span><kbd>${i + 1}</kbd></span></span></button>`).join('');
  $('.pads').setAttribute('aria-label', `Page ${page + 1} sound buttons`);
  $('.page-lcd').textContent = `0${page + 1} / 0${soundPages.length}`;
  $('#page-label').textContent = pageLabels[page];
  $('.page-lcd').setAttribute('aria-label', `Page ${page + 1} of ${soundPages.length}`);
}
renderPads();
function changePage(direction) {
  stopAll();
  page = (page + direction + soundPages.length) % soundPages.length;
  renderPads();
  status.textContent = `Page ${page + 1}: ${pageLabels[page].toLowerCase()}. Keys 1 to 9 play this page.`;
}
$('#page-previous').addEventListener('click', () => changePage(-1));
$('#page-next').addEventListener('click', () => changePage(1));
let audioContext;
let outputGain;
const audioSources = new WeakMap();
function connectAudio(audio) {
  // Create/resume the context in the pad's user gesture, including on iOS.
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    outputGain = audioContext.createGain();
    outputGain.gain.value = volume;
    outputGain.connect(audioContext.destination);
  }
  const source = audioContext.createMediaElementSource(audio);
  source.connect(outputGain);
  audioSources.set(audio, source);
  return audioContext.resume();
}
function clear(id) {
  const audio = active.get(id);
  if (audio) { audio.pause(); audio.currentTime=0; audioSources.get(audio)?.disconnect(); audioSources.delete(audio); active.delete(id); }
  const button=document.querySelector(`[data-id="${id}"]`); if (button) { button.disabled=false; button.classList.remove('playing'); button.setAttribute('aria-disabled','false'); button.setAttribute('aria-pressed','false'); }
  $('.power').classList.toggle('sounding',active.size>0);
}
function stopAll() { [...active.keys()].forEach(clear); status.textContent = allSounds.some(s=>s.src) ? 'Quiet, for now.' : 'Miri’s recordings are being prepared.'; }
async function play(id) {
  if (active.has(id)) return;
  const sound=allSounds.find(s=>s.id===id);
  if (!sound.src) {status.textContent='This button is waiting for Miri’s recording.';return;}
  const audio=new Audio(sound.src); active.set(id,audio);
  const button=document.querySelector(`[data-id="${id}"]`); button.disabled=true; button.classList.add('playing'); button.setAttribute('aria-disabled','true'); button.setAttribute('aria-pressed','true'); $('.power').classList.add('sounding');
  audio.addEventListener('ended',()=>{ if(active.get(id)===audio) clear(id);});
  try { const ready=connectAudio(audio); await Promise.all([ready, audio.play()]); if(active.get(id)===audio) status.textContent=`Miri says: ${sound.name.toLowerCase()}.`; }
  catch {if(active.get(id)===audio) {clear(id); status.textContent='Couldn’t play this recording. Try again.';}}
}
$('.pads').addEventListener('click',event=>{const button=event.target.closest('.pad');if(button)play(Number(button.dataset.id));});
$('#stop').addEventListener('click',stopAll);
$('#volume').addEventListener('input',event=>{volume=Number(event.target.value)/100;$('output').value=event.target.value;if(outputGain)outputGain.gain.value=volume;});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')stopAll();
  if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
  if(/^[1-9]$/.test(event.key)){event.preventDefault();const sound = soundPages[page][Number(event.key) - 1]; if (sound) play(sound.id);}
});
if(allSounds.some(s=>s.src))status.textContent='Your move, human.';
