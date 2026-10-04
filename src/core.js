// ============================================================================
//  DATA STRUCTURES — film engine
//  Every frame is a pure function of time t (seconds): render(ctx, t).
//  Same code drives the live web player and the frame-exact MP4 export.
// ============================================================================
(function () {
  const W = 1920, H = 1080, DUR = 300;
  const DS = (window.DS = { W, H, DUR, scenes: [] });
  const E = window.EVENTS;

  // ------------------------------------------------------------ math
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const ease = {
    io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    out: (x) => 1 - Math.pow(1 - x, 3),
    in: (x) => x * x * x,
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    ioExpo: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
    outBack: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    outElastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
    outBounce: (x) => {
      const n1 = 7.5625, d1 = 2.75;
      if (x < 1 / d1) return n1 * x * x;
      if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
      if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    },
  };
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hash1 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ------------------------------------------------------------ beat helpers
  function lastIdx(arr, t) { let lo = 0, hi = arr.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }
  function pulse(arr, t, decay = 0.18) { const i = lastIdx(arr, t); if (i < 0) return 0; return Math.exp(-(t - arr[i]) / decay); }
  function since(arr, t) { const i = lastIdx(arr, t); return i < 0 ? 1e9 : t - arr[i]; }

  // ------------------------------------------------------------ palette & fonts
  const C = {
    bg: "#03040c", ink: "#eaf6ff", dim: "#7d8db5",
    cyan: "#38e8ff", blue: "#3d7bff", violet: "#8b5cf6", magenta: "#ff3dcb", pink: "#ff6fb5",
    amber: "#ffb627", orange: "#ff7a2f", lime: "#9dff5c", green: "#36f5a0", red: "#ff4d6d", gold: "#ffd66b",
  };
  const F = {
    cn: '"Noto Sans SC","Noto Sans CJK SC","PingFang SC","Microsoft YaHei",sans-serif',
    en: '"Inter","Noto Sans SC","Noto Sans CJK SC","Helvetica Neue",Arial,sans-serif',
    mono: '"JetBrains Mono","DejaVu Sans Mono","SFMono-Regular",Menlo,Consolas,monospace',
  };
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
  function mix(h1, h2, t) {
    const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
    const r = Math.round(lerp(a >> 16, b >> 16, t)), g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  }

  // ------------------------------------------------------------ sprites
  function mkCanvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  const glowCache = {};
  function glowSprite(color) {
    if (glowCache[color]) return glowCache[color];
    const s = 128, c = mkCanvas(s, s), g = c.getContext("2d");
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, hexA(color, 1)); gr.addColorStop(0.18, hexA(color, 0.55)); gr.addColorStop(0.45, hexA(color, 0.14)); gr.addColorStop(1, hexA(color, 0));
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return (glowCache[color] = c);
  }
  function glow(ctx, x, y, r, color, a = 1) {
    if (a <= 0.003 || r <= 0.5) return;
    const op = ctx.globalCompositeOperation, ga = ctx.globalAlpha;
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = ga * Math.min(1, a);
    ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = op; ctx.globalAlpha = ga;
  }
  const bitCache = {};
  function bitSprite(ch, color) {
    const k = ch + color; if (bitCache[k]) return bitCache[k];
    const c = mkCanvas(64, 80), g = c.getContext("2d");
    g.font = `700 60px ${F.mono}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = color; g.fillText(ch, 32, 42);
    return (bitCache[k] = c);
  }

  // ------------------------------------------------------------ drawing helpers
  function text(ctx, s, x, y, { size = 32, weight = 400, font = F.en, color = C.ink, align = "center", base = "middle", alpha = 1, ls = 0, stroke = 0 } = {}) {
    if (alpha <= 0.003) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = base;
    ctx.letterSpacing = ls + "px";
    if (stroke) { ctx.strokeStyle = color; ctx.lineWidth = stroke; ctx.strokeText(s, x, y); }
    else { ctx.fillStyle = color; ctx.fillText(s, x, y); }
    ctx.restore();
  }
  const SCR = "01ABCDEF#%&<>/\\[]{}*+=?$";
  function decode(str, p, seed = 1) {
    let out = "";
    for (let i = 0; i < str.length; i++) {
      const ch = str[i]; if (ch === " ") { out += " "; continue; }
      const th = (i + 1) / (str.length + 1);
      if (p >= th * 0.85 + 0.15) out += ch;
      else if (p > th * 0.5) out += SCR[Math.floor(hash1(i * 13 + seed + Math.floor(p * 30)) * SCR.length)];
      else out += "";
    }
    return out;
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function neonBox(ctx, x, y, w, h, color, a = 1, { r = 10, fill = 0.14, lw = 2.5, core = true } = {}) {
    if (a <= 0.003) return;
    ctx.save(); ctx.globalAlpha *= a;
    rrect(ctx, x, y, w, h, r);
    ctx.fillStyle = hexA(color, fill); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
    if (core) { ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
  }
  function neonLine(ctx, pts, color, a = 1, lw = 2.5) {
    if (a <= 0.003 || pts.length < 2) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = hexA(color, 0.25); ctx.lineWidth = lw * 4; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = Math.max(0.8, lw * 0.35); ctx.stroke();
    ctx.restore();
  }
  function bez(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
            u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  }
  function bezPts(p0, p1, p2, p3, a = 0, b = 1, n = 28) { const r = []; for (let i = 0; i <= n; i++) r.push(bez(p0, p1, p2, p3, lerp(a, b, i / n))); return r; }
  function arrowHead(ctx, x, y, ang, size, color, a = 1) {
    if (a <= 0.003) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size * 0.55); ctx.lineTo(-size * 0.7, 0); ctx.lineTo(-size, size * 0.55); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function ring(ctx, x, y, r, color, a = 1, lw = 2) {
    if (a <= 0.003 || r <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke(); ctx.restore();
  }
  // complexity badge — pops with overshoot, rings burst
  function badge(ctx, x, y, label, color, lt, { size = 54, sub = "" } = {}) {
    if (lt < 0) return;
    const p = ease.outBack(prog(lt, 0, 0.45));
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
    ctx.font = `800 ${size}px ${F.mono}`; const w = ctx.measureText(label).width + size * 0.9, h = size * 1.45;
    neonBox(ctx, -w / 2, -h / 2, w, h, color, 1, { r: h / 2, fill: 0.2, lw: 3 });
    text(ctx, label, 0, 2, { size, weight: 800, font: F.mono, color: "#fff" });
    if (sub) text(ctx, sub, 0, h / 2 + 26, { size: 22, weight: 500, font: F.en, color, ls: 4 });
    ctx.restore();
    const rb = prog(lt, 0, 0.8);
    ring(ctx, x, y, 40 + rb * 220, color, (1 - rb) * 0.8, 3);
    glow(ctx, x, y, 240, color, (1 - rb) * 0.7);
  }

  // ------------------------------------------------------------ 3D projection
  function cam3({ tx = 0, ty = 0, tz = 0, yaw = 0, pitch = 0, roll = 0, dist = 1200, fov = 1100, cx = W / 2, cy = H / 2 }) {
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    return (x, y, z) => {
      x -= tx; y -= ty; z -= tz;
      const x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
      const y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      const x2 = x1 * cr - y1 * sr, y2 = x1 * sr + y1 * cr;
      const zz = z2 + dist; if (zz < 5) return null;
      const s = fov / zz; return { x: cx + x2 * s, y: cy + y2 * s, s, z: zz };
    };
  }

  // ------------------------------------------------------------ background layers
  const STARS = (() => { const r = rng(7), a = []; for (let i = 0; i < 520; i++) a.push([r() * 2 - 1, r() * 2 - 1, 0.15 + r() * 0.85, r()]); return a; })();
  function starfield(ctx, t, { drift = 20, dx = 0, dy = 0, color = "#9fb8ff", a = 1, twinkle = true } = {}) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const [sx, sy, z, ph] of STARS) {
      let x = ((sx * 0.5 + 0.5) * W * 1.2 + (t * drift + dx) * z) % (W * 1.2); if (x < 0) x += W * 1.2; x -= W * 0.1;
      let y = ((sy * 0.5 + 0.5) * H * 1.2 + dy * z) % (H * 1.2); if (y < 0) y += H * 1.2; y -= H * 0.1;
      const tw = twinkle ? 0.55 + 0.45 * Math.sin(t * (1 + ph * 3) + ph * 40) : 1;
      ctx.globalAlpha = a * z * 0.7 * tw; ctx.fillStyle = ph > 0.85 ? "#ffd9f4" : color;
      const s = z * 2.2; ctx.fillRect(x, y, s, s);
    }
    ctx.restore();
  }
  function gridFloor(ctx, t, color, a = 0.5, { horizon = H * 0.58, speed = 60, beat = 0 } = {}) {
    if (a <= 0.003) return;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const vx = W / 2;
    for (let i = -22; i <= 22; i++) {
      const xb = vx + i * 160;
      const al = a * 0.35 * (1 - Math.abs(i) / 23);
      ctx.strokeStyle = hexA(color, al * (1 + beat)); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(vx + i * 6, horizon); ctx.lineTo(xb + (xb - vx) * 2.2, H + 40); ctx.stroke();
    }
    const off = (t * speed) % 100;
    for (let k = 0; k < 18; k++) {
      const d = k * 100 + off; const zz = 1 + d / 80; const y = horizon + (H - horizon) * (1 / zz) * 0 + (H - horizon) * Math.pow(d / 1800, 2.2);
      if (y > H + 5) continue;
      ctx.strokeStyle = hexA(color, a * 0.45 * Math.pow(d / 1800, 0.8) * (1 + beat));
      ctx.lineWidth = 1 + d / 900; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    const gr = ctx.createLinearGradient(0, horizon - 120, 0, horizon + 60);
    gr.addColorStop(0, hexA(color, 0)); gr.addColorStop(0.7, hexA(color, a * 0.25)); gr.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = gr; ctx.fillRect(0, horizon - 120, W, 180);
    ctx.restore();
  }
  function bgFill(ctx, c1 = "#050816", c2 = C.bg, cx = W / 2, cy = H * 0.45) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.75);
    g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function hexRain(ctx, t, color, a = 0.12, seed = 3) {
    if (a <= 0.003) return;
    ctx.save(); ctx.font = `500 15px ${F.mono}`; ctx.textAlign = "left"; ctx.fillStyle = color;
    const r = rng(seed);
    for (let c = 0; c < 26; c++) {
      const x = r() * W, sp = 20 + r() * 50, ph = r() * 2000, len = 6 + Math.floor(r() * 10);
      for (let k = 0; k < len; k++) {
        const y = ((ph + t * sp) + k * 22) % (H + 300) - 150;
        const v = Math.floor(hash1(c * 100 + k + Math.floor(t * 4 + ph)) * 65535);
        ctx.globalAlpha = a * (k / len);
        ctx.fillText("0x" + v.toString(16).toUpperCase().padStart(4, "0"), x, y);
      }
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ chapter card
  function chapterCard(ctx, lt, num, cn, en, color, dur = 3.8) {
    if (lt < 0 || lt > dur) return;
    const out = prog(lt, dur - 0.7, dur), outE = ease.in(out);
    const cy = H * 0.46 - outE * 40;
    ctx.save();
    // dark wash so card reads over any scene
    ctx.globalAlpha = (1 - out) * 0.55 * prog(lt, 0, 0.3); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1 - outE;
    // giant outlined number
    const np = ease.outExpo(prog(lt, 0, 1.2));
    text(ctx, num, W / 2 - 460 + np * 60, cy - 20, { size: 420, weight: 900, font: F.en, color: hexA(color, 0.28), stroke: 2.5, ls: -10 });
    // sweep line
    const lp = ease.outExpo(prog(lt, 0.05, 0.9)), lw = lp * 1100 * (1 - out * 0.8);
    ctx.fillStyle = color; ctx.fillRect(W / 2 - lw / 2, cy + 46, lw, 3);
    glow(ctx, W / 2 - lw / 2 + lw * prog(lt, 0.05, 0.9), cy + 47, 120, color, (1 - prog(lt, 0.6, 1.4)) * 1.2);
    // CN title: masked rise
    const cp = ease.outExpo(prog(lt, 0.2, 1.1));
    ctx.save(); ctx.beginPath(); ctx.rect(0, cy - 150, W, 190); ctx.clip();
    text(ctx, cn, W / 2, cy - 40 + (1 - cp) * 170, { size: 136, weight: 900, font: F.cn, color: "#fff", ls: 18 });
    ctx.restore();
    // EN: decode
    text(ctx, decode(en, prog(lt, 0.5, 1.6), num.charCodeAt(1)), W / 2, cy + 100, { size: 40, weight: 300, font: F.en, color, ls: 22 });
    text(ctx, `CHAPTER ${num}`, W / 2, cy - 178, { size: 20, weight: 600, font: F.mono, color: hexA(color, 0.9), ls: 10, alpha: prog(lt, 0.4, 1.0) });
    ctx.restore();
  }

  // ------------------------------------------------------------ subtitles
  function subtitles(ctx, t) {
    for (const [a, b, cn, en] of window.SUBS) {
      if (t < a - 0.01 || t > b + 0.01) continue;
      const fi = ease.out(prog(t, a, a + 0.28)), fo = 1 - ease.in(prog(t, b - 0.3, b));
      const al = fi * fo, dy = (1 - fi) * 14;
      ctx.save();
      const g = ctx.createLinearGradient(0, H - 230, 0, H);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.6, "rgba(0,0,0,0.5)"); g.addColorStop(1, "rgba(0,0,0,0.62)");
      ctx.globalAlpha = al; ctx.fillStyle = g; ctx.fillRect(0, H - 230, W, 230);
      ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 8;
      text(ctx, cn, W / 2, H - 118 + dy, { size: 44, weight: 500, font: F.cn, color: "#ffffff", alpha: al, ls: 3 });
      text(ctx, en, W / 2, H - 66 + dy, { size: 27, weight: 400, font: F.en, color: "#bfe4ff", alpha: al * 0.92, ls: 1 });
      ctx.restore();
    }
  }

  // ------------------------------------------------------------ HUD
  const CHAPTERS = [
    [24, 56, "01", "ARRAY"], [56, 84, "02", "LINKED LIST"], [84, 112, "03", "STACK & QUEUE"], [112, 144, "04", "HASH TABLE"],
    [144, 180, "05", "TREE"], [180, 200, "06", "HEAP"], [200, 240, "07", "GRAPH"], [240, 276, "08", "COMPLEXITY"],
  ];
  DS.CHAPTERS = CHAPTERS;
  function hud(ctx, t) {
    const ch = CHAPTERS.find((c) => t >= c[0] && t < c[1]);
    const a = ch ? 0.75 * prog(t, ch[0] + 3.4, ch[0] + 4.2) * (1 - prog(t, ch[1] - 0.6, ch[1])) : 0;
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    const m = 54, L = 34; ctx.strokeStyle = "rgba(190,220,255,0.55)"; ctx.lineWidth = 2;
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke();
    }
    text(ctx, `DS//POV   CH.${ch[2]}  ${ch[3]}`, m + 18, m + 26, { size: 18, weight: 600, font: F.mono, color: "#cfe3ff", align: "left", ls: 3 });
    const fr = Math.floor((t % 1) * 30), s = Math.floor(t);
    const tc = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(fr).padStart(2, "0")}`;
    text(ctx, `${tc}   120 BPM`, W - m - 18, m + 26, { size: 18, weight: 600, font: F.mono, color: "#cfe3ff", align: "right", ls: 3 });
    const kp = pulse(E.kicks, t, 0.12);
    ctx.fillStyle = hexA(C.red, 0.5 + kp * 0.5); ctx.beginPath(); ctx.arc(W - m - 18 - 290, m + 25, 6, 0, 7); ctx.fill();
    // film progress
    ctx.fillStyle = "rgba(190,220,255,0.18)"; ctx.fillRect(m + 18, H - m - 8, 260, 3);
    ctx.fillStyle = "rgba(190,220,255,0.8)"; ctx.fillRect(m + 18, H - m - 8, 260 * (t / DUR), 3);
    ctx.restore();
  }

  // ------------------------------------------------------------ post FX
  let bloomA, bloomB, tmpC;
  function post(ctx, t, opts) {
    const cv = ctx.canvas;
    if (!bloomA) { bloomA = mkCanvas(W / 4, H / 4); bloomB = mkCanvas(W / 8, H / 8); tmpC = mkCanvas(W, H); }
    // bloom (thresholded via contrast/brightness)
    const a = bloomA.getContext("2d"), b = bloomB.getContext("2d");
    a.globalCompositeOperation = "copy"; a.filter = "contrast(2.2) brightness(0.65) blur(3px)"; a.drawImage(cv, 0, 0, W / 4, H / 4); a.filter = "none";
    b.globalCompositeOperation = "copy"; b.filter = "blur(4px)"; b.drawImage(bloomA, 0, 0, W / 8, H / 8); b.filter = "none";
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55 * (opts.bloom ?? 1); ctx.drawImage(bloomA, 0, 0, W, H);
    ctx.globalAlpha = 0.75 * (opts.bloom ?? 1); ctx.drawImage(bloomB, 0, 0, W, H);
    ctx.restore();
  }
  function glitch(ctx, t, amt, seed) {
    if (amt <= 0.01) return;
    const cv = ctx.canvas, g = tmpC.getContext("2d");
    g.globalCompositeOperation = "copy"; g.drawImage(cv, 0, 0);
    const r = rng(seed + Math.floor(t * 24));
    const n = 14;
    for (let i = 0; i < n; i++) {
      const y = Math.floor(r() * H), h = Math.floor(8 + r() * 90), dx = (r() - 0.5) * 260 * amt;
      ctx.drawImage(tmpC, 0, y, W, h, dx, y, W, h);
    }
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.35 * amt;
    ctx.filter = "hue-rotate(-60deg)"; ctx.drawImage(tmpC, 14 * amt, 0); ctx.filter = "hue-rotate(120deg)"; ctx.drawImage(tmpC, -14 * amt, 0);
    ctx.filter = "none"; ctx.restore();
  }
  function motionBlur(ctx, amt, dir = 1) {
    if (amt <= 0.01) return;
    const cv = ctx.canvas, g = tmpC.getContext("2d");
    g.globalCompositeOperation = "copy"; g.drawImage(cv, 0, 0);
    ctx.save(); ctx.globalAlpha = 0.22;
    for (let k = 1; k <= 7; k++) ctx.drawImage(tmpC, dir * k * 46 * amt, 0);
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const r = rng(99);
    for (let i = 0; i < 70; i++) {
      const y = r() * H, len = 300 + r() * 900, x = r() * W;
      ctx.globalAlpha = amt * 0.25 * r(); ctx.fillStyle = "#cfe8ff"; ctx.fillRect(x - len / 2, y, len, 1 + r() * 2);
    }
    ctx.restore();
  }
  function vignette(ctx, strength = 0.75) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function scanlines(ctx, a = 0.05) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#000";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    ctx.restore();
  }
  function letterbox(ctx, amt) { if (amt <= 0) return; const h = amt * 120; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); }

  // ------------------------------------------------------------ master render
  const IMPACTS = E.impacts;
  const GLITCH_AT = [24, 112, 240];
  function render(ctx, t) {
    t = clamp(t, 0, DUR - 1e-4);
    ctx.save();
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.filter = "none";
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    // camera shake on impacts
    const si = since(IMPACTS, t); const shake = si < 0.7 ? Math.pow(1 - si / 0.7, 2) * 14 : 0;
    const kp = pulse(E.kicks, t, 0.16);
    ctx.save();
    ctx.translate(W / 2 + Math.sin(t * 91) * shake, H / 2 + Math.cos(t * 77) * shake);
    const z = 1 + kp * 0.006; ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    let opts = {};
    for (const sc of DS.scenes) {
      if (t >= sc.t0 - (sc.pre || 0) && t < sc.t1 + (sc.post || 0)) {
        ctx.save(); const o = sc.draw(ctx, t - sc.t0, t) || {}; ctx.restore(); Object.assign(opts, o);
      }
    }
    ctx.restore();
    // chapter cards (rendered before bloom so they glow)
    for (const [t0, , num] of CHAPTERS) {
      const sc = DS.scenes.find((s) => s.t0 === t0);
      if (sc && sc.card) chapterCard(ctx, t - t0, num, sc.card[0], sc.card[1], sc.card[2]);
    }
    post(ctx, t, opts);
    // transitions: impact flash
    if (si < 0.5) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.pow(1 - si / 0.5, 3) * (opts.flash ?? 0.42); ctx.fillStyle = "#e9f7ff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    for (const g of GLITCH_AT) { const d = Math.abs(t - g); if (d < 0.35) glitch(ctx, t, Math.pow(1 - d / 0.35, 1.5), g); }
    // whip pan between linked list and stack/queue
    { const d = t - 84; if (d > -0.45 && d < 0.4) motionBlur(ctx, 1 - Math.abs(d) / 0.45, d < 0 ? -1 : 1); }
    if (opts.extra) opts.extra(ctx);
    vignette(ctx, 0.72);
    scanlines(ctx, 0.045);
    letterbox(ctx, opts.letterbox ?? 0);
    hud(ctx, t);
    subtitles(ctx, t);
    // global fade in/out
    const fade = Math.max(1 - prog(t, 0, 0.6), prog(t, DUR - 3.2, DUR - 0.4));
    if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }

  Object.assign(DS, { clamp, lerp, prog, ease, rng, hash1, pulse, since, lastIdx, C, F, hexA, mix, mkCanvas, glow, bitSprite, text, decode, rrect, neonBox, neonLine,
    bez, bezPts, arrowHead, ring, badge, cam3, starfield, gridFloor, bgFill, hexRain, render, E });
})();
