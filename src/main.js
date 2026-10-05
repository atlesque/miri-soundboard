import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './style.css';
import { sounds } from './sounds.js';
const $ = (selector) => document.querySelector(selector);
const status = $('#status');
const active = new Map();
let volume = .75;
let theme;
try { theme = localStorage.getItem('miri-theme') || 'system'; } catch { theme = 'system'; }
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  $('.theme-switch').dataset.position = theme;
  document.documentElement.dataset.theme = theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
  document.querySelectorAll('[data-theme]').forEach(button => {
    if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.theme === theme));
  });
}
document.querySelectorAll('button[data-theme]').forEach(button => button.addEventListener('click', () => {
  theme = button.dataset.theme;
  try { localStorage.setItem('miri-theme', theme); } catch {}
  applyTheme();
}));
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
    eye:'#111512', shine:'#fff9e8', nose:'#806c65', whisker:'#e6e1d6'
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
  return `<svg viewBox="0 0 32 32" class="pixel-cat" aria-hidden="true" shape-rendering="crispEdges">${[...pixels].map(([xy,c])=>{const [x,y]=xy.split(',');return `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[c]}"/>`;}).join('')}</svg>`;
}
$('.pads').innerHTML = sounds.map(s => `<button class="pad" style="--pad-color:${s.color};--cat-light:${s.lightColor}" data-id="${s.id}" aria-label="${s.id}. ${s.name}" aria-disabled="true" aria-pressed="false"><span class="pad-face"><span class="led-screen">${pixelCat(s.id)}</span><span class="pad-caption"><span>${s.name}</span><kbd>${s.id}</kbd></span></span></button>`).join('');
function clear(id) {
  const audio = active.get(id);
  if (audio) { audio.pause(); audio.currentTime=0; active.delete(id); }
  const button=document.querySelector(`[data-id="${id}"]`); button.classList.remove('playing'); button.setAttribute('aria-pressed','false');
  $('.power').classList.toggle('sounding',active.size>0);
}
function stopAll() { [...active.keys()].forEach(clear); status.textContent = sounds.some(s=>s.src) ? 'Quiet, for now.' : 'Miri’s recordings are being prepared.'; }
async function play(id) {
  const sound=sounds.find(s=>s.id===id);
  if (!sound.src) {status.textContent='This button is waiting for Miri’s recording.';return;}
  clear(id);
  const audio=new Audio(sound.src); audio.volume=volume; active.set(id,audio);
  const button=document.querySelector(`[data-id="${id}"]`); button.classList.add('playing'); button.setAttribute('aria-pressed','true'); $('.power').classList.add('sounding');
  audio.addEventListener('ended',()=>{ if(active.get(id)===audio) clear(id);});
  try { await audio.play(); if(active.get(id)===audio) status.textContent=`Miri says: ${sound.name.toLowerCase()}.`; }
  catch {if(active.get(id)===audio) {clear(id); status.textContent='Couldn’t play this recording. Try again.';}}
}
$('.pads').addEventListener('click',event=>{const button=event.target.closest('.pad');if(button)play(Number(button.dataset.id));});
$('#stop').addEventListener('click',stopAll);
$('#volume').addEventListener('input',event=>{volume=Number(event.target.value)/100;$('output').value=event.target.value;active.forEach(audio=>audio.volume=volume);});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')stopAll();
  if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
  if(/^[1-9]$/.test(event.key)){event.preventDefault();play(Number(event.key));}
});
try {
  const response=await fetch('/audio/manifest.json');
  if(!response.ok)throw new Error('Manifest unavailable');
  const recordings=await response.json();
  for(const recording of recordings){const sound=sounds.find(s=>s.id===recording.id);if(sound && /^\/audio\/[a-zA-Z0-9._-]+\.(mp3|wav|m4a|ogg)$/.test(recording.src)){
    sound.src=recording.src;document.querySelector(`[data-id="${sound.id}"]`).setAttribute('aria-disabled','false');
  }}
  if(sounds.some(s=>s.src))status.textContent='Your move, human.';
} catch {status.textContent='Recordings are unavailable. Please refresh to try again.';}
