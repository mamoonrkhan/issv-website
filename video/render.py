"""Render a guide video: AI narration (Kokoro, open source) + animated scenes -> MP4 and captions.

Usage (see video/README.md for setup):
    python video/render.py teacher-setup --model-dir /path/to/kokoro-model

Writes public/videos/<name>.mp4, <name>.vtt (captions) and <name>.jpg (poster).
"""
import argparse
import json
import pathlib
import re
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
SENT_GAP = 0.18    # pause between sentences within a line
CAP_MAX = 70       # longest caption, in characters; longer sentences split at commas

SENT = re.compile(r'(?<=[.!?”])\s+(?=[A-Z“"])')


def sentences(s: str) -> list[str]:
    return [x.strip() for x in SENT.split(s.strip()) if x.strip()]


def chunks(sentence: str) -> list[str]:
    """Split a long sentence at commas into caption-sized pieces."""
    if len(sentence) <= CAP_MAX:
        return [sentence]
    out, cur = [], ''
    for part in re.split(r'(?<=[,;:])\s+', sentence):
        if cur and len(cur) + 1 + len(part) > CAP_MAX:
            out.append(cur)
            cur = part
        else:
            cur = (cur + ' ' + part).strip()
    if cur:
        out.append(cur)
    return out


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
        parts = []  # per line: [(caption sentence, offset in line, duration)]
        for line in video['lines']:
            shown = sentences(line['text'])
            spoken = sentences(line['say']) if line.get('say') else shown
            assert len(shown) == len(spoken), f"text and say need the same sentences: {line['text']}"
            pieces, offs, t_in = [], [], 0.0
            for said, cap in zip(spoken, shown):
                samples, sr = tts.create(said, voice=video.get('voice', 'af_heart'),
                                         speed=video.get('speed', 1.0), lang='en-us')
                a = np.asarray(samples, dtype=np.float32)
                if pieces:
                    pieces.append(np.zeros(int(SENT_GAP * sr), dtype=np.float32))
                    t_in += SENT_GAP
                offs.append((cap, t_in, len(a) / sr))
                pieces.append(a)
                t_in += len(a) / sr
            clips.append(np.concatenate(pieces))
            parts.append(offs)
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

        # 3. Captions: one sentence (or part of one) at a time, timed to the voice.
        caps = []
        for i, offs in enumerate(parts):
            voice_at = starts[i] if i else LEAD_IN
            for cap, off, dur in offs:
                pieces = chunks(cap)
                total_chars = sum(len(p) for p in pieces)
                t0 = voice_at + off
                for p in pieces:
                    d = dur * len(p) / total_chars
                    caps.append({'s': round(t0, 3), 'e': round(t0 + d, 3), 'v': round(t0 + d, 3), 'text': p})
                    t0 += d
        # Hold each caption until the next one starts, if the gap is short.
        for a, b in zip(caps, caps[1:]):
            if b['s'] - a['e'] < 1.0:
                a['e'] = b['s']
        caps[-1]['e'] += 0.6
        cues = ['WEBVTT', '']
        for c in caps:
            cues += [f"{vtt_time(c['s'])} --> {vtt_time(c['e'])}", c['text'], '']
        (OUT / f'{args.name}.vtt').write_text('\n'.join(cues), encoding='utf-8')

        # 4. Frames -> MP4 with the narration.
        page.evaluate(f'Engine.setTimeline({starts}, {total}, {ends}, {json.dumps(caps)})')
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
