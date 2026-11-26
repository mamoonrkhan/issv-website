// Tiny deterministic animation engine for the guide videos.
// A video page defines window.VIDEO = { lines: [...] } and calls Engine.init().
// render.py voices each line, then calls Engine.setTimeline(starts, total, ends, captions)
// and Engine.setTime(t) once per frame before taking a screenshot. Every frame is computed
// from t alone (no CSS transitions), so renders are exact and repeatable.
//
// Each line: { scene, text, say?, cues: [...] }   (say = how to pronounce it, text = caption)
// Cue times (`at`) are seconds from the start of that line. Cue types:
//   { at, cursor: '#sel' }          glide the pointer to an element (curved path, 0.75 s)
//   { at, click: true }             click ripple at the pointer
//   { at, add: '#sel', cls: 'on' }  add a class; CSS can animate it with var(--in-<cls>) / var(--pop-<cls>)
//   { at, type: '#sel', text, dur } type text into an element over `dur` seconds
//   { at, scroll: '#sel', by, dur } scroll an element's content up by `by` px over `dur` seconds
//   { at, zoom: '#sel', s }         camera: zoom the window in on an element (s = scale, default 1.3)
//   { at, zoom: null }              camera: zoom back out
//   add `in: '#sel'` to a zoom cue to zoom only inside that element instead of the whole window
// Each run of consecutive lines on the same scene is a segment; a scene shown again starts fresh.
//
// CSS variables set every frame: --t (seconds, on <html>), --st (seconds since the scene
// appeared, on the scene), --in-<cls> and --pop-<cls> (0→1 entrance progress, on elements).
(function () {
  const MOVE = 0.75;    // pointer travel time
  const ENTER = 0.35;   // class entrance animation
  const ZOOM = 0.9;     // camera move
  let starts = [], ends = [], caps = [], total = 0;
  const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeBack = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const $ = (s) => document.querySelector(s);
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  function lineAt(t) {
    let i = 0;
    while (i + 1 < starts.length && starts[i + 1] <= t) i++;
    return i;
  }
  function segment(i) {
    const scene = VIDEO.lines[i].scene;
    let a = i, b = i;
    while (a > 0 && VIDEO.lines[a - 1].scene === scene) a--;
    while (b + 1 < VIDEO.lines.length && VIDEO.lines[b + 1].scene === scene) b++;
    return [a, b];
  }
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
    document.documentElement.style.setProperty('--t', t.toFixed(3));
    const i = lineAt(t);
    const scene = VIDEO.lines[i].scene;
    const [segA, segB] = segment(i);
    const st = t - starts[segA];

    // Scenes: show the current one; CSS animates its entrance from --st.
    let section = null;
    document.querySelectorAll('[data-scene]').forEach((s) => {
      const on = s.dataset.scene === scene;
      s.style.display = on ? '' : 'none';
      if (on) { section = s; s.style.setProperty('--st', st.toFixed(3)); s.style.opacity = String(segA === 0 ? 1 : easeOut(clamp01(st / 0.3))); }
    });

    // Reset dynamic state, then replay this segment's cues up to t.
    document.querySelectorAll('[data-dyn]').forEach((el) => {
      el.dataset.dyn.split(' ').forEach((c) => { if (c) { el.classList.remove(c); el.style.removeProperty('--in-' + c); el.style.removeProperty('--pop-' + c); } });
      el.removeAttribute('data-dyn');
    });
    document.querySelectorAll('[data-typed]').forEach((el) => { el.textContent = ''; el.removeAttribute('data-typed'); });
    document.querySelectorAll('[data-scrolled]').forEach((el) => { el.style.transform = ''; el.removeAttribute('data-scrolled'); });
    document.querySelectorAll('[data-cam]').forEach((el) => { el.style.transform = ''; el.style.transformOrigin = ''; el.removeAttribute('data-cam'); });
    const body = section && section.querySelector('.win-body');

    const cues = segmentCues(segA, segB);
    const moves = [], zooms = [];
    let clickAt = -1;
    for (const c of cues) {
      if (c.t > t) break;
      if (c.add) {
        const k = clamp01((t - c.t) / ENTER);
        document.querySelectorAll(c.add).forEach((el) => {
          el.classList.add(c.cls);
          el.dataset.dyn = ((el.dataset.dyn || '') + ' ' + c.cls).trim();
          el.style.setProperty('--in-' + c.cls, easeOut(k).toFixed(4));
          el.style.setProperty('--pop-' + c.cls, easeBack(k).toFixed(4));
        });
      }
      if (c.type) {
        const el = $(c.type);
        const n = Math.floor(clamp01((t - c.t) / (c.dur || 2)) * c.text.length);
        el.textContent = c.text.slice(0, n);
        el.setAttribute('data-typed', '');
      }
      if (c.scroll) {
        const el = $(c.scroll);
        el.style.transform = `translateY(${-c.by * easeIO(clamp01((t - c.t) / (c.dur || 1)))}px)`;
        el.setAttribute('data-scrolled', '');
      }
      if (c.cursor) moves.push(c);
      if ('zoom' in c) zooms.push(c);
      if (c.click) clickAt = c.t;
    }

    // Camera: zoom the window contents around a target element.
    if (body && zooms.length) {
      const cur = zooms[zooms.length - 1];
      const prev = zooms[zooms.length - 2];
      const target = cur.zoom || (prev && prev.zoom);
      const cam = (cur.in || (prev && prev.in)) ? $(cur.in || prev.in) : body;
      const s0 = prev && prev.zoom ? prev.s || 1.3 : 1;
      const s1 = cur.zoom ? cur.s || 1.3 : 1;
      const s = s0 + (s1 - s0) * easeIO(clamp01((t - cur.t) / ZOOM));
      if (target && $(target)) {
        const br = cam.getBoundingClientRect();
        const r = $(target).getBoundingClientRect();
        cam.style.transformOrigin = `${r.left + r.width / 2 - br.left}px ${r.top + r.height / 2 - br.top}px`;
        cam.style.transform = `scale(${s})`;
        cam.setAttribute('data-cam', '');
      }
    }

    // Pointer: positions are measured after the camera, so it stays on target while zooming.
    const cursor = $('#cursor'), ripple = $('#ripple');
    if (moves.length) {
      const last = moves[moves.length - 1];
      const to = center(last.cursor);
      const from = moves.length > 1 ? center(moves[moves.length - 2].cursor) : to;
      const k = easeIO(clamp01((t - last.t) / MOVE));
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const lift = Math.sin(Math.PI * k) * Math.min(70, dist * 0.18);
      const x = from.x + (to.x - from.x) * k;
      const y = from.y + (to.y - from.y) * k - lift;
      cursor.style.display = '';
      const since = t - clickAt;
      const press = clickAt >= 0 && since < 0.25 ? 0.86 + 0.14 * (since / 0.25) : 1;
      cursor.style.transform = `translate(${x}px, ${y}px) scale(${press})`;
      if (clickAt >= 0 && since < 0.5) {
        ripple.style.display = '';
        ripple.style.transform = `translate(${x}px, ${y}px) scale(${0.3 + easeOut(since / 0.5) * 1.6})`;
        ripple.style.opacity = String(1 - since / 0.5);
      } else ripple.style.display = 'none';
    } else {
      cursor.style.display = 'none';
      ripple.style.display = 'none';
    }

    // Captions: slide in, and light up each word as it's spoken.
    const cap = $('#caption');
    if (cap) {
      const c = caps.find((x) => t >= x.s && t < x.e);
      if (!c) { cap.innerHTML = ''; }
      else {
        const words = c.text.split(' ');
        const totalChars = c.text.length;
        const p = clamp01((t - c.s) / Math.max(0.1, (c.v ?? c.e) - c.s));
        let acc = 0;
        cap.innerHTML = words.map((w) => {
          const startFrac = acc / totalChars;
          acc += w.length + 1;
          const cls = startFrac <= p ? (acc / totalChars > p && p < 1 ? 'now' : 'said') : '';
          return `<span class="${cls}">${esc(w)}</span>`;
        }).join(' ');
        const k = easeOut(clamp01((t - c.s) / 0.22));
        cap.style.opacity = String(k);
        cap.style.transform = `translateY(${(1 - k) * 14}px)`;
      }
    }

    const bar = $('#progress');
    if (bar) bar.style.width = (100 * clamp01(t / total)) + '%';
  }

  window.Engine = {
    init() {
      // Preview in a browser without render.py: each line lasts 5 s, played in real time, no sound.
      if (!location.search.includes('render')) {
        const n = VIDEO.lines.length;
        this.setTimeline(VIDEO.lines.map((_, i) => i * 5), n * 5, VIDEO.lines.map((_, i) => i * 5 + 4));
        const t0 = performance.now();
        const tick = () => { setTime(((performance.now() - t0) / 1000) % total); requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
    },
    // caps: [{ s, e, v, text }] caption chunks (start, end, end of voice) with absolute times.
    setTimeline(s, end, e, c) {
      starts = s; total = end; ends = e || s.map((x) => x + 5);
      caps = c || VIDEO.lines.map((l, i) => ({ s: s[i], e: ends[i], v: ends[i], text: l.text }));
    },
    setTime,
  };
})();
