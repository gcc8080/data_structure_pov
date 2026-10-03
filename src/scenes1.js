// Scenes 1 — Genesis, Title, Array, Linked List
(function () {
  const { W, H, C, F, E, clamp, lerp, prog, ease, rng, hash1, pulse, since, hexA, mix, glow, bitSprite, text, decode, neonBox, neonLine,
    bezPts, arrowHead, ring, badge, cam3, starfield, gridFloor, bgFill, hexRain } = DS;

  // keyframe interpolation: [[time, {k:v}, easeFn?], ...]
  function kf(lt, keys) {
    if (lt <= keys[0][0]) return { ...keys[0][1] };
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, a] = keys[i], [t1, b, fn] = keys[i + 1];
      if (lt < t1) { const p = (fn || ease.io)(prog(lt, t0, t1)); const o = {}; for (const k in b) o[k] = lerp(a[k] ?? b[k], b[k], p); for (const k in a) if (!(k in o)) o[k] = a[k]; return o; }
    }
    return { ...keys[keys.length - 1][1] };
  }
  DS.kf = kf;

  // ---------------------------------------------------------------- bit galaxy (shared by intro & outro)
  const NB = 1100;
  const BITS = (() => {
    const r = rng(42), a = [];
    for (let i = 0; i < NB; i++) {
      const arm = i % 3, rad = 40 + Math.pow(r(), 0.7) * 950;
      const ang = arm * (Math.PI * 2 / 3) + rad * 0.0062 + (r() - 0.5) * 0.7;
      a.push({ x: Math.cos(ang) * rad, z: Math.sin(ang) * rad, y: (r() - 0.5) * 90 * (1.2 - rad / 1000), rad, ch: r() > 0.5 ? "1" : "0", ph: r(), d: r() });
    }
    a.sort((p, q) => p.rad - q.rad);
    return a;
  })();
  const introBells = E.bells.filter((b) => b < 16);

  function bitGalaxy(ctx, lt, t, { cam, spawn, colorA = C.cyan, colorB = "#ffffff", lattice = 0, latticeT = 0, collapse = 0, alpha = 1 }) {
    const pts = [];
    for (let i = 0; i < NB; i++) {
      const b = BITS[i];
      const born = spawn(i); if (lt < born) continue;
      let p = cam(b.x, b.y, b.z); if (!p) continue;
      let x = p.x, y = p.y, s = p.s;
      if (lattice > 0 && i < 720) {
        const col = i % 36, row = Math.floor(i / 36);
        const lx = W / 2 + (col - 17.5) * 46, ly = H / 2 + (row - 9.5) * 46;
        const q = ease.io(clamp((lattice - b.d * 0.35) / 0.65));
        x = lerp(x, lx, q); y = lerp(y, ly, q); s = lerp(s, 0.62, q);
      } else if (lattice > 0) { s *= 1 - clamp(lattice * 1.5); }
      if (collapse > 0) { const q = ease.inExpo(clamp(collapse * (1 + b.d * 0.3))); x = lerp(x, W / 2, q); y = lerp(y, H / 2, q); s *= 1 - q * 0.7; }
      const fa = clamp((lt - born) / 0.35) * alpha * clamp(s * 1.6);
      pts.push([x, y, s, fa, b, i, born]);
    }
    for (const [x, y, s, fa, b, i, born] of pts) {
      const flip = hash1(i + Math.floor(t * 1.5 + b.ph * 10)) > 0.9 ? (b.ch === "1" ? "0" : "1") : b.ch;
      const col = b.ph > 0.82 ? colorB : colorA;
      const sz = 22 * s;
      ctx.globalAlpha = fa * (0.45 + 0.55 * b.d);
      ctx.drawImage(bitSprite(flip, col), x - sz * 0.4, y - sz * 0.5, sz * 0.8, sz);
      const age = lt - born;
      if (age < 1.2 && i < introBells.length) { glow(ctx, x, y, 90 * (1 - age / 1.2) + 20, col, (1 - age / 1.2)); ring(ctx, x, y, 10 + age * 120, col, (1 - age / 1.2) * 0.8, 1.5); }
    }
    ctx.globalAlpha = 1;
  }
  DS.bitGalaxy = bitGalaxy;

  // ================================================================ 0 — GENESIS (0–16)
  DS.scenes.push({
    t0: 0, t1: 16,
    draw(ctx, lt, t) {
      bgFill(ctx, mix("#050816", "#0b1440", prog(lt, 4, 14)));
      starfield(ctx, t, { drift: 6, a: prog(lt, 2, 8) * 0.8 });
      const b0 = BITS[0];
      const c = kf(lt, [[0, { dist: 90, pitch: 0.05, yaw: 0, tx: b0.x, ty: b0.y, tz: b0.z }], [3, { dist: 260, pitch: 0.2, yaw: 0.15, tx: b0.x * 0.6, ty: 0, tz: b0.z * 0.6 }, ease.io], [11, { dist: 1500, pitch: 0.95, yaw: 1.1, tx: 0, ty: 0, tz: 0 }, ease.io], [16, { dist: 1700, pitch: 1.05, yaw: 1.5, tx: 0, ty: 0, tz: 0 }]]);
      const cam = cam3({ ...c, fov: 900 });
      const spawn = (i) => (i < introBells.length ? introBells[i] : 4 + 7.5 * Math.pow((i - introBells.length) / (NB - introBells.length), 0.8));
      const lattice = prog(lt, 11, 13.6), collapse = prog(lt, 14.6, 16);
      // memory grid behind lattice
      const ga = prog(lt, 12.6, 13.6) * (1 - collapse);
      if (ga > 0) {
        ctx.save(); ctx.globalAlpha = ga * 0.35; ctx.strokeStyle = C.cyan; ctx.lineWidth = 1;
        for (let cI = 0; cI <= 36; cI++) { const x = W / 2 + (cI - 18) * 46; ctx.beginPath(); ctx.moveTo(x, H / 2 - 460); ctx.lineTo(x, H / 2 + 460); ctx.stroke(); }
        for (let r = 0; r <= 20; r++) { const y = H / 2 + (r - 10) * 46; ctx.beginPath(); ctx.moveTo(W / 2 - 828, y); ctx.lineTo(W / 2 + 828, y); ctx.stroke(); }
        ctx.restore();
        // scanning row highlight
        const sy = H / 2 + (((lt - 12.6) * 14) % 20 - 10) * 46;
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = ga * 0.25; ctx.fillStyle = C.cyan; ctx.fillRect(W / 2 - 828, sy, 1656, 46); ctx.restore();
      }
      bitGalaxy(ctx, lt, t, { cam, spawn, lattice, collapse, colorA: mix(C.cyan, C.violet, prog(lt, 8, 14)) });
      // core glow building to the flash
      glow(ctx, W / 2, H / 2, 200 + collapse * 900, "#bfefff", ease.in(collapse) * 1.4);
      glow(ctx, W / 2, H / 2, 60 + collapse * 200, "#ffffff", ease.in(collapse) * 1.5);
      return { letterbox: 1 - prog(lt, 10, 16) };
    },
  });

  // ================================================================ TITLE (16–24)
  const BURST = (() => { const r = rng(5), a = []; for (let i = 0; i < 420; i++) a.push([r() * Math.PI * 2, 400 + r() * 1700, r(), r()]); return a; })();
  DS.scenes.push({
    t0: 16, t1: 24,
    draw(ctx, lt, t) {
      bgFill(ctx, "#1a0f45", "#03040c");
      starfield(ctx, t, { drift: 30, a: 0.8 });
      const cx = W / 2, cy = H / 2 - 30;
      // light rays
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(cx, cy); ctx.rotate(lt * 0.06);
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2, w = 0.025 + 0.02 * hash1(i);
        const g = ctx.createLinearGradient(0, 0, Math.cos(a) * 1200, Math.sin(a) * 1200);
        const col = i % 3 === 0 ? C.magenta : i % 3 === 1 ? C.cyan : C.violet;
        g.addColorStop(0, hexA(col, 0.22 * (1 - prog(lt, 0, 6) * 0.5))); g.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1300, a - w, a + w); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      // orbits
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let k = 0; k < 3; k++) {
        const rot = k * 1.05 + lt * 0.12, rx = 620 + k * 90, ry = 150 + k * 40, col = [C.cyan, C.magenta, C.amber][k];
        const oa = prog(lt, 0.6 + k * 0.3, 2 + k * 0.3) * 0.5;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.globalAlpha = oa; ctx.strokeStyle = col; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        for (let n = 0; n < 3; n++) { const a = lt * (0.6 + k * 0.2) + n * 2.1; glow(ctx, Math.cos(a) * rx, Math.sin(a) * ry, 26, col, oa * 2); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(Math.cos(a) * rx, Math.sin(a) * ry, 3.5, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      ctx.restore();
      // particle burst
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const [a, v, c, d] of BURST) {
        const k = 1.8, r = (v * (1 - Math.exp(-k * lt))) / k, r0 = r * (0.86 - 0.2 * Math.exp(-lt * 3));
        const al = Math.exp(-lt * (0.5 + d)) * 0.9; if (al < 0.01) continue;
        ctx.strokeStyle = c > 0.66 ? C.magenta : c > 0.33 ? C.cyan : "#ffffff"; ctx.globalAlpha = al; ctx.lineWidth = 1 + d * 2;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke();
      }
      ctx.restore();
      for (let k = 0; k < 2; k++) { const p = prog(lt, k * 0.12, 1.4 + k * 0.4); ring(ctx, cx, cy, p * 1300, k ? C.magenta : "#ffffff", (1 - p) * 0.9, 6 - k * 3); }
      // title lockup
      const outP = ease.in(prog(lt, 7.1, 8));
      ctx.save(); ctx.translate(cx, cy); const sc = 1 + outP * 0.18 + lt * 0.008; ctx.scale(sc, sc);
      const ta = prog(lt, 0.05, 0.6) * (1 - outP);
      const ls = lerp(90, 34, ease.outExpo(prog(lt, 0, 3)));
      ctx.font = `900 210px ${F.cn}`; ctx.letterSpacing = ls + "px";
      const tw = ctx.measureText("数据结构").width;
      const gr = ctx.createLinearGradient(-tw / 2, 0, tw / 2, 0);
      const sh = (lt * 0.25) % 1;
      gr.addColorStop(0, C.cyan); gr.addColorStop(clamp(0.35 + sh * 0.3), "#ffffff"); gr.addColorStop(0.7, C.violet); gr.addColorStop(1, C.magenta);
      text(ctx, "数据结构", ls / 2, 0, { size: 210, weight: 900, font: F.cn, color: gr, alpha: ta, ls });
      text(ctx, decode("DATA STRUCTURES", prog(lt, 0.4, 2.0), 11), 0, -175, { size: 54, weight: 300, font: F.en, color: "#dff4ff", alpha: ta, ls: 30 });
      const lp = ease.outExpo(prog(lt, 1.2, 2.4));
      ctx.globalAlpha = ta; ctx.fillStyle = C.cyan; ctx.fillRect(-380 * lp, 150, 760 * lp, 2);
      text(ctx, "思想的建筑学  ·  THE ARCHITECTURE OF THOUGHT", 0, 200, { size: 28, weight: 400, font: F.cn, color: "#c9d8ff", alpha: ta * prog(lt, 1.6, 2.6), ls: 8 });
      ctx.restore();
      return { flash: 0.9 };
    },
  });

  // ================================================================ 01 ARRAY (24–56)
  const ARR_VALS = [7, 23, 4, 42, 15, 8, 16, 31, 9, 12, 5, 27];
  const SLOTX = (s) => (s - 6) * 140;
  function boxFaces(P, cx, cy, cz, w, h, d) {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    const v = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].map((q) => P(...q));
    if (v.some((q) => !q)) return null;
    const faces = [[0, 1, 2, 3, 0.16], [4, 5, 1, 0, 0.3], [1, 5, 6, 2, 0.1], [4, 0, 3, 7, 0.1], [5, 4, 7, 6, 0.05], [3, 2, 6, 7, 0.05]];
    return faces.map((f) => ({ pts: f.slice(0, 4).map((i) => v[i]), shade: f[4], z: (v[f[0]].z + v[f[1]].z + v[f[2]].z + v[f[3]].z) / 4 })).sort((a, b) => b.z - a.z);
  }
  function drawBox(ctx, P, cx, cy, cz, sz, color, a, glowAmt = 0) {
    const fs = boxFaces(P, cx, cy, cz, sz, sz, sz); if (!fs) return null;
    ctx.save(); ctx.globalAlpha *= a;
    for (const f of fs) {
      ctx.beginPath(); ctx.moveTo(f.pts[0].x, f.pts[0].y); for (let i = 1; i < 4; i++) ctx.lineTo(f.pts[i].x, f.pts[i].y); ctx.closePath();
      ctx.fillStyle = hexA(color, f.shade + glowAmt * 0.35); ctx.fill();
      ctx.strokeStyle = hexA(color, 0.75 + glowAmt * 0.25); ctx.lineWidth = 1.6; ctx.stroke();
    }
    ctx.restore();
    return P(cx, cy, cz - sz / 2);
  }
  DS.scenes.push({
    t0: 24, t1: 56, card: ["数组", "ARRAY", C.cyan],
    draw(ctx, lt, t) {
      bgFill(ctx, "#06142e", "#02040b");
      const kp = pulse(E.kicks, t, 0.2);
      starfield(ctx, t, { drift: 8, a: 0.5 });
      hexRain(ctx, t, C.cyan, 0.08 * prog(lt, 2, 5) * (1 - prog(lt, 30, 32)), 11);
      const c = kf(lt, [
        [0, { yaw: -0.75, pitch: 0.34, dist: 1900, tx: 0, ty: 60, tz: 0, roll: 0.04 }],
        [8, { yaw: -0.32, pitch: 0.3, dist: 1380, tx: -60, ty: 60, tz: 0, roll: 0 }],
        [15, { yaw: -0.14, pitch: 0.28, dist: 1300, tx: 40, ty: 30, tz: 0, roll: 0 }],
        [20, { yaw: 0.1, pitch: 0.3, dist: 1280, tx: 60, ty: -10, tz: 0, roll: -0.02 }],
        [26, { yaw: 0.05, pitch: 0.42, dist: 1450, tx: -100, ty: -20, tz: 0, roll: 0 }],
        [30.4, { yaw: 0.35, pitch: 0.95, dist: 3600, tx: 0, ty: 0, tz: 0, roll: 0.1 }],
        [32, { yaw: 0.05, pitch: 0.5, dist: 30, tx: SLOTX(3), ty: 0, tz: -60, roll: 0.4 }, ease.inExpo],
      ]);
      const P = cam3({ ...c, fov: 1150, cy: H / 2 + 20 });
      gridFloor(ctx, t, C.cyan, 0.35 * prog(lt, 1, 4) * (1 - prog(lt, 26, 29)), { beat: kp * 0.6, speed: 40 });
      const memA = ease.out(prog(lt, 26, 28.5));
      // memory grid (pull-back)
      if (memA > 0) {
        for (let r = -7; r <= 7; r++) {
          if (r === 0) continue;
          const ra = clamp(memA * 1.6 - Math.abs(r) * 0.08);
          for (let s = 0; s < 13; s++) {
            const x = SLOTX(s), z = r * 150;
            const wave = Math.exp(-Math.pow((x + z * 0.6) / 140 - ((lt - 26) * 6 - 10), 2) / 3);
            const fs = boxFaces(P, x, 0, z, 110, 110, 110); if (!fs) continue;
            const top = fs.find((f) => f.shade === 0.3);
            ctx.beginPath(); ctx.moveTo(top.pts[0].x, top.pts[0].y); for (let i = 1; i < 4; i++) ctx.lineTo(top.pts[i].x, top.pts[i].y); ctx.closePath();
            ctx.fillStyle = hexA(wave > 0.3 ? C.violet : C.cyan, ra * (0.06 + wave * 0.4)); ctx.fill();
            ctx.strokeStyle = hexA(C.cyan, ra * (0.35 + wave * 0.6)); ctx.lineWidth = 1.2; ctx.stroke();
          }
        }
      }
      // cells
      const cells = [];
      for (let i = 0; i < 12; i++) {
        const app = 3 + i * 0.25; if (lt < app) continue;
        const ts = 21.2 + (11 - i) * 0.25;
        const sh = i >= 3 ? ease.out(prog(lt, ts, ts + 0.32)) : 0;
        const ap = ease.outBack(prog(lt, app, app + 0.45));
        cells.push({ i, slot: i + sh, y: -(1 - ap) * 260, a: prog(lt, app, app + 0.2), v: ARR_VALS[i], moving: sh > 0 && sh < 1, sh, ts });
      }
      if (lt >= 20.5) {
        const dp = ease.outBounce(prog(lt, 23.6, 24.3));
        cells.push({ i: 99, slot: 3, y: lerp(-320 + Math.sin(lt * 3) * 12, 0, dp), a: prog(lt, 20.5, 20.9), v: 99, isNew: true, dp });
      }
      const order = cells.map((cl) => ({ cl, z: (P(SLOTX(cl.slot), cl.y, 0) || { z: 1e9 }).z })).sort((a, b) => b.z - a.z);
      const queryA = prog(lt, 10.5, 10.6) * (1 - prog(lt, 15, 16));
      for (const { cl } of order) {
        const x = SLOTX(cl.slot);
        let col = cl.isNew ? C.magenta : C.cyan, g = 0, a = cl.a;
        if (queryA > 0 && !cl.isNew) { if (cl.i === 7) { g = 1; col = "#7ff6ff"; } else a *= 1 - queryA * 0.6; }
        if (lt > 15 && lt < 21 && cl.i === 7) g = 0.5 + 0.5 * Math.sin(lt * 8);
        if (cl.moving) for (let k = 1; k <= 3; k++) drawBox(ctx, P, x - k * 26, cl.y, 0, 110, C.amber, a * 0.18 / k);
        if (cl.moving) col = C.amber;
        const fc = drawBox(ctx, P, x, cl.y, 0, 110, col, a, g + (cl.isNew ? 0.4 : 0));
        if (!fc) continue;
        text(ctx, String(cl.v), fc.x, fc.y, { size: 52 * fc.s, weight: 700, font: F.mono, color: "#fff", alpha: a });
        if (cl.isNew && cl.dp < 1) glow(ctx, fc.x, fc.y, 150 * fc.s, C.magenta, 0.9 * a);
        if (cl.isNew && cl.dp >= 1) { const q = prog(lt, 24.3, 25.3); ring(ctx, fc.x, fc.y, q * 200, C.magenta, 1 - q, 3); }
        if (cl.i === 7 && queryA > 0) { const q = prog(lt, 10.5, 11.6); glow(ctx, fc.x, fc.y, 260 * fc.s, C.cyan, 1.2 * (1 - q * 0.6)); ring(ctx, fc.x, fc.y, q * 260, "#fff", 1 - q, 3); }
      }
      // slot labels: index + address (fixed to slots)
      const lblA = prog(lt, 5, 6.5) * (1 - memA);
      for (let s = 0; s < 13; s++) {
        if (s === 12 && lt < 21.2) continue;
        const pb = P(SLOTX(s), 95, -55), pa = P(SLOTX(s), -92, -55); if (!pb || !pa) continue;
        const hi = s === 7 && lt > 16.8 && lt < 21;
        text(ctx, `[${s}]`, pb.x, pb.y, { size: 26 * pb.s, weight: 500, font: F.mono, color: hi ? "#fff" : C.cyan, alpha: lblA * 0.9 });
        const ad = "0x" + (0x1000 + s * 4).toString(16).toUpperCase();
        text(ctx, ad, pa.x, pa.y, { size: 19 * pa.s, weight: 500, font: F.mono, color: hi ? C.amber : "#7fa7d9", alpha: lblA * (hi ? 1 : 0.75) });
      }
      // query: CPU chip + laser
      const qa = prog(lt, 9.4, 9.9) * (1 - prog(lt, 15.5, 16.5));
      if (qa > 0) {
        const cp = P(-1080, 260, -120);
        if (cp) {
          neonBox(ctx, cp.x - 90 * cp.s, cp.y - 50 * cp.s, 180 * cp.s, 100 * cp.s, C.cyan, qa, { r: 8, fill: 0.2 });
          text(ctx, "CPU", cp.x, cp.y, { size: 34 * cp.s, weight: 800, font: F.mono, color: "#fff", alpha: qa, ls: 4 });
          text(ctx, decode("arr[7]", prog(lt, 9.6, 10.4), 3), cp.x, cp.y - 95 * cp.s, { size: 46 * cp.s, weight: 700, font: F.mono, color: C.cyan, alpha: qa });
          const tgt = P(SLOTX(7), -55, 0);
          const lp = prog(lt, 10.5, 10.62);
          if (lp > 0 && tgt) {
            const fadeL = 1 - prog(lt, 11.2, 14);
            neonLine(ctx, [[cp.x, cp.y - 50 * cp.s], [lerp(cp.x, tgt.x, lp), lerp(cp.y - 50 * cp.s, tgt.y, lp)]], C.cyan, qa * (0.35 + fadeL * 0.65), 4);
            glow(ctx, tgt.x, tgt.y, 160, "#fff", (1 - prog(lt, 10.6, 11.4)) * 1.2);
          }
        }
        if (lt > 11) badge(ctx, W / 2 + 330, 250, "O(1)", C.cyan, lt - 11, { sub: "ONE STEP · 一步直达" });
      }
      // formula panel
      const fa = prog(lt, 15.2, 15.8) * (1 - prog(lt, 20.2, 20.8));
      if (fa > 0) {
        ctx.save(); ctx.globalAlpha = fa;
        neonBox(ctx, W / 2 - 520, 120, 1040, 190, C.cyan, 0.9, { r: 18, fill: 0.08, lw: 1.5 });
        text(ctx, "address = base + index × size", W / 2, 180, { size: 44, weight: 500, font: F.mono, color: "#dff7ff" });
        const l2 = decode("0x1000 + 7 × 4 = 0x101C", prog(lt, 16.2, 17.2), 8);
        text(ctx, l2, W / 2, 255, { size: 50, weight: 800, font: F.mono, color: C.cyan, ls: 1 });
        ctx.restore();
      }
      // insertion HUD
      const ia = prog(lt, 20.6, 21) * (1 - prog(lt, 26, 26.8));
      if (ia > 0) {
        const moved = Array.from({ length: 9 }, (_, k) => lt >= 21.2 + k * 0.25 + 0.3).filter(Boolean).length;
        text(ctx, "insert(3, 99)", W / 2, 150, { size: 46, weight: 700, font: F.mono, color: C.magenta, alpha: ia });
        text(ctx, `shift × ${moved}`, W / 2, 210, { size: 34, weight: 600, font: F.mono, color: C.amber, alpha: ia * prog(lt, 21.2, 21.4), ls: 3 });
        if (lt > 24.3) badge(ctx, W / 2 + 420, 180, "O(n)", C.amber, lt - 24.3, { sub: "EVERYONE MOVES · 全员挪位" });
      }
      // dive-through
      const dv = prog(lt, 31, 32);
      if (dv > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = ease.in(dv); ctx.fillStyle = "#9feeff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      return {};
    },
  });

  // ================================================================ 02 LINKED LIST (56–84)
  const LL = (() => {
    const ys = [0, -230, 150, -120, 210, -60, 170, -190], vals = [12, 7, 33, 18, 5, 27, 64, 42], r = rng(31);
    const nodes = ys.map((y, k) => ({ x: -1750 + k * 500, y, v: vals[k], addr: "0x" + Math.floor(0x1000 + r() * 0xEFFF).toString(16).toUpperCase() }));
    const nw = { x: (nodes[3].x + nodes[4].x) / 2, y: 360, v: 99, addr: "0x" + Math.floor(0x1000 + r() * 0xEFFF).toString(16).toUpperCase() };
    return { nodes, nw };
  })();
  const NODE_W = 190, NODE_H = 72;
  function drawNode(ctx, n, col, a, sc = 1, hi = 0) {
    if (a <= 0.003) return;
    ctx.save(); ctx.translate(n.x, n.y); ctx.scale(sc, sc);
    neonBox(ctx, -NODE_W / 2, -NODE_H / 2, NODE_W, NODE_H, col, a, { r: 14, fill: 0.14 + hi * 0.4, lw: 2.5 });
    ctx.globalAlpha = a; ctx.strokeStyle = hexA(col, 0.8); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(NODE_W / 2 - 64, -NODE_H / 2 + 8); ctx.lineTo(NODE_W / 2 - 64, NODE_H / 2 - 8); ctx.stroke();
    text(ctx, String(n.v), -30, 2, { size: 40, weight: 800, font: F.mono, color: "#fff" });
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(NODE_W / 2 - 32, 0, 8, 0, 7); ctx.fill();
    text(ctx, n.addr, 0, -NODE_H / 2 - 20, { size: 17, weight: 500, font: F.mono, color: "#9fb4e8", alpha: 0.8 });
    if (hi > 0) glow(ctx, 0, 0, 180, col, hi);
    ctx.restore();
  }
  function arrowPts(a, b, p = 1) {
    const p0 = [a.x + NODE_W / 2 - 32, a.y], p3 = [b.x - NODE_W / 2 - 6, b.y];
    const dx = Math.max(120, Math.abs(p3[0] - p0[0]) * 0.55);
    return bezPts(p0, [p0[0] + dx, p0[1]], [p3[0] - dx, p3[1]], p3, 0, p, 30);
  }
  function drawArrow(ctx, a, b, p, col, al = 1, flowT = null) {
    if (p <= 0) return;
    const pts = arrowPts(a, b, p);
    neonLine(ctx, pts, col, al, 2.5);
    if (p >= 1) { const e = pts[pts.length - 1], q = pts[pts.length - 3]; arrowHead(ctx, e[0], e[1], Math.atan2(e[1] - q[1], e[0] - q[0]), 18, col, al); }
    if (flowT != null && p >= 1) { const f = pts[Math.floor(((flowT % 1) + 1) % 1 * (pts.length - 1))]; glow(ctx, f[0], f[1], 30, "#fff", al * 0.9); }
  }
  DS.scenes.push({
    t0: 56, t1: 84, card: ["链表", "LINKED LIST", C.magenta],
    draw(ctx, lt, t) {
      bgFill(ctx, "#1a0a2a", "#03030a");
      starfield(ctx, t, { drift: -10, a: 0.5, color: "#ffc4ef" });
      const { nodes, nw } = LL;
      const hopT = (k) => 9 + k * 0.75;
      // traveler position
      let tx = nodes[0].x, ty = nodes[0].y;
      if (lt > 8.6) {
        const k = clamp(Math.floor((lt - 9) / 0.75), 0, 7), f = ease.io(prog(lt, hopT(k), hopT(k) + 0.5));
        const a = nodes[Math.max(0, k)], b = nodes[Math.min(7, k + 1)];
        if (lt < 9) { tx = nodes[0].x; ty = nodes[0].y; } else { const pts = arrowPts(a, b, 1), q = pts[Math.floor(f * (pts.length - 1))]; tx = k < 7 ? q[0] : a.x; ty = k < 7 ? q[1] : a.y; }
      }
      const cm = kf(lt, [
        [0, { cx: -900, cy: 0, z: 0.5, r: -0.06 }],
        [8.2, { cx: 0, cy: 0, z: 0.52, r: 0 }],
        [9.2, { cx: nodes[0].x + 250, cy: nodes[0].y * 0.5, z: 1.0, r: 0.02 }],
        [15.0, { cx: nodes[7].x - 150, cy: nodes[7].y * 0.5, z: 1.0, r: -0.02 }],
        [15.6, { cx: nw.x - 60, cy: 170, z: 1.0, r: 0 }],
        [20.6, { cx: nw.x - 60, cy: 150, z: 1.1, r: 0.015 }],
        [21.4, { cx: 60, cy: 40, z: 0.46, r: 0 }],
        [26.8, { cx: 200, cy: 40, z: 0.48, r: 0 }],
        [28, { cx: 2400, cy: 40, z: 0.6, r: 0.05 }, ease.inExpo],
      ]);
      let camX = cm.cx, camY = cm.cy;
      if (lt > 9.2 && lt < 15) { camX = lerp(cm.cx, tx + 120, 0.75); camY = lerp(cm.cy, ty * 0.6, 0.6); }
      ctx.save();
      ctx.translate(W / 2, H / 2); ctx.scale(cm.z, cm.z); ctx.rotate(cm.r); ctx.translate(-camX, -camY);
      // memory grid world
      const ga = prog(lt, 0.5, 3);
      ctx.save(); ctx.globalAlpha = ga * 0.16; ctx.strokeStyle = C.pink; ctx.lineWidth = 1 / cm.z;
      const g0x = Math.floor((camX - W / cm.z) / 80) * 80, g0y = Math.floor((camY - H / cm.z) / 80) * 80;
      for (let x = g0x; x < camX + W / cm.z; x += 80) { ctx.beginPath(); ctx.moveTo(x, camY - H / cm.z); ctx.lineTo(x, camY + H / cm.z); ctx.stroke(); }
      for (let y = g0y; y < camY + H / cm.z; y += 80) { ctx.beginPath(); ctx.moveTo(camX - W / cm.z, y); ctx.lineTo(camX + W / cm.z, y); ctx.stroke(); }
      ctx.restore();
      // twinkling occupied memory cells (noise)
      ctx.save(); const rr = rng(77);
      for (let i = 0; i < 90; i++) {
        const x = Math.floor((rr() * 4800 - 2400) / 80) * 80, y = Math.floor((rr() * 1600 - 800) / 80) * 80;
        ctx.globalAlpha = ga * 0.12 * (0.5 + 0.5 * Math.sin(t * 2 + i)); ctx.fillStyle = C.violet; ctx.fillRect(x + 2, y + 2, 76, 76);
      }
      ctx.restore();
      // list order (after insertion includes new node)
      const appear = (k) => 3 + k * 0.5;
      const inserted = lt >= 17.8;
      // arrows
      for (let k = 0; k < 7; k++) {
        const a0 = appear(k + 1) + 0.15; const p = ease.out(prog(lt, a0, a0 + 0.45));
        if (k === 3) {
          if (lt < 17.8) drawArrow(ctx, nodes[3], nodes[4], p, C.magenta, 1, lt * 1.2 - k * 0.2);
          else { // snapped: two fragments falling away
            const q = prog(lt, 17.8, 18.8); const pts = arrowPts(nodes[3], nodes[4], 1);
            ctx.save(); ctx.translate(0, q * q * 160); neonLine(ctx, pts.slice(0, 13), C.red, (1 - q) * 0.9, 2.5); ctx.restore();
            ctx.save(); ctx.translate(0, q * q * 220); neonLine(ctx, pts.slice(17), C.red, (1 - q) * 0.9, 2.5); ctx.restore();
            const sp = rng(4); const m = pts[15];
            for (let i = 0; i < 28; i++) { const an = sp() * 6.28, v = 200 + sp() * 400, dt = lt - 17.8; const x = m[0] + Math.cos(an) * v * dt, y = m[1] + Math.sin(an) * v * dt + 500 * dt * dt; glow(ctx, x, y, 14, i % 2 ? C.amber : "#fff", (1 - q) * 1.2); }
          }
        } else drawArrow(ctx, nodes[k], nodes[k + 1], p, C.magenta, 1, lt * 1.2 - k * 0.2);
      }
      if (lt > 17) drawArrow(ctx, nw, nodes[4], ease.out(prog(lt, 17, 17.5)), C.lime, 1, lt * 1.2);
      if (lt > 18) drawArrow(ctx, nodes[3], nw, ease.out(prog(lt, 18, 18.5)), C.lime, 1, lt * 1.2);
      // NULL
      const last = nodes[7], na = prog(lt, appear(7) + 0.3, appear(7) + 0.8);
      neonLine(ctx, [[last.x + NODE_W / 2 - 32, last.y], [last.x + 230, last.y]], C.magenta, na * 0.8, 2);
      text(ctx, "∅ NULL", last.x + 320, last.y, { size: 34, weight: 700, font: F.mono, color: "#ff9bd8", alpha: na });
      text(ctx, "HEAD", nodes[0].x, nodes[0].y + 75, { size: 22, weight: 700, font: F.mono, color: C.magenta, alpha: prog(lt, 3.2, 3.8), ls: 6 });
      // search probe order
      const order = [0, 1, 2, 3, "n", 4, 5, 6, 7];
      const sStep = (j) => 21.6 + j * 0.62;
      const curS = lt > 21.6 ? Math.min(8, Math.floor((lt - 21.6) / 0.62)) : -1;
      // nodes
      nodes.forEach((n, k) => {
        if (lt < appear(k)) return;
        const p = ease.outBack(prog(lt, appear(k), appear(k) + 0.4));
        const hop = lt > hopT(k) && lt < hopT(k) + 0.6 ? 1 - prog(lt, hopT(k), hopT(k) + 0.6) : 0;
        const j = order.indexOf(k), vis = curS >= j ? 1 - prog(lt, sStep(j), sStep(j) + 0.55) : 0;
        const found = k === 7 && lt > sStep(8);
        const flash = 1 - prog(lt, appear(k), appear(k) + 0.6);
        // memory cell flash beneath
        ctx.save(); ctx.globalAlpha = flash * 0.7; ctx.fillStyle = C.magenta; ctx.fillRect(n.x - 120, n.y - 60, 240, 120); ctx.restore();
        drawNode(ctx, n, found ? C.green : C.magenta, clamp(p), p, Math.max(hop, vis * 0.8, found ? 0.6 + 0.4 * Math.sin(lt * 10) : 0));
        if (curS >= j && lt > sStep(j) && !found && lt < 27.4) text(ctx, "≠ 42", n.x, n.y - 82, { size: 26, weight: 700, font: F.mono, color: "#ffb3c6", alpha: 0.85 * (1 - prog(lt, 27, 27.4)) });
      });
      if (lt > 15.4) {
        const p = ease.outBack(prog(lt, 15.4, 15.9));
        const j = 4, vis = curS >= j ? 1 - prog(lt, sStep(j), sStep(j) + 0.55) : 0;
        drawNode(ctx, { ...nw, y: nw.y + (1 - p) * -300 }, C.lime, clamp(p), Math.max(0.01, p), Math.max(1 - prog(lt, 15.4, 16.4), vis * 0.8));
        if (curS >= j && lt > sStep(j) && lt < 27.4) text(ctx, "≠ 42", nw.x, nw.y - 82, { size: 26, weight: 700, font: F.mono, color: "#ffb3c6", alpha: 0.85 * (1 - prog(lt, 27, 27.4)) });
      }
      // probe ring
      if (curS >= 0 && lt < 27.6) {
        const id = order[curS], n = id === "n" ? nw : nodes[id];
        const q = prog(lt, sStep(curS), sStep(curS) + 0.62);
        ring(ctx, n.x, n.y, 110 + q * 40, curS === 8 ? C.green : "#fff", (1 - q * 0.7) * (1 - prog(lt, 27, 27.6)), 3);
        if (curS === 8) { const f = prog(lt, sStep(8), sStep(8) + 1); ring(ctx, n.x, n.y, f * 420, C.green, 1 - f, 4); glow(ctx, n.x, n.y, 300, C.green, (1 - f) * 1.4); }
      }
      // traveler packet
      if (lt > 9 && lt < 15.2) { glow(ctx, tx, ty, 90, C.pink, 1.2); glow(ctx, tx, ty, 26, "#ffffff", 1.5); }
      ctx.restore();
      // screen-space HUD
      const ca = prog(lt, 16.6, 17) * (1 - prog(lt, 20.6, 21.2));
      if (ca > 0) {
        neonBox(ctx, 120, 140, 620, 150, C.lime, ca * 0.8, { r: 14, fill: 0.07, lw: 1.4 });
        text(ctx, "node.next = cur.next", 150, 190, { size: 34, weight: 600, font: F.mono, color: lt > 17 ? "#eaffd6" : "#5d6b80", align: "left", alpha: ca });
        text(ctx, "cur.next  = node", 150, 245, { size: 34, weight: 600, font: F.mono, color: lt > 18 ? "#eaffd6" : "#5d6b80", align: "left", alpha: ca });
        if (lt > 18.6) badge(ctx, W - 380, 210, "O(1)", C.lime, lt - 18.6, { sub: "REWIRE · 改指针" });
      }
      const sa = prog(lt, 21.4, 21.8) * (1 - prog(lt, 27.2, 27.8));
      if (sa > 0) {
        text(ctx, "find(42)", 160, 180, { size: 44, weight: 800, font: F.mono, color: C.pink, align: "left", alpha: sa });
        text(ctx, `steps: ${Math.max(0, curS + 1)}`, 160, 235, { size: 32, weight: 600, font: F.mono, color: "#ffd1ec", align: "left", alpha: sa, ls: 2 });
        if (lt > 26.8) badge(ctx, W - 380, 200, "O(n)", C.pink, lt - 26.8, { sub: "ONE BY ONE · 逐个寻找" });
      }
      return {};
    },
  });
})();
