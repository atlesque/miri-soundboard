import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const manifest = JSON.parse(readFileSync(new URL('../public/audio/manifest.json',import.meta.url)));
const clips = JSON.parse(readFileSync(new URL('./clips.json',import.meta.url)));
test('every assigned pad has a distinct, valid, decodable recording with the selected duration',()=>{
  assert.equal(manifest.length,9);
  assert.deepEqual(manifest.map(x=>x.id).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9]);
  assert.equal(new Set(manifest.map(x=>x.id)).size,manifest.length);
  assert.equal(new Set(manifest.map(x=>x.src)).size,manifest.length);
  for(const recording of manifest){
    assert.ok(recording.id>=1 && recording.id<=9);
    assert.match(recording.src,/^\/audio\/miri-\d{2}\.mp3$/);
    const file=new URL(`../public${recording.src}`,import.meta.url);
    assert.ok(statSync(file).size>1000);
    const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,codec_name','-of','json',file.pathname],{encoding:'utf8'}));
    assert.equal(info.streams.length,1);
    assert.equal(info.streams[0].codec_type,'audio');
    assert.equal(info.streams[0].codec_name,'mp3');
    const clip=clips.find(c=>c.id===recording.id);
    assert.ok(Math.abs(Number(info.format.duration)-(clip.end-clip.start))<.1);
    execFileSync('ffmpeg',['-v','error','-i',file.pathname,'-f','null','-']);
  }
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
