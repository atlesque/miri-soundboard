"""Rebuild the selected Miri clips locally. Requires ffmpeg; no Python packages needed."""
import array
import json
import math
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
clips = json.loads((ROOT / 'scripts/clips.json').read_text())
out = ROOT / 'public/audio'
out.mkdir(parents=True, exist_ok=True)
manifest = []
for clip in clips:
    source = ROOT / 'source-videos' / clip['source']
    duration = clip['end'] - clip['start']
    if duration <= 0 or clip['start'] < 0:
        raise ValueError(f'Invalid interval: {clip}')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(clip['start']), '-i', str(source),
                          '-t', str(duration), '-map', '0:a:0', '-ac', '1', '-ar', '48000',
                          '-f', 'f32le', '-'], check=True, capture_output=True).stdout
    samples = array.array('f', raw)
    peak = max(abs(x) for x in samples)
    rms = math.sqrt(sum(x*x for x in samples)/len(samples))
    if peak < 1e-6:
        raise ValueError(f'Silent recording: {clip}')
    gain_db = min(24, -20 - 20*math.log10(max(rms,1e-8)), -2 - 20*math.log10(peak))
    filename = f'miri-{clip["id"]:02d}.mp3'
    filters = f'highpass=f=100,lowpass=f=10000,volume={gain_db:.3f}dB,afade=t=in:d=0.012,afade=t=out:st={duration-.025:.3f}:d=0.025,alimiter=limit=0.891:level=false'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(clip['start']), '-i', str(source),
                    '-t', str(duration), '-map', '0:a:0', '-vn', '-ac', '1', '-ar', '48000',
                    '-af', filters, '-c:a', 'libmp3lame', '-b:a', '128k', '-map_metadata', '-1',
                    str(out/filename)], check=True)
    manifest.append({'id':clip['id'], 'src':f'/audio/{filename}', 'duration':round(duration,3)})
    print(f'{filename}: {duration:.2f}s, gain {gain_db:.1f}dB')
(out/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
