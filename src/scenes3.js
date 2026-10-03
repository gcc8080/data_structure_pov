// Scenes 3 — Heap, Graph, Complexity, Finale
(function () {
  const { W, H, C, F, E, clamp, lerp, prog, ease, rng, hash1, pulse, since, hexA, mix, glow, text, decode, neonBox, neonLine,
    bezPts, arrowHead, ring, badge, cam3, starfield, gridFloor, bgFill, hexRain, kf, bitGalaxy } = DS;

  // ================================================================ 06 HEAP (180–200)
  const HV = [90, 70, 80, 40, 60, 50, 75, 10, 30, 20, 95];
  const HEAPK = (() => {
    const ks = []; let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    ks.push([0, arr.slice()]);
    arr = [...arr, 10]; ks.push([8.5, arr.slice()]);
    const sw = (a, i, j) => { const b = a.slice(); [b[i], b[j]] = [b[j], b[i]]; return b; };
    arr = sw(arr, 10, 4); ks.push([9.5, arr]);
    arr = sw(arr, 4, 1); ks.push([10.5, arr]);
    arr = sw(arr, 1, 0); ks.push([11.5, arr]);
    arr = arr.slice(); arr[0] = -1; ks.push([14.0, arr]);                  // max leaves
    arr = arr.slice(0, 10); arr[0] = 4; ks.push([14.5, arr]);             // last -> root
    arr = sw(arr, 0, 1); ks.push([15.5, arr]);
    arr = sw(arr, 1, 4); ks.push([16.5, arr]);
    return ks;
  })();
  const hslot = (i) => { const L = Math.floor(Math.log2(i + 1)), p = i - (2 ** L - 1); return [960 + (p - (2 ** L - 1) / 2) * (1500 / 2 ** L), 200 + L * 125]; };
  const aslot = (i) => [960 + (i - 5) * 112, 800];
  function heapSlotOf(id, lt) {
    let prev = null, cur = HEAPK[0];
    for (const k of HEAPK) { if (k[0] <= lt) { prev = cur; cur = k; } }
    const s1 = cur[1].indexOf(id); const s0 = prev ? prev[1].indexOf(id) : s1;
    return { s0, s1, q: ease.io(prog(lt, cur[0], cur[0] + 0.42)), tk: cur[0] };
  }
  DS.scenes.push({
    t0: 180, t1: 200, card: ["堆", "HEAP", C.orange],
    draw(ctx, lt, t) {
      bgFill(ctx, "#2a1206", "#050204", W / 2, H * 0.35);
      starfield(ctx, t, { drift: 10, a: 0.5, color: "#ffd2b0" });
      hexRain(ctx, t, C.orange, 0.05, 41);
      const ex = ease.inExpo(prog(lt, 18.9, 20));
      const app = (i) => 2.6 + Math.floor(Math.log2(i + 1)) * 0.5 + (i % 2) * 0.12;
      // edges (by slot)
      const nSlots = lt >= 8.5 && lt < 14.5 ? 11 : 10;
      for (let i = 1; i < nSlots; i++) {
        const p = hslot(Math.floor((i - 1) / 2)), c = hslot(i);
        const a = prog(lt, app(i), app(i) + 0.4) * clamp(1 - ex * 4);
        neonLine(ctx, [[p[0], p[1] + 36], [c[0], c[1] - 36]], C.orange, a * 0.75, 2);
      }
      // array cells
      for (let i = 0; i < 11; i++) {
        const [x, y] = aslot(i);
        const a = prog(lt, 3 + i * 0.08, 3.4 + i * 0.08) * clamp(1 - ex * 4) * (i === 10 ? prog(lt, 8.3, 8.6) * (1 - prog(lt, 14.4, 14.8)) : 1);
        neonBox(ctx, x - 50, y - 38, 100, 76, C.amber, a, { r: 8, fill: 0.08 });
        text(ctx, `[${i}]`, x, y + 62, { size: 20, weight: 600, font: F.mono, color: C.amber, alpha: a * 0.8 });
      }
      text(ctx, "ARRAY · 数组存储", 960, 718, { size: 22, weight: 700, font: F.cn, color: hexA(C.amber, 0.9), ls: 8, alpha: prog(lt, 3.5, 4.2) * (1 - ex) });
      // nodes by id
      for (let id = 0; id < 11; id++) {
        if (id === 10 && lt < 8.5) continue;
        const { s0, s1, q, tk } = heapSlotOf(id, lt);
        let a = id === 10 ? prog(lt, 8.5, 8.8) : prog(lt, app(id), app(id) + 0.35);
        let tx, ty, ax, ay;
        if (s1 === -1) { // extracted max flies up
          const [x0, y0] = hslot(0); const fq = ease.in(prog(lt, 14.0, 14.7));
          tx = x0; ty = lerp(y0, -120, fq); ax = aslot(0)[0]; ay = lerp(aslot(0)[1], -120, fq); a *= 1 - prog(lt, 14.4, 14.8);
        } else {
          const A = hslot(s0 < 0 ? s1 : s0), B = hslot(s1), bulge = Math.sin(q * Math.PI) * (s0 !== s1 ? 60 : 0);
          const fromBottom = id === 4 && tk === 14.5;
          tx = lerp(A[0], B[0], q) + (fromBottom ? 0 : bulge); ty = lerp(A[1], B[1], q) - (fromBottom ? bulge * 2 : 0);
          const AA = aslot(s0 < 0 ? s1 : s0), BB = aslot(s1);
          ax = lerp(AA[0], BB[0], q); ay = lerp(AA[1], BB[1], q) - Math.sin(q * Math.PI) * (s0 !== s1 ? 90 : 0);
          if (id === 10 && lt < 9.0) ty += (1 - ease.outBack(prog(lt, 8.5, 9.0))) * 160;
        }
        a *= 1 - ex;
        if (a <= 0) continue;
        const moving = q > 0 && q < 1 && s0 !== s1;
        const isRoot = s1 === 0;
        const col = id === 10 ? C.gold : isRoot ? "#ffe0a6" : C.orange;
        // explosion displacement
        if (ex > 0) { const dx = tx - 960, dy = ty - 450; tx += dx * ex * 3; ty += dy * ex * 3; }
        ctx.save(); ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(tx, ty, 38, 0, 7); ctx.fillStyle = hexA(col, moving ? 0.5 : isRoot ? 0.32 : 0.16); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        text(ctx, String(HV[id]), tx, ty + 1, { size: 30, weight: 800, font: F.mono, color: "#fff", alpha: a });
        if (moving || (id === 10 && lt < 9.5)) glow(ctx, tx, ty, 150, col, a);
        if (isRoot && lt > 11.9 && lt < 13.9 && id === 10) { glow(ctx, tx, ty, 220, C.gold, a * (0.6 + 0.3 * Math.sin(lt * 8))); text(ctx, "♛", tx, ty - 72, { size: 46, color: C.gold, alpha: a }); }
        // array mirror
        text(ctx, String(HV[id]), ax, ay + 1, { size: 32, weight: 800, font: F.mono, color: moving ? C.gold : "#fff", alpha: a * (s1 === -1 ? 1 - prog(lt, 14, 14.4) : 1) });
      }
      // HUD
      const fa = prog(lt, 4.2, 4.8) * (1 - ex);
      text(ctx, "parent(i) = ⌊(i − 1) / 2⌋", 110, 160, { size: 30, weight: 600, font: F.mono, color: "#ffd9b8", align: "left", alpha: fa });
      text(ctx, "children  = 2i + 1, 2i + 2", 110, 205, { size: 30, weight: 600, font: F.mono, color: "#ffd9b8", align: "left", alpha: fa });
      if (lt > 8.4 && lt < 13.8) text(ctx, "push(95) · sift up ↑", W - 110, 160, { size: 32, weight: 800, font: F.mono, color: C.gold, align: "right", alpha: prog(lt, 8.4, 8.7) * (1 - prog(lt, 13.4, 13.8)) });
      if (lt > 13.9 && lt < 18.8) text(ctx, "pop() → 95 · sift down ↓", W - 110, 160, { size: 32, weight: 800, font: F.mono, color: C.gold, align: "right", alpha: prog(lt, 13.9, 14.2) * (1 - prog(lt, 18.3, 18.8)) });
      if (lt > 14.1 && lt < 16) { const q = prog(lt, 14.1, 16); text(ctx, "NEXT TASK · 下一个任务", 960, 90 - q * 20, { size: 30, weight: 800, font: F.cn, color: C.gold, alpha: 1 - q, ls: 8 }); }
      if (lt > 12.0) badge(ctx, W - 300, 280, "O(log n)", C.gold, lt - 12.0, { size: 40 });
      if (ex > 0) { glow(ctx, 960, 450, 300 + ex * 900, "#ffe3c4", ex * 1.4); }
      return {};
    },
  });

  // ================================================================ 07 GRAPH (200–240)
  const G = (() => {
    const r = rng(2026), N = 64, nodes = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = i * 2.39996;
      const R = 430 * (0.75 + r() * 0.35);
      nodes.push({ x: Math.cos(th) * rad * R, y: y * R * 0.85, z: Math.sin(th) * rad * R, ig: 0.8 + r() * 3.2 });
    }
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    const es = new Set(), edges = [], adj = nodes.map(() => []);
    nodes.forEach((n, i) => {
      const near = nodes.map((m, j) => [d(n, m), j]).filter((p) => p[1] !== i).sort((a, b) => a[0] - b[0]).slice(0, 3);
      for (const [w, j] of near) { const k = i < j ? `${i}-${j}` : `${j}-${i}`; if (!es.has(k)) { es.add(k); edges.push([Math.min(i, j), Math.max(i, j), Math.round(w / 10)]); } }
    });
    edges.forEach(([a, b, w], ei) => { adj[a].push([b, w, ei]); adj[b].push([a, w, ei]); });
    // BFS levels from s
    const s = 0, lvl = Array(N).fill(-1); lvl[s] = 0; const q = [s];
    while (q.length) { const u = q.shift(); for (const [v] of adj[u]) if (lvl[v] < 0) { lvl[v] = lvl[u] + 1; q.push(v); } }
    const maxL = Math.max(...lvl);
    // Dijkstra
    const dist = Array(N).fill(Infinity), prev = Array(N).fill(-1), done = Array(N).fill(false), order = []; dist[s] = 0;
    for (let it = 0; it < N; it++) {
      let u = -1; for (let i = 0; i < N; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || dist[u] === Infinity) break; done[u] = true; order.push(u);
      for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
    }
    let tgt = 0; for (let i = 0; i < N; i++) if (dist[i] !== Infinity && dist[i] > dist[tgt]) tgt = i;
    const path = []; for (let v = tgt; v >= 0; v = prev[v]) path.unshift(v);
    const rank = Array(N); order.forEach((u, k) => (rank[u] = k));
    // galaxy for the climax
    const gal = [];
    for (let i = 0; i < 380; i++) {
      const arm = i % 4, rr = 700 + Math.pow(r(), 0.8) * 2600, a = arm * Math.PI / 2 + rr * 0.0012 + (r() - 0.5) * 0.5;
      gal.push({ x: Math.cos(a) * rr, y: (r() - 0.5) * 260, z: Math.sin(a) * rr, c: r() });
    }
    const gedges = [];
    gal.forEach((n, i) => {
      const near = gal.map((m, j) => [Math.hypot(n.x - m.x, n.y - m.y, n.z - m.z), j]).filter((p) => p[1] > i).sort((a, b) => a[0] - b[0]).slice(0, 2);
      for (const [, j] of near) gedges.push([i, j]);
    });
    return { nodes, edges, adj, lvl, maxL, dist, prev, rank, order, path, s, tgt, gal, gedges };
  })();
  const LABELS = [[5, "社交网络", "SOCIAL NETWORKS", -1], [30, "地图导航", "MAPS & ROUTES", 1], [52, "互联网", "THE INTERNET", -1]];
  const WORDS = [["SOCIAL", "社交"], ["ROUTES", "路径"], ["INTERNET", "互联网"], ["KNOWLEDGE", "知识图谱"], ["NEURAL NETS", "神经网络"], ["EVERYTHING", "万物互联"]];
  DS.scenes.push({
    t0: 200, t1: 240, card: ["图", "GRAPH", C.cyan],
    draw(ctx, lt, t) {
      bgFill(ctx, "#071433", "#020309", W / 2, H / 2);
      starfield(ctx, t, { drift: 4 + prog(lt, 26, 38) * 120, a: 0.7 });
      const climax = prog(lt, 26, 27.5);
      const c = kf(lt, [[0, { dist: 1900, pitch: 0.3, yaw: 0.2 }], [8, { dist: 1450, pitch: 0.22, yaw: 0.9 }], [20, { dist: 1350, pitch: 0.35, yaw: 2.0 }],
        [26, { dist: 1300, pitch: 0.3, yaw: 2.6 }], [39.6, { dist: 420, pitch: 0.55, yaw: 4.4 }, ease.in]]);
      const P = cam3({ ...c, fov: 1100 });
      // galaxy layer
      if (climax > 0) {
        const pts = G.gal.map((n) => P(n.x, n.y, n.z));
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineWidth = 1;
        G.gedges.forEach(([a, b], k) => {
          const pa = pts[a], pb = pts[b]; if (!pa || !pb) return;
          ctx.strokeStyle = hexA(k % 3 ? C.violet : C.cyan, 0.16 * climax); ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        });
        ctx.restore();
        pts.forEach((p, i) => { if (!p) return; const col = G.gal[i].c > 0.7 ? C.magenta : G.gal[i].c > 0.35 ? C.cyan : C.violet; glow(ctx, p.x, p.y, Math.min(60, 22 * p.s), col, climax * 0.9); });
        // pulses along galaxy edges on every 16th
        for (let k = E.arps.length - 1; k >= 0; k--) {
          const at = E.arps[k]; if (at > t) continue; if (t - at > 0.6) break;
          for (let m = 0; m < 3; m++) {
            const e = G.gedges[Math.floor(hash1(at * 100 + m) * G.gedges.length)], pa = pts[e[0]], pb = pts[e[1]]; if (!pa || !pb) continue;
            const q = (t - at) / 0.6; glow(ctx, lerp(pa.x, pb.x, q), lerp(pa.y, pb.y, q), 40, m ? C.cyan : "#fff", climax * (1 - q));
          }
        }
      }
      const pts = G.nodes.map((n) => P(n.x, n.y, n.z));
      // state helpers
      const bfsT = (i) => 15.2 + G.lvl[i] * 0.55;
      const djT = (i) => 20.8 + (G.rank[i] / G.nodes.length) * 3.2;
      const inPath = new Set(G.path);
      const pathE = new Set(); for (let k = 1; k < G.path.length; k++) pathE.add([Math.min(G.path[k - 1], G.path[k]), Math.max(G.path[k - 1], G.path[k])].join("-"));
      const bfsA = prog(lt, 15, 15.3) * (1 - prog(lt, 20.2, 20.7));
      const djA = prog(lt, 20.6, 20.9) * (1 - prog(lt, 26.6, 27.6));
      const lvlCol = (L) => mix(C.cyan, C.magenta, L / Math.max(1, G.maxL));
      // edges
      ctx.save(); ctx.lineCap = "round";
      G.edges.forEach(([a, b, w], k) => {
        const pa = pts[a], pb = pts[b]; if (!pa || !pb) return;
        const ea = prog(lt, 3 + (k / G.edges.length) * 3, 3.6 + (k / G.edges.length) * 3);
        if (ea <= 0) return;
        const depth = clamp(1.6 - (pa.z + pb.z) / 2 / 1400, 0.25, 1);
        let col = C.blue, al = 0.35 * ea * depth, lw = 1.4;
        if (bfsA > 0) { const lit = lt > Math.max(bfsT(a), bfsT(b)); if (lit) { col = lvlCol(Math.max(G.lvl[a], G.lvl[b])); al = lerp(al, 0.75 * depth, bfsA); } }
        if (djA > 0) {
          const settled = lt > djT(a) && lt > djT(b) && (G.prev[a] === b || G.prev[b] === a);
          if (settled) { col = C.gold; al = lerp(al, 0.55 * depth, djA); }
          if (pathE.has(`${a}-${b}`) && lt > 24.2) { col = C.gold; al = djA; lw = 5; }
        }
        ctx.globalAlpha = al * (1 - climax * 0.5); ctx.strokeStyle = col; ctx.lineWidth = lw * Math.max(0.6, pa.s);
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        if (djA > 0 && lt > 21 && lt < 24.4 && (pa.s > 0.6)) {
          // weights near the frontier
          if (Math.abs(djT(a) - lt) < 0.5 || Math.abs(djT(b) - lt) < 0.5) text(ctx, String(w), (pa.x + pb.x) / 2, (pa.y + pb.y) / 2 - 10, { size: 16, weight: 700, font: F.mono, color: C.gold, alpha: djA * 0.9 });
        }
      });
      ctx.restore();
      // ambient pulses
      if (lt > 5 && lt < 15) {
        for (let k = E.arps.length - 1; k >= 0; k--) {
          const at = E.arps[k]; if (at > t) continue; if (t - at > 0.5) break;
          const e = G.edges[Math.floor(hash1(at * 77) * G.edges.length)], pa = pts[e[0]], pb = pts[e[1]]; if (!pa || !pb) continue;
          const q = (t - at) / 0.5; glow(ctx, lerp(pa.x, pb.x, q), lerp(pa.y, pb.y, q), 30, "#fff", 1 - q);
        }
      }
      // nodes
      const ord = pts.map((p, i) => [p, i]).filter((x) => x[0]).sort((a, b) => b[0].z - a[0].z);
      for (const [p, i] of ord) {
        const n = G.nodes[i];
        const ia = prog(lt, n.ig, n.ig + 0.4);
        if (ia <= 0) continue;
        let col = C.cyan, r = 9 * p.s, hi = 1 - prog(lt, n.ig, n.ig + 0.8);
        if (bfsA > 0 && lt > bfsT(i)) { col = lvlCol(G.lvl[i]); const q = prog(lt, bfsT(i), bfsT(i) + 0.7); if (q < 1) { ring(ctx, p.x, p.y, (12 + q * 70) * p.s, col, (1 - q) * bfsA, 2); hi = Math.max(hi, 1 - q); } }
        if (djA > 0 && lt > djT(i)) { col = inPath.has(i) && lt > 24.2 ? "#fff" : C.gold; const q = prog(lt, djT(i), djT(i) + 0.4); hi = Math.max(hi, (1 - q) * 0.8); }
        if ((i === G.s || i === G.tgt) && djA > 0) { col = i === G.s ? C.green : C.red; r *= 1.5; }
        const al = ia * clamp(1.5 - p.z / 1800, 0.35, 1);
        glow(ctx, p.x, p.y, r * 5 * (1 + hi), col, al * (0.5 + hi));
        ctx.globalAlpha = al; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.5, r * 0.45), 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      }
      // dijkstra comet along final path
      if (lt > 24.2 && djA > 0) {
        const q = prog(lt, 24.2, 25.8), segs = G.path.length - 1, f = q * segs, k = Math.min(segs - 1, Math.floor(f)), u = f - k;
        const pa = pts[G.path[k]], pb = pts[G.path[k + 1]];
        if (pa && pb) { const x = lerp(pa.x, pb.x, u), y = lerp(pa.y, pb.y, u); glow(ctx, x, y, 90, C.gold, djA * 1.3); glow(ctx, x, y, 26, "#fff", djA * 1.6); }
        text(ctx, `shortest = ${G.dist[G.tgt]}`, W - 120, 220, { size: 38, weight: 800, font: F.mono, color: C.gold, align: "right", alpha: djA * prog(lt, 25, 25.4) });
      }
      // HUD
      if (bfsA > 0) {
        const L = clamp(Math.floor((lt - 15.2) / 0.55), 0, G.maxL);
        text(ctx, "BFS", 120, 170, { size: 54, weight: 900, font: F.en, color: lvlCol(L), align: "left", alpha: bfsA, ls: 6 });
        text(ctx, `level ${L}`, 120, 225, { size: 30, weight: 600, font: F.mono, color: "#dfe9ff", align: "left", alpha: bfsA });
      }
      if (djA > 0) {
        text(ctx, "DIJKSTRA", 120, 170, { size: 54, weight: 900, font: F.en, color: C.gold, align: "left", alpha: djA, ls: 6 });
        const settled = G.order.filter((u) => lt > djT(u)).length;
        text(ctx, `settled ${settled} / ${G.order.length}`, 120, 225, { size: 30, weight: 600, font: F.mono, color: "#fff2c9", align: "left", alpha: djA });
      }
      // context labels
      const la = prog(lt, 9.6, 10.2) * (1 - prog(lt, 14.4, 15));
      if (la > 0) {
        LABELS.forEach(([ni, cn, en, side], k) => {
          const p = pts[ni]; if (!p) return;
          const q = ease.out(prog(lt, 9.6 + k * 0.5, 10.2 + k * 0.5));
          const lx = p.x + side * 220 * q, ly = p.y - 110 * q;
          neonLine(ctx, [[p.x, p.y], [p.x + side * 60 * q, ly], [lx, ly]], "#ffffff", la * 0.7, 1.4);
          ring(ctx, p.x, p.y, 18, "#fff", la * q, 2);
          text(ctx, cn, lx + side * 14, ly - 18, { size: 34, weight: 800, font: F.cn, color: "#fff", align: side > 0 ? "left" : "right", alpha: la * q });
          text(ctx, en, lx + side * 14, ly + 20, { size: 20, weight: 600, font: F.en, color: C.cyan, align: side > 0 ? "left" : "right", alpha: la * q, ls: 4 });
        });
      }
      // climax words, one per bar
      if (lt > 27) {
        const k = Math.floor((lt - 27) / 2); if (k < WORDS.length) {
          const lb = lt - 27 - k * 2, a = ease.out(prog(lb, 0, 0.18)) * (1 - prog(lb, 1.5, 1.95));
          const sc = 1.25 - ease.outExpo(prog(lb, 0, 0.6)) * 0.25 + lb * 0.03;
          ctx.save(); ctx.translate(W / 2, H / 2 - 30); ctx.scale(sc, sc);
          text(ctx, WORDS[k][0], 0, 0, { size: 150, weight: 900, font: F.en, color: "#ffffff", alpha: a * 0.95, ls: 16 });
          text(ctx, WORDS[k][1], 0, 120, { size: 52, weight: 700, font: F.cn, color: [C.cyan, C.magenta, C.gold][k % 3], alpha: a, ls: 30 });
          ctx.restore();
        }
      }
      const endW = prog(lt, 38.8, 40);
      if (endW > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = ease.in(endW); ctx.fillStyle = "#cfe3ff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      return {};
    },
  });

  // ================================================================ 08 COMPLEXITY (240–276)
  const CURVES = [
    ["O(1)", (n) => 1, C.cyan], ["O(log n)", (n) => Math.log2(n), C.lime], ["O(n)", (n) => n, C.amber],
    ["O(n log n)", (n) => n * Math.log2(n), C.orange], ["O(n²)", (n) => n * n, C.red],
  ];
  const EMB = [["array", "数组", C.cyan], ["list", "链表", C.magenta], ["stack", "栈", C.amber], ["queue", "队列", C.lime],
    ["hash", "哈希表", C.violet], ["tree", "树", C.green], ["heap", "堆", C.orange], ["graph", "图", C.blue]];
  function emblem(ctx, type, col, lt) {
    ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.fillStyle = hexA(col, 0.18);
    const box = (x, y, w, h) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill(); ctx.stroke(); };
    const dot = (x, y, r = 12) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke(); };
    const ln = (a, b, c2, d) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d); ctx.stroke(); };
    if (type === "array") for (let i = 0; i < 4; i++) box(-88 + i * 44, -22, 40, 44);
    if (type === "list") { for (let i = 0; i < 3; i++) { box(-90 + i * 66, -16, 40, 32); if (i < 2) ln(-50 + i * 66, 0, -24 + i * 66, 0); } }
    if (type === "stack") for (let i = 0; i < 4; i++) box(-50, 34 - i * 24, 100, 20);
    if (type === "queue") { ln(-90, -30, 90, -30); ln(-90, 30, 90, 30); for (let i = 0; i < 4; i++) dot(-60 + i * 40 + ((lt * 20) % 40), 0, 13); }
    if (type === "hash") { ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-20, -40); ctx.lineTo(10, 0); ctx.lineTo(-20, 40); ctx.closePath(); ctx.fill(); ctx.stroke(); for (let i = 0; i < 4; i++) { box(40, -42 + i * 22, 44, 18); } }
    if (type === "tree") { const P = [[0, -40], [-50, 5], [50, 5], [-75, 45], [-25, 45], [25, 45], [75, 45]]; [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]].forEach(([a, b]) => ln(P[a][0], P[a][1], P[b][0], P[b][1])); P.forEach((p) => dot(p[0], p[1], 10)); }
    if (type === "heap") { const P = [[0, -40], [-45, 5], [45, 5], [-70, 45], [-20, 45]]; [[0, 1], [0, 2], [1, 3], [1, 4]].forEach(([a, b]) => ln(P[a][0], P[a][1], P[b][0], P[b][1])); P.forEach((p, i) => dot(p[0], p[1], 14 - i * 1.5)); }
    if (type === "graph") { const P = [[-70, -20], [-20, -45], [40, -30], [75, 20], [10, 40], [-50, 35]]; [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 4], [0, 3]].forEach(([a, b]) => ln(P[a][0], P[a][1], P[b][0], P[b][1])); P.forEach((p) => dot(p[0], p[1], 9)); }
    ctx.restore();
  }
  DS.emblem = emblem; DS.EMB = EMB;
  DS.scenes.push({
    t0: 240, t1: 276, card: ["复杂度", "COMPLEXITY", C.red],
    draw(ctx, lt, t) {
      bgFill(ctx, "#0c0b1c", "#020207", W / 2, H * 0.4);
      starfield(ctx, t, { drift: 5, a: 0.4 * prog(lt, 3, 6) });
      // -------- chart
      const chA = prog(lt, 3.4, 4.2) * (1 - prog(lt, 13.6, 14.2));
      if (chA > 0) {
        const x0 = 300, x1 = 1560, yb = 840, yt = 230;
        const N = Math.exp(lerp(Math.log(16), Math.log(1024), ease.io(prog(lt, 9.8, 13.4))));
        const ymax = N * Math.log2(N) * 1.15;
        const axP = ease.out(prog(lt, 3.6, 4.6));
        neonLine(ctx, [[x0, yb], [lerp(x0, x1 + 40, axP), yb]], "#9fb3d9", chA, 2);
        neonLine(ctx, [[x0, yb], [x0, lerp(yb, yt - 60, axP)]], "#9fb3d9", chA, 2);
        text(ctx, "n  (input size · 数据规模)", x1 + 40, yb + 44, { size: 22, weight: 600, font: F.mono, color: "#9fb3d9", align: "right", alpha: chA });
        text(ctx, "operations · 操作次数", x0 + 14, yt - 80, { size: 22, weight: 600, font: F.cn, color: "#9fb3d9", align: "left", alpha: chA });
        text(ctx, `n = ${Math.round(N)}`, x1 + 40, yt - 80, { size: 34, weight: 800, font: F.mono, color: "#fff", align: "right", alpha: chA * prog(lt, 9.6, 10) });
        // label positions without overlap
        const ly = CURVES.map(([, f], k) => [k, Math.max(yt - 40, Math.min(yb - 14, yb - (f(N) / ymax) * (yb - yt)))]).sort((a, b) => b[1] - a[1]);
        for (let i = 1; i < ly.length; i++) if (ly[i - 1][1] - ly[i][1] < 38) ly[i][1] = ly[i - 1][1] - 38;
        const LY = {}; ly.forEach(([k, y]) => (LY[k] = y));
        ctx.save(); ctx.beginPath(); ctx.rect(x0 - 10, yt - 70, x1 - x0 + 200, yb - yt + 80); ctx.clip();
        CURVES.forEach(([lab, f, col], k) => {
          const st = 4.6 + k * 0.9, dp = ease.io(prog(lt, st, st + 0.9)); if (dp <= 0) return;
          const pts = []; const M = 120;
          for (let i = 0; i <= M * dp; i++) { const n = 1 + (N - 1) * (i / M); const y = yb - (f(n) / ymax) * (yb - yt); pts.push([lerp(x0, x1, i / M), Math.max(yt - 80, y)]); }
          neonLine(ctx, pts, col, chA, 3.5);
          const e = pts[pts.length - 1]; glow(ctx, e[0], e[1], 50, col, chA * (dp < 1 ? 1.2 : 0.5));
          const endY = yb - (f(N) / ymax) * (yb - yt);
          if (dp >= 1) text(ctx, lab, x1 + 18, LY[k], { size: 30, weight: 800, font: F.mono, color: col, align: "left", alpha: chA * prog(lt, st + 0.8, st + 1.1) });
        });
        ctx.restore();
        if (lt > 10.5) { const a = chA * prog(lt, 10.5, 11); arrowHead(ctx, 640, yt - 70, -Math.PI / 2, 26, C.red, a); text(ctx, "→ ∞", 680, yt - 70, { size: 34, weight: 800, font: F.mono, color: C.red, align: "left", alpha: a }); }
      }
      // -------- n = 1,000,000 bars
      const brA = prog(lt, 14.0, 14.5) * (1 - prog(lt, 19.6, 20));
      if (brA > 0) {
        const up = ease.inExpo(prog(lt, 16.8, 19.6)) * 2600;
        ctx.save(); ctx.translate(0, up);
        const base = 820, cols = [[520, "O(1)", 1, "1", "1 μs", C.cyan, 6], [820, "O(log n)", 20, "20", "20 μs", C.lime, 40], [1120, "O(n)", 1e6, "1,000,000", "1 s", C.amber, 300], [1420, "O(n²)", 1e12, "1,000,000,000,000", "11.6 天 · days", C.red, 0]];
        const hdA = brA * (1 - clamp(up / 300));
        text(ctx, "n = 1,000,000", W / 2, 200, { size: 64, weight: 900, font: F.mono, color: "#fff", alpha: hdA, ls: 4 });
        text(ctx, "@ 1 μs / op", W / 2, 262, { size: 26, weight: 600, font: F.mono, color: "#9fb3d9", alpha: hdA, ls: 4 });
        cols.forEach(([x, lab, val, str, tm, col, hgt], k) => {
          const gp = ease.out(prog(lt, 14.6 + k * 0.5, 15.4 + k * 0.5));
          let h = hgt * gp; if (k === 3) h = 300 * gp + ease.inExpo(prog(lt, 16.6, 19.6)) * 3200;
          ctx.save(); ctx.globalAlpha = brA;
          const g = ctx.createLinearGradient(0, base - h, 0, base); g.addColorStop(0, hexA(col, 0.95)); g.addColorStop(1, hexA(col, 0.15));
          ctx.fillStyle = g; ctx.fillRect(x - 60, base - h, 120, h); ctx.fillStyle = "#fff"; ctx.fillRect(x - 60, base - h, 120, 3);
          ctx.restore();
          glow(ctx, x, base - h, 140, col, brA * 0.8);
          text(ctx, lab, x, base + 44, { size: 34, weight: 800, font: F.mono, color: col, alpha: brA });
          const shown = k < 3 ? str : (gp > 0 ? Math.round(Math.pow(10, 6 + 6 * ease.in(prog(lt, 16.6, 19.4)))).toLocaleString("en-US") : "0");
          text(ctx, shown, x, base - h - 66, { size: k === 3 ? 38 : 34, weight: 800, font: F.mono, color: "#fff", alpha: brA * gp });
          const tmA = k < 3 ? prog(lt, 15 + k * 0.5, 15.6 + k * 0.5) : prog(lt, 19.0, 19.3);
          text(ctx, tm, x, base - h - 24, { size: k === 3 ? 34 : 24, weight: 800, font: F.cn, color: col, alpha: brA * tmA });
        });
        ctx.restore();
      }
      // -------- the equation (bar 130 = 260 s)
      const eqA = prog(lt, 19.9, 20.05);
      const montage = ease.io(prog(lt, 26, 27.2));
      const collapse = ease.inExpo(prog(lt, 34.6, 36));
      if (eqA > 0) {
        // rays
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(W / 2, 470); ctx.rotate(lt * 0.05);
        for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; ctx.fillStyle = hexA(i % 2 ? C.violet : C.cyan, 0.07 * (1 - collapse)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1400, a - 0.03, a + 0.03); ctx.closePath(); ctx.fill(); }
        ctx.restore();
        const toks = [["算法", C.cyan, 0], [" + ", "#ffffff", 0.5], ["数据结构", C.magenta, 1.0], [" = ", "#ffffff", 1.5], ["程序", C.gold, 2.0]];
        ctx.font = `900 112px ${F.cn}`; ctx.letterSpacing = "6px";
        const ws = toks.map(([s]) => ctx.measureText(s).width); const tot = ws.reduce((a, b) => a + b, 0);
        const sc = lerp(1, 0.55, montage), cy = lerp(470, 175, montage);
        ctx.save(); ctx.translate(W / 2, cy); ctx.scale(sc, sc); ctx.globalAlpha = 1 - collapse;
        let x = -tot / 2;
        toks.forEach(([s, col, dt], k) => {
          const lp = lt - 20 - dt; const w = ws[k];
          if (lp >= 0) {
            const p = ease.outExpo(prog(lp, 0, 0.5)), s2 = lerp(1.7, 1, p);
            ctx.save(); ctx.translate(x + w / 2, 0); ctx.scale(s2, s2);
            text(ctx, s, 0, 0, { size: 112, weight: 900, font: F.cn, color: col, alpha: clamp(p * 2), ls: 6 });
            ctx.restore();
            if (lp < 0.6) { glow(ctx, x + w / 2, 0, 260, col, (1 - lp / 0.6) * 1.2); ring(ctx, x + w / 2, 0, 60 + lp * 500, col, 1 - lp / 0.6, 3); }
          }
          x += w;
        });
        text(ctx, decode("ALGORITHMS + DATA STRUCTURES = PROGRAMS", prog(lt, 22.6, 24.0), 5), 0, 120, { size: 40, weight: 300, font: F.en, color: "#e6f3ff", ls: 8 });
        text(ctx, "— Niklaus Wirth, 1976", 0, 190, { size: 26, weight: 400, font: F.en, color: "#9fb3d9", alpha: prog(lt, 24.0, 24.8) * (1 - montage), ls: 3 });
        ctx.restore();
      }
      // -------- montage ring of all structures
      if (montage > 0) {
        const items = EMB.map(([type, cn, col], i) => {
          const a = i / EMB.length * Math.PI * 2 + (lt - 26) * 0.45;
          const R = 640 * (1 - collapse);
          return { type, cn, col, i, x: W / 2 + Math.cos(a) * R, y: 545 + Math.sin(a) * 135 * (1 - collapse), d: Math.sin(a) };
        }).sort((a, b) => a.d - b.d);
        for (const it of items) {
          const ap = ease.outBack(prog(lt, 26.2 + it.i * 0.25, 26.7 + it.i * 0.25)); if (ap <= 0) continue;
          const s = (0.78 + 0.32 * it.d) * ap * (1 - collapse * 0.6), al = clamp(0.45 + 0.55 * (it.d + 1) / 2) * (1 - collapse * 0.3);
          ctx.save(); ctx.translate(it.x, it.y); ctx.scale(s, s); ctx.globalAlpha = al;
          glow(ctx, 0, 0, 160, it.col, 0.5);
          emblem(ctx, it.type, it.col, lt);
          text(ctx, it.cn, 0, 92, { size: 30, weight: 800, font: F.cn, color: "#fff", ls: 4 });
          text(ctx, it.type.toUpperCase(), 0, 126, { size: 18, weight: 600, font: F.mono, color: it.col, ls: 6 });
          ctx.restore();
        }
      }
      if (collapse > 0) { glow(ctx, W / 2, 545, 200 + collapse * 900, "#ffffff", collapse * 1.4); }
      return {};
    },
  });

  // ================================================================ FINALE (276–300)
  DS.scenes.push({
    t0: 276, t1: 300,
    draw(ctx, lt, t) {
      bgFill(ctx, "#0b0f2c", "#010108");
      starfield(ctx, t, { drift: 8, a: 0.8 });
      const c = kf(lt, [[0, { dist: 60, pitch: 1.0, yaw: 2 }], [3.5, { dist: 1500, pitch: 0.9, yaw: 2.4 }, ease.outExpo], [24, { dist: 2100, pitch: 0.75, yaw: 3.6 }]]);
      const cam = cam3({ ...c, fov: 900 });
      const dim = 1 - 0.55 * prog(lt, 5.5, 7) * (1 - prog(lt, 11, 12)) - 0.45 * prog(lt, 12, 13);
      bitGalaxy(ctx, lt, t, { cam, spawn: () => -1, colorA: C.cyan, colorB: C.magenta, alpha: dim });
      glow(ctx, W / 2, H / 2, 900 * (1 - prog(lt, 0, 2)), "#ffffff", 1 - prog(lt, 0, 1.5));
      // statement
      const sa = prog(lt, 6.4, 7.0) * (1 - prog(lt, 11.2, 11.8));
      if (sa > 0) {
        const sp = ease.outExpo(prog(lt, 6.4, 8.4));
        ctx.font = `900 150px ${F.cn}`;
        const g = ctx.createLinearGradient(-500, 0, 500, 0); g.addColorStop(0, C.cyan); g.addColorStop(0.5, "#ffffff"); g.addColorStop(1, C.magenta);
        ctx.save(); ctx.translate(W / 2, H / 2 - 40); const sc = 1 + lt * 0.004; ctx.scale(sc, sc);
        text(ctx, "结构，即思想", lerp(30, 12, sp), 0, { size: 150, weight: 900, font: F.cn, color: g, alpha: sa, ls: lerp(60, 24, sp) });
        text(ctx, decode("STRUCTURE IS THOUGHT", prog(lt, 7.0, 8.4), 9), 0, 140, { size: 46, weight: 300, font: F.en, color: "#e2f2ff", alpha: sa, ls: 26 });
        ctx.restore();
      }
      // final title lockup (bar 144 = 288 s)
      const fa = prog(lt, 12.0, 12.5);
      if (fa > 0) {
        const lp = lt - 12;
        for (let k = 0; k < 2; k++) { const p = prog(lp, k * 0.1, 1.6 + k * 0.4); ring(ctx, W / 2, H / 2 - 40, p * 1400, k ? C.magenta : "#fff", (1 - p) * 0.8, 5 - k * 2); }
        const ls = lerp(70, 30, ease.outExpo(prog(lp, 0, 3)));
        ctx.save(); ctx.translate(W / 2, H / 2 - 60); const sc = 1 + lp * 0.006; ctx.scale(sc, sc);
        ctx.font = `900 190px ${F.cn}`; ctx.letterSpacing = ls + "px"; const tw = ctx.measureText("数据结构").width;
        const g = ctx.createLinearGradient(-tw / 2, 0, tw / 2, 0); g.addColorStop(0, C.cyan); g.addColorStop(0.35, "#ffffff"); g.addColorStop(0.7, C.violet); g.addColorStop(1, C.magenta);
        text(ctx, "数据结构", ls / 2, 0, { size: 190, weight: 900, font: F.cn, color: g, alpha: fa, ls });
        text(ctx, decode("DATA STRUCTURES", prog(lp, 0.3, 1.6), 4), 0, -160, { size: 50, weight: 300, font: F.en, color: "#e2f2ff", alpha: fa, ls: 30 });
        const lw = ease.outExpo(prog(lp, 0.8, 2.0)) * 760; ctx.fillStyle = hexA(C.cyan, fa); ctx.fillRect(-lw / 2, 135, lw, 2);
        text(ctx, "思想的建筑学  ·  THE ARCHITECTURE OF THOUGHT", 0, 185, { size: 28, weight: 400, font: F.cn, color: "#c9d8ff", alpha: fa * prog(lp, 1.2, 2.2), ls: 8 });
        ctx.restore();
        const ca = prog(lp, 2.6, 3.6);
        text(ctx, "WRITTEN · DESIGNED · SCORED BY CLAUDE OPUS 5.5", W / 2, H - 200, { size: 20, weight: 600, font: F.mono, color: "#8fa3cc", alpha: ca, ls: 6 });
        text(ctx, "ORIGINAL SYNTHESIZED SCORE · 120 BPM · A MINOR · 2026", W / 2, H - 165, { size: 18, weight: 500, font: F.mono, color: "#6d7fa6", alpha: ca, ls: 5 });
      }
      return { letterbox: ease.io(prog(lt, 14, 18)), flash: 0.8 };
    },
  });
})();
