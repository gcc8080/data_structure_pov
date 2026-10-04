// Scenes 2 — Stack & Queue, Hash Table, Tree
(function () {
  const { W, H, C, F, E, clamp, lerp, prog, ease, rng, hash1, pulse, since, hexA, mix, glow, text, decode, neonBox, neonLine,
    bezPts, arrowHead, ring, badge, cam3, starfield, gridFloor, bgFill, hexRain, kf } = DS;

  // ================================================================ 03 STACK & QUEUE (84–112)
  const SX = -430, QX0 = 120, QX1 = 960, SLAB_H = 70, BOT = 330;
  const STK = (() => {
    const ev = [["push", "main()", 4.0], ["push", "load()", 4.5], ["push", "parse()", 5.0], ["push", "eval()", 5.5], ["push", "add()", 6.0], ["push", "mul()", 6.5],
      ["pop", null, 7.5], ["pop", null, 8.0], ["push", "fetch()", 9.0], ["push", "render()", 9.5], ["pop", null, 11.0], ["pop", null, 11.5], ["pop", null, 12.0]];
    const items = [], st = [];
    for (const [ty, lab, t] of ev) {
      if (ty === "push") { const it = { lab, push: t, pop: Infinity, lvl: st.length }; items.push(it); st.push(it); }
      else st.pop().pop = t;
    }
    return { items, ev };
  })();
  const slabY = (lvl) => BOT - 8 - SLAB_H / 2 - lvl * (SLAB_H + 6);
  const QENQ = [14.6, 15.1, 15.6, 16.1, 16.6, 19.1, 20.1, 21.1, 22.1];
  const QDEQ = [17.6, 18.6, 19.6, 20.6, 21.6, 22.6];
  DS.scenes.push({
    t0: 84, t1: 112, card: ["栈与队列", "STACK & QUEUE", C.amber],
    draw(ctx, lt, t) {
      bgFill(ctx, "#1d1406", "#040306");
      starfield(ctx, t, { drift: 14, a: 0.45, color: "#ffe2b0" });
      const kp = pulse(E.kicks, t, 0.2);
      gridFloor(ctx, t, C.amber, 0.28, { horizon: H * 0.66, beat: kp * 0.5, speed: 70 });
      const cm = kf(lt, [
        [0, { cx: -1400, cy: 30, z: 0.84, r: 0.03 }],
        [0.5, { cx: SX + 40, cy: 30, z: 0.86, r: 0 }, ease.outExpo],
        [13.4, { cx: SX + 60, cy: 20, z: 0.9, r: 0 }],
        [14.6, { cx: 540, cy: -40, z: 0.95, r: 0 }, ease.ioExpo],
        [23.6, { cx: 540, cy: -40, z: 1.0, r: 0 }],
        [25, { cx: 120, cy: -60, z: 0.72, r: 0 }],
        [28, { cx: 160, cy: -60, z: 0.76, r: 0 }],
      ]);
      const swirl = ease.inExpo(prog(lt, 26.2, 28));
      ctx.save();
      ctx.translate(W / 2, H / 2); ctx.rotate(swirl * 2.2); ctx.scale(1 - swirl * 0.97, 1 - swirl * 0.97);
      ctx.scale(cm.z, cm.z); ctx.rotate(cm.r); ctx.translate(-cm.cx, -cm.cy);
      // ---------- STACK
      const ca = prog(lt, 1.5, 3);
      const bigOut = 1 - prog(lt, 24.2, 24.8);
      text(ctx, "LIFO", SX, -430, { size: 150, weight: 900, font: F.en, color: hexA(C.amber, 0.5), stroke: 2, ls: 20, alpha: ca * bigOut });
      text(ctx, "STACK · 栈", SX, -330, { size: 30, weight: 600, font: F.cn, color: C.amber, ls: 10, alpha: ca });
      const wall = [[SX - 200, -280], [SX - 200, BOT], [SX + 200, BOT], [SX + 200, -280]];
      const wp = ease.out(prog(lt, 1.5, 3.2));
      neonLine(ctx, wall.slice(0, 2).map((p, i) => i ? [p[0], lerp(-280, BOT, wp)] : p), C.amber, ca, 3.5);
      neonLine(ctx, [[SX - 200, BOT], [SX - 200 + 400 * wp, BOT]], C.amber, ca, 3.5);
      neonLine(ctx, [[SX + 200, -280], [SX + 200, lerp(-280, BOT, wp)]], C.amber, ca, 3.5);
      const lastPush = STK.ev.filter((e) => e[2] <= lt).pop();
      const flashE = lastPush ? 1 - prog(lt, lastPush[2], lastPush[2] + 0.45) : 0;
      glow(ctx, SX, BOT, 380, C.amber, 0.25 + flashE * 0.5);
      let topLvl = -1;
      for (const it of STK.items) {
        if (lt < it.push) continue;
        const y0 = slabY(it.lvl);
        let y = y0, a = 1;
        const dp = prog(lt, it.push, it.push + 0.38);
        y = lerp(-640, y0, ease.outBounce(dp));
        if (lt >= it.pop) { const pp = prog(lt, it.pop, it.pop + 0.5); y = lerp(y0, -760, ease.in(pp)); a = 1 - pp; }
        else topLvl = Math.max(topLvl, it.lvl);
        if (a <= 0) continue;
        const isTop = lt < it.pop && STK.items.every((o) => o === it || lt < o.push || lt >= o.pop || o.lvl < it.lvl);
        const col = it.lab === "fetch()" || it.lab === "render()" ? C.orange : C.amber;
        neonBox(ctx, SX - 180, y - SLAB_H / 2, 360, SLAB_H, col, a, { r: 10, fill: isTop ? 0.32 : 0.14, lw: 2.5 });
        text(ctx, it.lab, SX, y + 2, { size: 34, weight: 700, font: F.mono, color: "#fff", alpha: a });
        if (dp < 1) glow(ctx, SX, y, 160, col, 0.6 * (1 - dp));
        if (lt >= it.push + 0.38 && lt < it.push + 0.9) { const q = prog(lt, it.push + 0.38, it.push + 0.9); ctx.save(); ctx.globalAlpha = (1 - q) * 0.9; ctx.fillStyle = "#fff"; ctx.fillRect(SX - 180 - q * 40, y + SLAB_H / 2 - 1, 360 + q * 80, 2); ctx.restore(); }
        if (lt >= it.pop) text(ctx, `return ← ${it.lab}`, SX + 300, y, { size: 26, weight: 600, font: F.mono, color: C.amber, align: "left", alpha: a });
      }
      // TOP pointer (smoothly tracks)
      if (lt > 4) {
        const tgtY = topLvl >= 0 ? slabY(topLvl) : BOT;
        const prevEv = STK.ev.filter((e) => e[2] <= lt);
        let yy = tgtY;
        if (prevEv.length >= 2) { const e = prevEv[prevEv.length - 1]; const q = ease.out(prog(lt, e[2], e[2] + 0.35)); const prevTop = (() => { let m = -1; for (const it of STK.items) if (e[2] - 1e-4 >= it.push && e[2] - 1e-4 < it.pop) m = Math.max(m, it.lvl); return m; })(); yy = lerp(prevTop >= 0 ? slabY(prevTop) : BOT, tgtY, q); }
        arrowHead(ctx, SX - 215, yy, 0, 26, C.amber, ca);
        text(ctx, "TOP", SX - 250, yy, { size: 22, weight: 800, font: F.mono, color: C.amber, align: "right", alpha: ca, ls: 3 });
      }
      if (lastPush && lt - lastPush[2] < 0.6 && lt < 13) {
        const q = prog(lt, lastPush[2], lastPush[2] + 0.6);
        text(ctx, lastPush[0].toUpperCase(), SX, -220 - q * 30, { size: 64, weight: 900, font: F.en, color: lastPush[0] === "push" ? "#fff" : C.red, alpha: (1 - q) * 0.9, ls: 12 });
      }
      text(ctx, "CALL STACK · 调用栈", SX, BOT + 56, { size: 24, weight: 600, font: F.cn, color: hexA(C.amber, 0.8), ls: 6, alpha: prog(lt, 4, 5) });
      // ---------- QUEUE
      const qa = prog(lt, 12.6, 14.2);
      const QC = (QX0 + QX1) / 2;
      text(ctx, "FIFO", QC, -430, { size: 150, weight: 900, font: F.en, color: hexA(C.lime, 0.5), stroke: 2, ls: 20, alpha: qa * (1 - prog(lt, 24.2, 24.8)) });
      text(ctx, "QUEUE · 队列", QC, -330, { size: 30, weight: 600, font: F.cn, color: C.lime, ls: 10, alpha: qa });
      const tp = ease.out(prog(lt, 12.8, 14.4));
      neonLine(ctx, [[QC - (QC - QX0) * tp, -75], [QC + (QX1 - QC) * tp, -75]], C.lime, qa, 3);
      neonLine(ctx, [[QC - (QC - QX0) * tp, 75], [QC + (QX1 - QC) * tp, 75]], C.lime, qa, 3);
      ctx.save(); ctx.globalAlpha = qa * 0.12; ctx.fillStyle = C.lime; ctx.fillRect(QX0, -75, QX1 - QX0, 150); ctx.restore();
      // flow chevrons
      for (let i = 0; i < 9; i++) { const x = QX1 - (((lt * 120) + i * 100) % 900); if (x > QX0 && x < QX1) arrowHead(ctx, x, 0, Math.PI, 14, C.lime, qa * 0.18); }
      text(ctx, "FRONT", QX0 + 60, 115, { size: 22, weight: 800, font: F.mono, color: C.lime, alpha: qa, ls: 4 });
      text(ctx, "REAR", QX1 - 60, 115, { size: 22, weight: 800, font: F.mono, color: C.lime, alpha: qa, ls: 4 });
      const D = QDEQ.reduce((s, d) => s + ease.io(prog(lt, d, d + 0.4)), 0);
      QENQ.forEach((e, k) => {
        if (lt < e) return;
        let slot = k - D;
        const ep = ease.outExpo(prog(lt, e, e + 0.55));
        let x = QX0 + 70 + slot * 112;
        x = lerp(QX1 + 260, x, ep);
        let a = prog(lt, e, e + 0.2);
        if (slot < 0) { x -= (-slot) * 160; a *= clamp(1 + slot * 0.8); }
        if (a <= 0) return;
        const dq = QDEQ[k] != null && lt > QDEQ[k] ? 1 - prog(lt, QDEQ[k], QDEQ[k] + 0.6) : 0;
        ctx.save(); ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(x, 0, 44, 0, 7); ctx.fillStyle = hexA(C.lime, 0.18 + dq * 0.5); ctx.fill(); ctx.strokeStyle = C.lime; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
        text(ctx, `#${k + 1}`, x, 2, { size: 30, weight: 800, font: F.mono, color: "#fff", alpha: a });
        if (ep < 1) glow(ctx, x, 0, 120, C.lime, (1 - ep) * 0.8);
        if (dq > 0) { glow(ctx, x, 0, 200, C.lime, dq); text(ctx, `dequeue → #${k + 1}`, QX0 - 40, -120, { size: 28, weight: 700, font: F.mono, color: C.lime, align: "right", alpha: dq }); }
      });
      const lastE = QENQ.filter((e) => e <= lt).pop();
      if (lastE && lt - lastE < 0.6 && lt < 23) text(ctx, "enqueue", QX1 + 40, -120, { size: 28, weight: 700, font: F.mono, color: "#eaffd6", align: "left", alpha: 1 - prog(lt, lastE, lastE + 0.6) });
      ctx.restore();
      // swirl core glow
      if (swirl > 0) { glow(ctx, W / 2, H / 2, 200 + swirl * 700, "#ffe8b0", swirl * 1.3); glow(ctx, W / 2, H / 2, 80, "#ffffff", swirl * 1.6); }
      // big statement
      const ba = prog(lt, 24.6, 25.4) * (1 - prog(lt, 26.0, 26.6));
      if (ba > 0) {
        text(ctx, "CONSTRAINT  =  POWER", W / 2, 150, { size: 58, weight: 800, font: F.en, color: "#fff", ls: 14, alpha: ba });
        text(ctx, "限制，即力量", W / 2, 215, { size: 34, weight: 500, font: F.cn, color: C.amber, ls: 16, alpha: ba });
      }
      return { flash: 0.25 };
    },
  });

  // ================================================================ 04 HASH TABLE (112–144)
  const djb2 = (s) => { let x = 5381; for (const c of s) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0; return x % 10; };
  const KEYS = [["apple", 4.5], ["claude", 5.5], ["tree", 6.5], ["heap", 7.5], ["queue", 8.5], ["cache", 9.5], ["token", 10.5], ["graph", 15.5], ["pixel", 17.0]]
    .map(([k, t], i) => ({ k, t, b: djb2(k), i }));
  (() => { const cnt = {}; for (const K of KEYS) { K.chain = cnt[K.b] || 0; cnt[K.b] = K.chain + 1; } })();
  // open addressing targets for the two colliders
  const OA = { graph: [3, 4], pixel: [7, 8, 9, 0] };
  const PR = { x: 820, y: 520 };
  const BX = 1300, BY0 = 175, BDY = 76;
  const bucketY = (b) => BY0 + b * BDY;
  function keyPill(ctx, label, x, y, col, a = 1, sc = 1, left = false) {
    if (a <= 0.003) return;
    ctx.font = `700 26px ${F.mono}`; const w = ctx.measureText(label).width + 34;
    ctx.save(); ctx.translate(left ? x + w / 2 : x, y); ctx.scale(sc, sc);
    neonBox(ctx, -w / 2, -22, w, 44, col, a, { r: 22, fill: 0.2, lw: 2 });
    text(ctx, label, 0, 1, { size: 26, weight: 700, font: F.mono, color: "#fff", alpha: a });
    ctx.restore();
    return w;
  }
  function prism(ctx, lt, x, y, size, a, pulseAmt) {
    const v = [[0, -1, 0], [0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
    const e = [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [4, 3], [3, 5], [5, 2]];
    const P = cam3({ yaw: lt * 0.9, pitch: 0.45 + Math.sin(lt * 0.5) * 0.15, dist: 6, fov: size * 6, cx: x, cy: y });
    const pv = v.map((q) => P(q[0], q[1] * 1.3, q[2]));
    glow(ctx, x, y, size * 2.6, C.violet, a * (0.6 + pulseAmt));
    glow(ctx, x, y, size * 0.9, "#ffffff", a * (0.3 + pulseAmt * 1.2));
    for (const [i, j] of e) neonLine(ctx, [[pv[i].x, pv[i].y], [pv[j].x, pv[j].y]], i < 2 && pulseAmt > 0.3 ? "#ffffff" : C.violet, a, 2.2);
    for (const p of pv) glow(ctx, p.x, p.y, 18, C.cyan, a);
  }
  DS.scenes.push({
    t0: 112, t1: 144, card: ["哈希表", "HASH TABLE", C.violet],
    draw(ctx, lt, t) {
      bgFill(ctx, "#140b33", "#03030b", W * 0.45);
      starfield(ctx, t, { drift: 18, a: 0.5 });
      hexRain(ctx, t, C.violet, 0.07, 21);
      const kp = pulse(E.kicks, t, 0.18);
      const zoomOut = ease.io(prog(lt, 25.6, 27));
      const dive = ease.inExpo(prog(lt, 30.4, 32));
      ctx.save();
      // camera: subtle drift, then dive into prism
      const z = lerp(1, 0.92, zoomOut) * (1 + dive * 12) * (1 + 0.04 * Math.sin(lt * 0.3));
      const fx = lerp(W / 2, PR.x, dive);
      ctx.translate(fx, H / 2); ctx.scale(z, z); ctx.rotate(Math.sin(lt * 0.21) * 0.01 + dive * 0.3); ctx.translate(-fx, -H / 2);
      // passing pulse
      let pz = 0; for (const K of KEYS) { const d = lt - (K.t + 0.45); if (d > -0.15 && d < 0.6) pz = Math.max(pz, 1 - Math.abs(d) / 0.6); }
      if (lt > 11.6 && lt < 12.4) pz = Math.max(pz, 1 - Math.abs(lt - 12) / 0.4);
      const pa = ease.out(prog(lt, 1.5, 3.8));
      prism(ctx, lt, PR.x, PR.y, 95 * (0.6 + 0.4 * pa) * (1 + pz * 0.15 + kp * 0.04), pa, pz);
      text(ctx, "h(k) = djb2(k) mod 10", PR.x, PR.y + 200, { size: 26, weight: 600, font: F.mono, color: hexA(C.violet, 1), alpha: pa * (1 - zoomOut), ls: 2 });
      // buckets
      const histo = ease.io(prog(lt, 26, 27.6));
      for (let b = 0; b < 10; b++) {
        const ba = prog(lt, 2 + b * 0.12, 2.5 + b * 0.12) * (1 - histo);
        if (ba <= 0) continue;
        const y = bucketY(b), x = BX + (1 - ease.outExpo(prog(lt, 2 + b * 0.12, 2.8 + b * 0.12))) * 500;
        const occ = KEYS.some((K) => K.b === b && lt > K.t + 0.9);
        neonBox(ctx, x - 55, y - 30, 110, 60, C.cyan, ba, { r: 8, fill: occ ? 0.2 : 0.06, lw: 2 });
        text(ctx, String(b), x, y + 1, { size: 30, weight: 800, font: F.mono, color: occ ? "#fff" : "#7fa7d9", alpha: ba });
      }
      text(ctx, "BUCKETS", BX, BY0 - 70, { size: 22, weight: 700, font: F.cn, color: C.cyan, alpha: prog(lt, 3, 4) * (1 - histo), ls: 6 });
      // mode label
      const oaP = ease.io(prog(lt, 22.8, 23.8)); // chaining -> open addressing morph
      // keys
      let log = [];
      for (const K of KEYS) {
        const lt0 = lt - K.t; if (lt0 < -0.05) continue;
        const label = `"${K.k}"`;
        const start = [-120, 640 + ((K.i * 97) % 300) - 150 + 200];
        const coll = K.chain > 0;
        let x, y, a = 1 - histo, col = coll ? C.red : C.cyan;
        // chaining final position
        const cx = BX + 82 + K.chain * 205, cy = bucketY(K.b);
        let fx2 = cx, fy2 = cy;
        if (OA[K.k] && oaP > 0) { const fin = OA[K.k][OA[K.k].length - 1]; fx2 = lerp(cx, BX + 82, oaP); fy2 = lerp(cy, bucketY(fin), oaP); }
        if (lt0 < 0.45) {
          const q = ease.in(prog(lt0, 0, 0.45)); const pts = bezPts(start, [300, start[1]], [PR.x - 300, PR.y], [PR.x, PR.y], 0, 1, 40);
          [x, y] = pts[Math.floor(q * 40)]; col = "#ffffff";
          keyPill(ctx, label, x, y, C.cyan, 1, 1 - q * 0.4);
        } else if (lt0 < 0.95) {
          const q = ease.out(prog(lt0, 0.45, 0.95));
          x = lerp(PR.x, cx, q); y = lerp(PR.y, cy, q);
          neonLine(ctx, [[PR.x, PR.y], [x, y]], coll ? C.red : C.cyan, 1 - q * 0.5, 3);
          keyPill(ctx, label, x, y, coll ? C.red : C.cyan, 1, 0.6 + q * 0.4, true);
        } else {
          keyPill(ctx, label, fx2, fy2, oaP > 0 && OA[K.k] ? C.amber : coll ? C.pink : C.cyan, a, 1, true);
          if (lt0 < 1.6) glow(ctx, fx2 + 70, fy2, 120, coll ? C.red : C.cyan, (1 - prog(lt0, 0.95, 1.6)));
        }
        if (lt0 > 0.45) log.push(K);
        // collision alarm
        if (coll && lt0 > 0.9 && lt0 < 2.6) {
          const q = prog(lt0, 0.9, 2.6), bl = Math.floor(lt0 * 8) % 2;
          ring(ctx, BX, cy, 50 + q * 120, C.red, (1 - q), 3);
          text(ctx, "COLLISION · 冲突", BX + 90 + K.chain * 205, cy - 50, { size: 26, weight: 800, font: F.cn, color: C.red, alpha: (1 - q) * (0.6 + bl * 0.4), ls: 4, align: "left" });
        }
      }
      // chain links
      for (const K of KEYS) {
        if (K.chain === 0 || lt < K.t + 0.95) continue;
        const y = bucketY(K.b), x1 = BX + 82 + (K.chain - 1) * 205 + 150, x2 = BX + 82 + K.chain * 205 - 4;
        const a = 1 - oaP;
        neonLine(ctx, [[x1, y], [x2, y]], C.pink, a, 2.5); arrowHead(ctx, x2, y, 0, 12, C.pink, a);
      }
      // probe arrows (open addressing)
      if (oaP > 0) {
        for (const k in OA) {
          const seq = OA[k];
          for (let s = 0; s < seq.length - 1; s++) {
            const q = prog(lt, 23.8 + s * 0.35 + (k === "pixel" ? 0.4 : 0), 24.1 + s * 0.35 + (k === "pixel" ? 0.4 : 0));
            if (q <= 0) continue;
            const ya = bucketY(seq[s]), yb = bucketY(seq[s + 1]);
            const xx = BX - 80 - (k === "pixel" ? 50 : 0);
            const pts = seq[s + 1] < seq[s] ? [[xx, ya], [xx - 60, ya], [xx - 60, lerp(ya, yb, q)], [xx, lerp(ya, yb, q)]] : bezPts([xx, ya], [xx - 50, ya], [xx - 50, yb], [xx, yb], 0, q, 16);
            neonLine(ctx, pts, C.amber, (1 - histo) * 0.9, 2.5);
            if (q >= 1) text(ctx, `+${s + 1}`, xx - 70, (ya + yb) / 2, { size: 20, weight: 800, font: F.mono, color: C.amber, align: "right", alpha: 1 - histo });
          }
        }
      }
      // technique labels
      const cl = prog(lt, 20.6, 21.2) * (1 - oaP);
      text(ctx, "CHAINING · 链地址法", BX + 130, BY0 - 70, { size: 24, weight: 700, font: F.cn, color: C.pink, alpha: cl, ls: 4, align: "left" });
      text(ctx, "OPEN ADDRESSING · 开放寻址", BX + 130, BY0 - 70, { size: 24, weight: 700, font: F.cn, color: C.amber, alpha: oaP * (1 - histo), ls: 4, align: "left" });
      // hash log panel
      const la = prog(lt, 4.6, 5.2) * (1 - zoomOut);
      if (la > 0) {
        neonBox(ctx, 90, 120, 470, 46 + Math.min(log.length, 9) * 38, C.violet, la * 0.7, { r: 12, fill: 0.08, lw: 1.2 });
        log.slice(-9).forEach((K, i) => {
          const ap = prog(lt - K.t, 0.45, 0.75);
          const s = `h("${K.k}")`.padEnd(14) + `→ ${K.b}`;
          text(ctx, decode(s, ap, K.i * 7), 115, 145 + i * 38, { size: 24, weight: 600, font: F.mono, color: K.chain ? C.red : "#dccfff", align: "left", alpha: la });
        });
      }
      // lookup demo: get("tree") — compute, don't search
      if (lt > 11.2 && lt < 15) {
        const a = prog(lt, 11.2, 11.5) * (1 - prog(lt, 14.4, 15));
        text(ctx, 'get("tree")', PR.x, PR.y - 210, { size: 46, weight: 800, font: F.mono, color: "#fff", alpha: a });
        const q = ease.out(prog(lt, 12, 12.25));
        const ty = bucketY(7);
        if (q > 0) { neonLine(ctx, [[PR.x, PR.y], [lerp(PR.x, BX - 60, q), lerp(PR.y, ty, q)]], C.green, a, 4); }
        if (lt > 12.25) { ring(ctx, BX, ty, 40 + prog(lt, 12.25, 13) * 160, C.green, a * (1 - prog(lt, 12.25, 13)), 3); glow(ctx, BX + 125, ty, 150, C.green, a * 0.8); }
        if (lt > 12.4) badge(ctx, PR.x, PR.y - 300, "1 STEP", C.green, lt - 12.4, { size: 40 });
      }
      // histogram finale
      if (histo > 0) {
        const n = 48, x0 = 1060, x1 = 1820, base = 900, r = rng(9);
        const fill = ease.out(prog(lt, 27, 31));
        for (let i = 0; i < n; i++) {
          const hgt = (180 + r() * 90 + Math.sin(i * 0.7 + lt * 3) * 12) * fill;
          const x = lerp(x0, x1, i / (n - 1));
          ctx.save(); ctx.globalAlpha = histo; ctx.fillStyle = hexA(i % 2 ? C.cyan : C.violet, 0.55); ctx.fillRect(x - 6, base - hgt, 12, hgt);
          ctx.fillStyle = "#fff"; ctx.fillRect(x - 6, base - hgt, 12, 2); ctx.restore();
        }
        // particle stream through prism
        const pr = rng(12);
        for (let i = 0; i < 160; i++) {
          const ph = (lt * 0.9 + pr()) % 1, tgtX = lerp(x0, x1, pr()), sy = 120 + pr() * 840;
          let x, y;
          if (ph < 0.5) { const q = ease.in(ph / 0.5); x = lerp(-50, PR.x, q); y = lerp(sy, PR.y, q); }
          else { const q = ease.out((ph - 0.5) / 0.5); x = lerp(PR.x, tgtX, q); y = lerp(PR.y, base - 200, q); }
          glow(ctx, x, y, 10, ph < 0.5 ? "#ffffff" : C.cyan, histo * 0.9);
        }
        text(ctx, "O(1)", 1440, 330, { size: 160, weight: 900, font: F.mono, color: "#fff", alpha: histo * prog(lt, 27.5, 28.2) });
        text(ctx, "AVERAGE · 平均", 1440, 440, { size: 32, weight: 600, font: F.cn, color: C.cyan, alpha: histo * prog(lt, 27.8, 28.4), ls: 14 });
      }
      ctx.restore();
      if (dive > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = dive; ctx.fillStyle = "#d9ccff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      return {};
    },
  });

  // ================================================================ 05 TREE (144–180)
  const BST = (() => {
    const seq = [50, 30, 70, 20, 40, 60, 80, 10, 25, 35, 45, 65, 85, 55, 75];
    const nodes = []; const root = { v: seq[0], d: 0, path: [] }; nodes.push(root);
    for (let i = 1; i < seq.length; i++) {
      let cur = root, path = [], d = 0;
      while (true) {
        path.push(cur); d++;
        const side = seq[i] < cur.v ? "l" : "r";
        if (!cur[side]) { const n = { v: seq[i], d, parent: cur, path, side }; cur[side] = n; nodes.push(n); break; }
        cur = cur[side];
      }
    }
    const sorted = [...nodes].sort((a, b) => a.v - b.v);
    sorted.forEach((n, i) => { n.x = 960 + (i - 7) * 112; n.y = 200 + n.d * 190; });
    nodes.forEach((n, i) => (n.t = 3.6 + i * 0.66));
    return nodes;
  })();
  const SEARCH = [50, 70, 60, 65];
  const BIGT = (() => { // fractal binary tree for the "billion records" shot
    const pts = [], r = rng(3); let path = [];
    const rec = (x, y, w, d, id) => { pts.push([x, y, d, id]); if (d >= 11) return; rec(x - w, y + 90, w / 2, d + 1, id * 2); rec(x + w, y + 90, w / 2, d + 1, id * 2 + 1); };
    rec(0, 0, 1400, 0, 1);
    let id = 1; for (let d = 0; d < 11; d++) { path.push(id); id = id * 2 + (r() > 0.5 ? 1 : 0); } path.push(id);
    return { pts, path, map: new Map(pts.map((p) => [p[3], p])) };
  })();
  function treeNode(ctx, x, y, v, col, a, hi = 0, r = 34) {
    if (a <= 0.003) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = hexA(col, 0.16 + hi * 0.45); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    text(ctx, String(v), x, y + 1, { size: r * 0.82, weight: 800, font: F.mono, color: "#fff", alpha: a });
    if (hi > 0) glow(ctx, x, y, r * 4, col, hi * a);
  }
  DS.scenes.push({
    t0: 144, t1: 180, card: ["树", "TREE", C.green],
    draw(ctx, lt, t) {
      bgFill(ctx, "#05231c", "#020507", W / 2, H * 0.3);
      starfield(ctx, t, { drift: 6, a: 0.55, color: "#c8ffe8" });
      hexRain(ctx, t, C.green, 0.05 * (1 - prog(lt, 19.6, 20.4)), 33);
      const big = prog(lt, 19.8, 20.6) * (1 - prog(lt, 25.6, 26.3));
      const smallA = (1 - prog(lt, 19.6, 20.2)) * prog(lt, 1.0, 2.0);
      // ---- BST
      if (smallA > 0) {
        ctx.save();
        const zc = kf(lt, [[0, { z: 1.3, y: 120 }], [5, { z: 1.12, y: 70 }], [12, { z: 1.0, y: 30 }], [19.6, { z: 1.04, y: 30 }], [20.2, { z: 0.3, y: -300 }, ease.inExpo]]);
        ctx.translate(W / 2, H / 2); ctx.scale(zc.z, zc.z); ctx.translate(-W / 2, -H / 2 + zc.y);
        const sStep = (i) => 15.4 + i * 1.0;
        const searchStep = lt > 15.4 ? Math.min(3, Math.floor((lt - 15.4) / 1.0)) : -1;
        const dimmed = (n) => {
          if (searchStep < 0) return 0;
          let dim = 0;
          for (let s = 0; s <= searchStep && s < 3; s++) {
            if (lt < sStep(s) + 0.5) break;
            const pivot = BST.find((m) => m.v === SEARCH[s]), go = SEARCH[s + 1] < pivot.v ? "l" : "r";
            // n is in discarded subtree?
            let p = n; let inDiscard = false;
            while (p.parent) { if (p.parent === pivot) { inDiscard = p.side !== go; break; } p = p.parent; }
            if (inDiscard) dim = Math.max(dim, prog(lt, sStep(s) + 0.5, sStep(s) + 0.9));
          }
          return dim;
        };
        // edges
        for (const n of BST) {
          if (!n.parent) continue;
          const arrive = n.t + 0.18 * n.d + 0.12;
          const p = ease.out(prog(lt, arrive, arrive + 0.3));
          if (p <= 0) continue;
          const onPath = searchStep >= 0 && SEARCH.includes(n.v) && SEARCH.includes(n.parent.v) && lt > sStep(SEARCH.indexOf(n.v)) - 0.2;
          neonLine(ctx, [[n.parent.x, n.parent.y + 34], [lerp(n.parent.x, n.x, p), lerp(n.parent.y + 34, n.y - 34, p)]], onPath ? C.gold : C.green, smallA * (1 - dimmed(n) * 0.85), onPath ? 4 : 2.2);
        }
        for (const n of BST) {
          const ld = lt - n.t; if (ld < 0) continue;
          // falling comparison path
          const stepDur = 0.18;
          let x = n.x, y = n.y, settled = true;
          if (ld < stepDur * n.d + 0.12) {
            settled = false;
            const k = Math.min(n.d - 1, Math.floor(ld / stepDur));
            if (n.d === 0) { y = lerp(60, n.y, ease.out(ld / 0.12)); }
            else {
              const anc = n.path[Math.max(0, k)], nxt = n.path[k + 1] || n; const q = ease.io(clamp((ld - k * stepDur) / stepDur));
              x = lerp(anc.x, nxt.x, q); y = lerp(anc.y - 70, nxt.y - (nxt === n ? 0 : 70), q);
              glow(ctx, anc.x, anc.y, 120, C.gold, 0.8);
              text(ctx, n.v < anc.v ? "<" : ">", anc.x + (n.v < anc.v ? -60 : 60), anc.y - 40, { size: 36, weight: 900, font: F.mono, color: C.gold, alpha: 0.9 });
            }
          }
          const isS = searchStep >= 0 && SEARCH.indexOf(n.v) >= 0 && SEARCH.indexOf(n.v) <= searchStep;
          const found = n.v === 65 && lt > sStep(3);
          const hi = settled ? Math.max(1 - prog(ld, stepDur * n.d + 0.12, stepDur * n.d + 0.7), isS ? 0.7 : 0, found ? 0.6 + 0.4 * Math.sin(lt * 9) : 0) : 0.9;
          treeNode(ctx, x, y, n.v, found ? C.gold : isS ? C.gold : C.green, smallA * (1 - dimmed(n) * 0.82), hi);
        }
        if (searchStep >= 0) {
          const a = prog(lt, 15.2, 15.5) * smallA;
          text(ctx, "find(65)", 260, 200, { size: 46, weight: 800, font: F.mono, color: C.gold, alpha: a, align: "left" });
          text(ctx, `step ${searchStep + 1}`, 260, 255, { size: 32, weight: 600, font: F.mono, color: "#fff2c9", alpha: a, align: "left" });
          if (lt > sStep(3)) { const f = prog(lt, sStep(3), sStep(3) + 1); const n = BST.find((m) => m.v === 65); ring(ctx, n.x, n.y, 40 + f * 300, C.gold, 1 - f, 4); }
          if (lt > 18.8) badge(ctx, 1600, 210, "O(log n)", C.gold, lt - 18.8, { size: 46, sub: "HALF EACH STEP · 每步减半" });
        }
        ctx.restore();
      }
      // ---- billion-node tree
      if (big > 0) {
        const lb = lt - 20;
        const step = clamp(Math.floor(lb * 6.2), 0, 11);
        const cur = BIGT.map.get(BIGT.path[step]);
        const camZ = lerp(0.58, 2.2, ease.io(prog(lb, 0.3, 5.4)));
        const fx = lerp(0, cur[0], ease.io(prog(lb, 0.2, 5.4))), fy = lerp(470, cur[1], ease.io(prog(lb, 0.2, 5.4)));
        ctx.save(); ctx.translate(W / 2, H / 2 + 60); ctx.scale(camZ, camZ); ctx.translate(-fx, -fy);
        ctx.globalAlpha = big;
        ctx.strokeStyle = hexA(C.green, 0.3); ctx.lineWidth = 1.2 / camZ; ctx.beginPath();
        for (const [x, y, d, id] of BIGT.pts) { if (d === 0) continue; const p = BIGT.map.get(id >> 1); ctx.moveTo(p[0], p[1]); ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.fillStyle = hexA(C.green, 0.85);
        for (const [x, y, d] of BIGT.pts) { const s = 7 / Math.sqrt(d + 1); ctx.fillRect(x - s / 2, y - s / 2, s, s); }
        const pathPts = BIGT.path.slice(0, step + 1).map((id) => BIGT.map.get(id));
        neonLine(ctx, pathPts.map((p) => [p[0], p[1]]), C.gold, big, 5 / camZ);
        for (const p of pathPts) glow(ctx, p[0], p[1], 40 / camZ, C.gold, big);
        glow(ctx, cur[0], cur[1], 120 / camZ, "#fff", big);
        ctx.restore();
        const n = Math.min(30, Math.round(lerp(1, 30, prog(lb, 0.2, 2.0))));
        text(ctx, "1,000,000,000", W / 2, 150, { size: 64, weight: 800, font: F.mono, color: "#fff", alpha: big, ls: 4 });
        text(ctx, "RECORDS · 条记录", W / 2, 210, { size: 26, weight: 600, font: F.cn, color: C.green, alpha: big, ls: 10 });
        text(ctx, String(n), W / 2 + 560, H / 2 + 40, { size: 220, weight: 900, font: F.mono, color: C.gold, alpha: big });
        text(ctx, "STEPS · 步", W / 2 + 560, H / 2 + 175, { size: 30, weight: 700, font: F.cn, color: C.gold, alpha: big, ls: 10 });
        text(ctx, "log₂(10⁹) ≈ 30", W / 2 - 560, H / 2 + 60, { size: 46, weight: 700, font: F.mono, color: "#dfffe9", alpha: big * prog(lb, 2.2, 2.8) });
      }
      // ---- rotation (AVL)
      const ra = prog(lt, 26.0, 26.6) * (1 - prog(lt, 31, 31.6));
      if (ra > 0) {
        const q = ease.io(prog(lt, 28.0, 29.0));
        const cx = W / 2, cy = 470;
        const A = { v: 10, x0: cx - 180, y0: cy - 200, x1: cx - 180, y1: cy + 20 };
        const B = { v: 20, x0: cx, y0: cy - 40, x1: cx, y1: cy - 160 };
        const Cn = { v: 30, x0: cx + 180, y0: cy + 120, x1: cx + 180, y1: cy + 20 };
        const P = (n) => [lerp(n.x0, n.x1, q) + Math.sin(q * Math.PI) * (n === A ? -60 : n === Cn ? 60 : 0), lerp(n.y0, n.y1, q)];
        const [ax, ay] = P(A), [bx, by] = P(B), [cxp, cyp] = P(Cn);
        const col = mix(C.red, C.green, q);
        if (q < 0.5) { neonLine(ctx, [[ax, ay], [bx, by]], col, ra * (1 - q * 2), 3); }
        else { neonLine(ctx, [[bx, by], [ax, ay]], col, ra * (q * 2 - 1), 3); }
        neonLine(ctx, [[bx, by], [cxp, cyp]], col, ra, 3);
        treeNode(ctx, ax, ay, 10, col, ra, q > 0.95 ? 0.4 : 0, 46); treeNode(ctx, bx, by, 20, col, ra, q > 0.95 ? 0.6 : 0, 46); treeNode(ctx, cxp, cyp, 30, col, ra, q > 0.95 ? 0.4 : 0, 46);
        // rotation arrow
        if (lt > 27.4 && lt < 29.2) {
          const ap = prog(lt, 27.4, 29.0), pts = [];
          for (let i = 0; i <= 30; i++) { const an = -Math.PI * 0.95 + i / 30 * Math.PI * 0.8 * ap; pts.push([cx + Math.cos(an) * 300, cy - 40 + Math.sin(an) * 300]); }
          neonLine(ctx, pts, C.gold, ra * (1 - prog(lt, 28.8, 29.2)), 3);
          const e = pts[pts.length - 1], p2 = pts[pts.length - 2]; arrowHead(ctx, e[0], e[1], Math.atan2(e[1] - p2[1], e[0] - p2[0]), 20, C.gold, ra * (1 - prog(lt, 28.8, 29.2)));
        }
        text(ctx, q < 0.5 ? "UNBALANCED · 失衡" : "BALANCED · 平衡", W / 2, 180, { size: 40, weight: 800, font: F.cn, color: q < 0.5 ? C.red : C.green, alpha: ra, ls: 8 });
        text(ctx, "rotateLeft(10)", W / 2, 760, { size: 34, weight: 700, font: F.mono, color: C.gold, alpha: ra * prog(lt, 27.4, 27.8) });
      }
      // ---- file system tree
      const fa = prog(lt, 31.2, 31.8) * (1 - prog(lt, 35.3, 36));
      if (fa > 0) {
        const fs = [["/", 0, 0, 0], ["bin", 1, -600, 0], ["home", 1, -200, 0], ["usr", 1, 200, 0], ["var", 1, 600, 0],
          ["claude", 2, -300, 2], ["docs", 2, -100, 2], ["lib", 2, 100, 3], ["local", 2, 300, 3], ["log", 2, 600, 4], ["ls", 2, -600, 1],
          ["notes.md", 3, -430, 5], ["film.mp4", 3, -190, 5], ["python3", 3, 300, 8]];
        const pos = (n) => [W / 2 + n[2], 250 + n[1] * 160];
        fs.forEach((n, i) => {
          const ap = ease.outBack(prog(lt, 31.3 + i * 0.12, 31.7 + i * 0.12)); if (ap <= 0) return;
          const [x, y] = pos(n);
          if (n[1] > 0) { const p = pos(fs[n[3]]); neonLine(ctx, [[p[0], p[1] + 26], [p[0], (p[1] + y) / 2], [x, (p[1] + y) / 2], [x, y - 26]], C.green, fa * clamp(ap), 2); }
          ctx.save(); ctx.translate(x, y); ctx.scale(ap, ap);
          const w = Math.max(90, n[0].length * 19 + 40);
          neonBox(ctx, -w / 2, -26, w, 52, n[1] === 3 ? C.cyan : C.green, fa, { r: 8, fill: 0.15 });
          text(ctx, n[0], 0, 1, { size: 24, weight: 700, font: F.mono, color: "#fff", alpha: fa });
          ctx.restore();
        });
        text(ctx, "FILE SYSTEM · 文件系统        B+ TREE INDEX · 数据库索引", W / 2, 860, { size: 26, weight: 600, font: F.cn, color: hexA(C.green, 0.9), alpha: fa * prog(lt, 32.4, 33), ls: 4 });
      }
      return {};
    },
  });
})();
