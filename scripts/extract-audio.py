"""Rebuild the selected Miri clips locally. Requires ffmpeg; no Python packages needed."""
import array
import argparse
import hashlib
import json
import math
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
clips = json.loads((ROOT / 'scripts/clips.json').read_text())
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--ids', type=int, nargs='+', help='Rebuild only these recordings, preserving the others')
args = parser.parse_args()
out = ROOT / 'public/audio'
out.mkdir(parents=True, exist_ok=True)
manifest_path = out / 'manifest.json'
manifest = json.loads(manifest_path.read_text()) if args.ids and manifest_path.exists() else []
if args.ids:
    missing = set(args.ids) - {clip['id'] for clip in clips}
    if missing:
        raise ValueError(f'Unknown recording IDs: {sorted(missing)}')
    clips = [clip for clip in clips if clip['id'] in args.ids]
    manifest = [recording for recording in manifest if recording['id'] not in args.ids]
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
    gain_db = min(clip.get('maxGainDb', 24), -20 - 20*math.log10(max(rms,1e-8)), -2 - 20*math.log10(peak))
    filename = f'miri-{clip["id"]:02d}.mp3'
    fade_in = clip.get('fadeIn', 0.012)
    fade_out = clip.get('fadeOut', 0.025)
    if not 0 < fade_in <= duration / 2 or not 0 < fade_out <= duration / 2:
        raise ValueError(f'Invalid fades: {clip}')
    filters = f'highpass=f=100,lowpass=f=10000,volume={gain_db:.3f}dB,afade=t=in:d={fade_in},afade=t=out:st={duration-fade_out:.3f}:d={fade_out},alimiter=limit=0.891:level=false'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(clip['start']), '-i', str(source),
                    '-t', str(duration), '-map', '0:a:0', '-vn', '-ac', '1', '-ar', '48000',
                    '-af', filters, '-c:a', 'libmp3lame', '-b:a', '128k', '-map_metadata', '-1',
                    str(out/filename)], check=True)
    # A new URL prevents existing browser/CDN caches from serving an older cut.
    digest = hashlib.sha256((out / filename).read_bytes()).hexdigest()[:12]
    versioned_filename = f'miri-{clip["id"]:02d}-{digest}.mp3'
    (out / filename).replace(out / versioned_filename)
    filename = versioned_filename
    manifest.append({'id':clip['id'], 'src':f'/audio/{filename}', 'duration':round(duration,3)})
    print(f'{filename}: {duration:.2f}s, gain {gain_db:.1f}dB')
manifest_path.write_text(json.dumps(sorted(manifest, key=lambda recording: recording['id']), indent=2)+'\n')
