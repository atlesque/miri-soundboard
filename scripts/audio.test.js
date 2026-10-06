import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { allSounds, soundPages } from '../src/sounds.js';
const manifest = JSON.parse(readFileSync(new URL('../public/audio/manifest.json',import.meta.url)));
const clips = JSON.parse(readFileSync(new URL('./clips.json',import.meta.url)));
test('deployment cache policy revalidates every response without conflicting overrides',()=>{
  const headers=readFileSync(new URL('../public/_headers',import.meta.url),'utf8');
  const rules=headers.split('\n').filter(line=>line.trim() && !line.startsWith(' ') && !line.startsWith('#'));
  assert.deepEqual(rules,['/*']);
  assert.deepEqual(headers.match(/^\s+Cache-Control:.*$/gm),[
    '  Cache-Control: public, no-cache, max-age=0, must-revalidate',
  ]);
});
test('all pages have recording sources before any runtime manifest request',()=>{
  for(const page of soundPages){
    for(const sound of page){
      assert.equal(sound.src,manifest.find(recording=>recording.id===sound.id).src);
    }
  }
});
test('every assigned pad has a distinct, valid, decodable recording with the selected duration',()=>{
  assert.equal(manifest.length,35);
  assert.deepEqual(manifest.map(x=>x.id).sort((a,b)=>a-b),allSounds.map(x=>x.id).sort((a,b)=>a-b));
  assert.equal(new Set(manifest.map(x=>x.id)).size,manifest.length);
  assert.equal(new Set(manifest.map(x=>x.src)).size,manifest.length);
  for(const recording of manifest){
    assert.ok(recording.id>=1 && recording.id<=35);
    assert.match(recording.src,/^\/audio\/miri-\d{2}(?:-[a-f0-9]{12})?\.mp3$/);
    const file=new URL(`../public${recording.src}`,import.meta.url);
    const hash=recording.src.match(/-([a-f0-9]{12})\.mp3$/)?.[1];
    if(recording.id<=9) assert.ok(hash,'recut originals must use a fresh content-based URL');
    if(hash) assert.equal(hash,createHash('sha256').update(readFileSync(file)).digest('hex').slice(0,12));
    assert.ok(statSync(file).size>1000);
    const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,codec_name','-of','json',file.pathname],{encoding:'utf8'}));
    assert.equal(info.streams.length,1);
    assert.equal(info.streams[0].codec_type,'audio');
    assert.equal(info.streams[0].codec_name,'mp3');
    const clip=clips.find(c=>c.id===recording.id);
    const duration=clip.end-clip.start;
    assert.ok(Math.abs(recording.duration-duration)<.001);
    assert.ok(Math.abs(Number(info.format.duration)-duration)<.1);
    execFileSync('ffmpeg',['-v','error','-i',file.pathname,'-f','null','-']);
  }
});
test('latest recordings open first and existing pages retain their IDs',()=>{
  assert.deepEqual(soundPages.map(page=>page.length),[9,8,9,9]);
  assert.deepEqual(soundPages[2].map(sound=>sound.id),[10,11,12,13,14,15,16,17,18]);
  assert.deepEqual(soundPages[3].map(sound=>sound.id),[1,2,3,4,5,6,7,8,9]);
  assert.deepEqual(soundPages.slice(0,2).flat().map(sound=>sound.id),Array.from({length:17},(_,i)=>19+i));
  const newClips=clips.filter(clip=>clip.id>=10 && clip.id<=18);
  assert.equal(newClips.length,9);
  assert.ok(newClips.filter(clip=>clip.end-clip.start>=1.2).length>=3);
  assert.ok(newClips.every(clip=>clip.fadeOut>=.1));
});
test('selected intervals never reuse or overlap the same recorded call',()=>{
  for(const clip of clips){
    assert.ok(clip.end>clip.start && clip.start>=0);
    for(const other of clips){
      if(clip.id===other.id || clip.source!==other.source)continue;
      assert.ok(clip.end<=other.start || other.end<=clip.start,`overlapping clips ${clip.id} and ${other.id}`);
    }
  }
});

test('grouped new vocalizations have no more than half a second between calls',()=>{
  for(const clip of clips.filter(clip=>clip.id>=19)){
    const calls=clip.vocalizations || [[clip.start,clip.end]];
    for(let i=0;i<calls.length;i++){
      assert.ok(calls[i][0]>=clip.start && calls[i][1]<=clip.end);
      assert.ok(calls[i][1]>calls[i][0]);
      if(i>0) assert.ok(calls[i][0]-calls[i-1][1]<=.5);
    }
  }
});
