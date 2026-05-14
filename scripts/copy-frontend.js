const fs   = require("fs");
const path = require("path");

// Repo root is one level above /scripts/
const src  = path.resolve(__dirname, "..", "frontend", "dist");
const dest = path.resolve(__dirname, "..", "backend", "public");

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath  = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(src)) {
  console.error("❌  frontend/dist not found at:", src);
  console.error("    Did `npm run build --prefix frontend` succeed?");
  process.exit(1);
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}

copyDir(src, dest);

const count = fs.readdirSync(dest).length;
console.log(`✅  Copied frontend/dist → backend/public  (${count} top-level entries)`);
console.log(`    index.html present: ${fs.existsSync(path.join(dest, "index.html"))}`);
