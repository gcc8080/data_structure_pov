// Frame-exact export: node tools/render.mjs [fps=30] [workers=2]
// Renders every frame headlessly via DS.render(t) and pipes JPEGs into ffmpeg.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import { spawn } from "child_process"; import fs from "fs"; import path from "path";
const FPS = +(process.argv[2] || 30), WORKERS = +(process.argv[3] || 2), DUR = 300;
const N = Math.round(DUR * FPS); fs.mkdirSync("build", { recursive: true });
async function worker(k) {
  const f0 = Math.floor((k * N) / WORKERS), f1 = Math.floor(((k + 1) * N) / WORKERS);
  const out = `build/seg${k}.mp4`;
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-threads", "1", out], { stdio: ["pipe", "inherit", "inherit"] });
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on("pageerror", (e) => console.log("PAGEERR", e.message));
  await p.goto("file://" + path.resolve("src/index.html") + "?export=1");
  await p.evaluate(() => window.READY);
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    const url = await p.evaluate((t) => window.renderAt(t, 0.95), f / FPS);
    const buf = Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if ((f - f0) % 300 === 0) console.log(`w${k} ${f - f0}/${f1 - f0} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on("close", r)); await b.close();
  return out;
}
const segs = await Promise.all(Array.from({ length: WORKERS }, (_, k) => worker(k)));
fs.writeFileSync("build/segs.txt", segs.map((s) => `file '${path.resolve(s)}'`).join("\n"));
console.log("DONE", segs);
