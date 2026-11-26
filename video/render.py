"""Render a guide video: AI narration (Kokoro, open source) + animated scenes -> MP4 and captions.

Usage (see video/README.md for setup):
    python video/render.py teacher-setup --model-dir /path/to/kokoro-model

Writes public/videos/<name>.mp4, <name>.vtt (captions) and <name>.jpg (poster).
"""
import argparse
import pathlib
import subprocess
import tempfile

import imageio_ffmpeg
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / 'public' / 'videos'
FPS = 30
LEAD_IN = 0.8      # silence before the first line
GAP_SAME = 0.45    # pause between lines on the same screen
GAP_SCENE = 0.9    # pause when the screen changes
TAIL = 2.0         # hold the last frame


def vtt_time(s: float) -> str:
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f'{int(h):02d}:{int(m):02d}:{sec:06.3f}'


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('name')
    ap.add_argument('--model-dir', required=True)
    args = ap.parse_args()
    md = pathlib.Path(args.model_dir)
    OUT.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})
        page.goto((HERE / f'{args.name}.html').as_uri() + '?render')
        page.evaluate('document.fonts.ready')
        video = page.evaluate('window.VIDEO')

        # 1. Narration, one clip per line.
        tts = Kokoro(str(md / 'kokoro-v1.0.onnx'), str(md / 'voices-v1.0.bin'))
        clips, sr = [], 24000
        for line in video['lines']:
            samples, sr = tts.create(line.get('say') or line['text'], voice=video.get('voice', 'af_heart'),
                                     speed=video.get('speed', 1.0), lang='en-us')
            clips.append(np.asarray(samples, dtype=np.float32))
            print(f"  voiced: {line['text'][:60]}")

        # 2. Timeline: each line lasts as long as its audio, or its animation if longer.
        starts, t = [], LEAD_IN
        ends = []
        for i, (line, clip) in enumerate(zip(video['lines'], clips)):
            if i:
                t += GAP_SAME if line['scene'] == video['lines'][i - 1]['scene'] else GAP_SCENE
            starts.append(t)
            last_cue = max([c['at'] + (c.get('dur', 0)) for c in line.get('cues', [])] or [0])
            length = max(len(clip) / sr, last_cue + 0.9)
            ends.append(t + len(clip) / sr)
            t += length
        total = t + TAIL
        starts[0] = 0.0  # show the title from the first frame

        audio = np.zeros(int(total * sr) + 1, dtype=np.float32)
        for i, clip in enumerate(clips):
            at = int((starts[i] if i else LEAD_IN) * sr)
            audio[at:at + len(clip)] += clip
        ends[0] = LEAD_IN + len(clips[0]) / sr

        # 3. Captions.
        cues = ['WEBVTT', '']
        for i, line in enumerate(video['lines']):
            begin = starts[i] if i else LEAD_IN
            cues += [f'{vtt_time(begin)} --> {vtt_time(ends[i] + 0.3)}', line['text'], '']
        (OUT / f'{args.name}.vtt').write_text('\n'.join(cues), encoding='utf-8')

        # 4. Frames -> MP4 with the narration.
        page.evaluate(f'Engine.setTimeline({starts}, {total}, {ends})')
        with tempfile.TemporaryDirectory() as tmp:
            wav = pathlib.Path(tmp) / 'voice.wav'
            sf.write(wav, audio, sr)
            ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
            proc = subprocess.Popen([
                ffmpeg, '-y', '-loglevel', 'error',
                '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                '-i', str(wav),
                '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', '27', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-shortest',
                str(OUT / f'{args.name}.mp4'),
            ], stdin=subprocess.PIPE)
            frames = int(total * FPS)
            for n in range(frames):
                page.evaluate(f'Engine.setTime({n / FPS})')
                proc.stdin.write(page.screenshot(type='jpeg', quality=92))
                if n % (FPS * 10) == 0:
                    print(f'  frame {n}/{frames}')
            proc.stdin.close()
            proc.wait()

        # 5. Poster: the title card.
        page.evaluate('Engine.setTime(1.5)')
        page.screenshot(path=str(OUT / f'{args.name}.jpg'), type='jpeg', quality=85)
        browser.close()
    print(f'Done: {total:.1f} s -> public/videos/{args.name}.mp4')


if __name__ == '__main__':
    main()
