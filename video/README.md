# Guide videos

Short how-to videos for the Online Classes page. Each video is one HTML file of animated, simplified screens plus a narration script. `render.py` voices the script with **Kokoro** (an open-source AI voice, Apache 2.0, runs offline and is free), syncs the animation to it, and writes:

- `public/videos/<name>.mp4`: the video
- `public/videos/<name>.vtt`: captions (on by default on the site)
- `public/videos/<name>.jpg`: poster image

| Video | Source |
|---|---|
| Students & parents: joining a virtual class | `student-join.html` |
| Teacher setup: running a virtual class | `teacher-setup.html` |

## Changing a video

1. Open `<name>.html` and edit the lines in `VIDEO.lines` at the bottom. `text` is the caption. `say` (optional) is how the voice should pronounce it, e.g. "nine fifty" for 9:50. `cues` move the pointer and open menus, with times in seconds from the start of that line.
2. Preview: open the HTML file in Chrome. Each line plays for 5 seconds, without sound.
3. Render (below), check the MP4, and commit the files in `public/videos/`.

## Rendering

Needs Python 3.10+ and Google Chrome. One-time setup, outside the repo:

```sh
python3 -m venv ~/issv-video && ~/issv-video/bin/pip install kokoro-onnx soundfile playwright imageio-ffmpeg
mkdir -p ~/kokoro-model && cd ~/kokoro-model
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

Then, from the repo (after `npm install`, which provides the font):

```sh
~/issv-video/bin/python video/render.py teacher-setup --model-dir ~/kokoro-model
```

A two-minute video takes a few minutes to render.
