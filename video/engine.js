// Tiny deterministic animation engine for the guide videos.
// A video page defines window.VIDEO = { lines: [...] } and calls Engine.init().
// render.py measures each narration line, then calls Engine.setTimeline(starts)
// and Engine.setTime(t) once per frame before taking a screenshot.
//
// Each line: { scene, text, say?, cues: [...] }   (say = how to pronounce it, text = caption)
// Cue times (`at`) are seconds from the start of that line. Cue types:
//   { at, cursor: '#sel' }          glide the pointer to an element (0.7 s)
//   { at, click: true }             click ripple at the pointer
//   { at, add: '#sel', cls: 'on' }  add a class (stays until the scene ends)
//   { at, type: '#sel', text, dur } type text into an element over `dur` seconds
//   { at, scroll: '#sel', by, dur }  scroll an element's content up by `by` px over `dur` seconds
(function () {
  const MOVE = 0.7;
  let starts = [];
  let ends = [];
  let total = 0;
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const $ = (s) => document.querySelector(s);

  function lineAt(t) {
    let i = 0;
    while (i + 1 < starts.length && starts[i + 1] <= t) i++;
    return i;
  }

  // A segment is a run of consecutive lines on the same scene. A scene can appear more than once;
  // each appearance starts fresh.
  function segment(i) {
    const scene = VIDEO.lines[i].scene;
    let a = i, b = i;
    while (a > 0 && VIDEO.lines[a - 1].scene === scene) a--;
    while (b + 1 < VIDEO.lines.length && VIDEO.lines[b + 1].scene === scene) b++;
    return [a, b];
  }

  // All cues in one segment, with absolute times.
  function segmentCues(a, b) {
    const out = [];
    for (let i = a; i <= b; i++) (VIDEO.lines[i].cues || []).forEach((c) => out.push({ ...c, t: starts[i] + c.at }));
    return out.sort((x, y) => x.t - y.t);
  }

  function center(sel) {
    const el = $(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function setTime(t) {
    const i = lineAt(t);
    const scene = VIDEO.lines[i].scene;

    // Scenes: show the current one, fade it in over 0.35 s.
    const [segA, segB] = segment(i);
    const firstOfScene = segA;
    const fade = Math.min(1, (t - starts[firstOfScene]) / 0.35);
    document.querySelectorAll('[data-scene]').forEach((s) => {
      const on = s.dataset.scene === scene;
      s.style.display = on ? '' : 'none';
      s.style.opacity = on ? String(firstOfScene === 0 ? 1 : fade) : '0';
    });

    // Reset dynamic state, then replay this scene's cues up to t.
    document.querySelectorAll('[data-dyn]').forEach((el) => {
      el.dataset.dyn.split(' ').forEach((c) => c && el.classList.remove(c));
      el.removeAttribute('data-dyn');
    });
    document.querySelectorAll('[data-typed]').forEach((el) => { el.textContent = ''; });
    document.querySelectorAll('[data-scrolled]').forEach((el) => { el.style.transform = ''; el.removeAttribute('data-scrolled'); });

    const cues = segmentCues(segA, segB);
    const cursor = $('#cursor');
    const ripple = $('#ripple');
    let pos = null, from = null, moveStart = -1, clickAt = -1;
    for (const c of cues) {
      if (c.t > t) break;
      if (c.add) {
        document.querySelectorAll(c.add).forEach((el) => {
          el.classList.add(c.cls);
          el.dataset.dyn = ((el.dataset.dyn || '') + ' ' + c.cls).trim();
        });
      }
      if (c.type) {
        const el = $(c.type);
        const n = Math.floor(Math.min(1, (t - c.t) / (c.dur || 2)) * c.text.length);
        el.textContent = c.text.slice(0, n);
      }
      if (c.scroll) {
        const el = $(c.scroll);
        const k = ease(Math.min(1, (t - c.t) / (c.dur || 1)));
        el.style.transform = `translateY(${-c.by * k}px)`;
        el.setAttribute('data-scrolled', '');
      }
      if (c.cursor) {
        from = pos || center(c.cursor);
        pos = center(c.cursor);
        moveStart = c.t;
      }
      if (c.click) clickAt = c.t;
    }
    // Typed fields keep their text after typing finishes; mark them so the reset clears them next frame.
    cues.filter((c) => c.type && c.t <= t).forEach((c) => $(c.type).setAttribute('data-typed', ''));

    if (pos) {
      const k = ease(Math.min(1, (t - moveStart) / MOVE));
      const x = from.x + (pos.x - from.x) * k;
      const y = from.y + (pos.y - from.y) * k;
      cursor.style.display = '';
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      const since = t - clickAt;
      if (clickAt >= 0 && since < 0.45) {
        ripple.style.display = '';
        ripple.style.transform = `translate(${x}px, ${y}px) scale(${0.4 + since * 2.2})`;
        ripple.style.opacity = String(1 - since / 0.45);
        cursor.style.transform += ' scale(0.88)';
      } else ripple.style.display = 'none';
    } else {
      cursor.style.display = 'none';
      ripple.style.display = 'none';
    }

    // Captions, drawn into the frame so they're large and always on.
    const cap = $('#caption');
    if (cap) {
      const on = t >= starts[i] && t <= (ends[i] ?? Infinity) + 0.6;
      cap.textContent = on ? VIDEO.lines[i].text : '';
      cap.style.opacity = on ? '1' : '0';
    }

    // Progress bar.
    const bar = $('#progress');
    if (bar) bar.style.width = (100 * Math.min(1, t / total)) + '%';
  }

  window.Engine = {
    init() {
      // Preview in a browser without render.py: pretend each line lasts 5 s and play in real time.
      if (!location.search.includes('render')) {
        this.setTimeline(VIDEO.lines.map((_, i) => i * 5), VIDEO.lines.length * 5, VIDEO.lines.map((_, i) => i * 5 + 4));
        const t0 = performance.now();
        const tick = () => { setTime(((performance.now() - t0) / 1000) % total); requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
    },
    setTimeline(s, end, e) { starts = s; total = end; ends = e || s.map((x) => x + 5); },
    setTime,
  };
})();
