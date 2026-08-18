/**
 * Copies the tesseract.js runtime assets from node_modules into /public so
 * the browser loads them from YOUR deployment instead of external CDNs.
 *
 * Runs automatically after `npm install` (see "postinstall" in package.json),
 * so fresh clones and CI/CD deployments always have the assets.
 *
 * Self-hosted layout:
 *   public/tesseract/worker.min.js            (tesseract.js worker)
 *   public/tesseract/core/*.wasm.js|*.wasm    (WASM cores - right one auto-picked)
 *   public/tesseract/lang/eng.traineddata.gz  (English language data - committed to git)
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "tesseract");
const coreDir = path.join(outDir, "core");
const langDir = path.join(outDir, "lang");

fs.mkdirSync(coreDir, { recursive: true });
fs.mkdirSync(langDir, { recursive: true });

// 1) worker
const workerSrc = path.join(
  root,
  "node_modules",
  "tesseract.js",
  "dist",
  "worker.min.js",
);
fs.copyFileSync(workerSrc, path.join(outDir, "worker.min.js"));
console.log("✔ copied worker.min.js");

// 2) WASM cores — only the single-file *.wasm.js variants are fetched by the
//    worker (it auto-picks the right one based on browser SIMD support).
const coreSrcDir = path.join(root, "node_modules", "tesseract.js-core");
let coreCount = 0;
for (const f of fs.readdirSync(coreSrcDir)) {
  if (f.startsWith("tesseract-core") && f.endsWith(".wasm.js")) {
    fs.copyFileSync(path.join(coreSrcDir, f), path.join(coreDir, f));
    coreCount++;
  }
}
console.log(`✔ copied ${coreCount} core files`);

// 3) language data — warn if missing (it is committed to git, not in node_modules)
const langFile = path.join(langDir, "eng.traineddata.gz");
if (fs.existsSync(langFile)) {
  console.log("✔ eng.traineddata.gz present");
} else {
  console.warn(
    "⚠ public/tesseract/lang/eng.traineddata.gz is MISSING.\n" +
      "  Download it once and commit it:\n" +
      "  curl -L -o public/tesseract/lang/eng.traineddata.gz https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz",
  );
}
