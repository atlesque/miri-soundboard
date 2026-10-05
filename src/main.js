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
// A small hand-drawn pixel cat, with a different expression and silhouette per pad.
function pixelCat(pose) {
  const pixels = new Map();
  const rect = (x, y, w, h, color='body') => { for(let a=x;a<x+w;a++) for(let b=y;b<y+h;b++) pixels.set(`${a},${b}`, color); };
  rect(6,6,12,9); rect(5,8,14,5); rect(6,3,2,4); rect(8,4,2,3); rect(16,3,2,4); rect(14,4,2,3);
  rect(7,4,1,2,'pink'); rect(16,4,1,2,'pink');
  rect(8,14,8,5); rect(7,18,3,2); rect(14,18,3,2); rect(17,15,3,2); rect(19,12,2,4);
  rect(7,12,2,1,'pink'); rect(15,12,2,1,'pink');
  if(pose==='sleep'){rect(8,10,3,1,'eye');rect(14,10,3,1,'eye');rect(19,3,3,1,'accent');rect(20,4,1,1,'accent');rect(19,5,3,1,'accent');}
  else if(pose==='serious'){rect(8,9,3,1,'eye');rect(14,9,3,1,'eye');rect(9,10,1,2,'eye');rect(14,10,1,2,'eye');}
  else if(pose==='please'){rect(8,9,3,3,'eye');rect(14,9,3,3,'eye');rect(8,9,1,1,'shine');rect(14,9,1,1,'shine');rect(10,15,4,2,'pink');}
  else {rect(9,9,2,2,'eye');rect(14,9,2,2,'eye');rect(9,9,1,1,'shine');rect(14,9,1,1,'shine');}
  rect(11,12,2,1,'nose');
  if(['food','long','protest'].includes(pose)){rect(10,13,4,2,'eye');rect(11,14,2,1,'pink');}
  else {rect(11,13,1,1,'eye');rect(10,14,1,1,'eye');rect(12,14,1,1,'eye');}
  if(pose==='hello'){rect(4,13,2,4);rect(3,12,2,2);}
  if(pose==='food'){rect(3,20,18,1,'accent');rect(6,21,12,1,'accent');}
  if(pose==='chirp'){rect(20,5,1,5,'accent');rect(19,9,2,2,'accent');rect(21,5,2,1,'accent');}
  if(pose==='question'){rect(20,2,3,1,'accent');rect(22,3,1,2,'accent');rect(21,5,1,1,'accent');rect(21,7,1,1,'accent');}
  if(pose==='long'){rect(2,9,1,5,'accent');rect(0,10,1,3,'accent');rect(21,9,1,5,'accent');rect(23,10,1,3,'accent');}
  if(pose==='protest'){rect(20,3,1,3,'accent');rect(20,7,1,1,'accent');}
  const palette={body:'currentColor',pink:'#c0767b',eye:'#10171a',shine:'#f5ffff',nose:'#efbec0',accent:'currentColor'};
  return `<svg viewBox="0 0 24 24" class="pixel-cat" aria-hidden="true" shape-rendering="crispEdges">${[...pixels].map(([xy,c])=>{const [x,y]=xy.split(',');return `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[c]}"/>`;}).join('')}</svg>`;
}
$('.pads').innerHTML = sounds.map(s => `<button class="pad" style="--pad-color:${s.color}" data-id="${s.id}" aria-label="${s.id}. ${s.name}" aria-disabled="true" aria-pressed="false"><span class="pad-face"><span class="led-screen">${pixelCat(s.pose)}<span class="led-dot"></span></span><span class="pad-caption"><span>${s.name}</span><kbd>${s.id}</kbd></span></span></button>`).join('');
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
