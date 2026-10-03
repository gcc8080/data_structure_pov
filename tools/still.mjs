// node tools/still.mjs out_dir t1 t2 ...  -> renders PNG stills (for review)
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import fs from "fs"; import path from "path";
const [out, ...ts] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("console", (m) => console.log("console:", m.text())); p.on("pageerror", (e) => console.log("PAGEERR", e.message));
await p.goto("file://" + path.resolve("src/index.html") + "?export=1");
await p.evaluate(() => window.READY);
for (const t of ts) {
  const t0 = Date.now();
  const url = await p.evaluate((t) => window.renderAt(+t, 0.9), t);
  fs.writeFileSync(`${out}/t${String(t).padStart(6, "0")}.jpg`, Buffer.from(url.split(",")[1], "base64"));
  console.log(t, Date.now() - t0, "ms");
}
await b.close();
