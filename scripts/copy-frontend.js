#!/usr/bin/env node
const fs   = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const src  = path.join(ROOT, 'frontend', 'dist')
const dest = path.join(ROOT, 'backend', 'public')

console.log('=== copy-frontend ===')
console.log('ROOT :', ROOT)
console.log('src  :', src)
console.log('dest :', dest)
console.log('src exists:', fs.existsSync(src))

if (!fs.existsSync(src)) {
  console.error('ERROR: frontend/dist not found at', src)
  process.exit(1)
}

function copyDir (from, to) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name)
    const d = path.join(to, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true })
  console.log('Cleaned old backend/public')
}

copyDir(src, dest)

const indexExists = fs.existsSync(path.join(dest, 'index.html'))
const count       = fs.readdirSync(dest).length
console.log(`Copied ${count} top-level entries to backend/public`)
console.log('index.html present:', indexExists)

if (!indexExists) {
  console.error('ERROR: index.html missing after copy')
  process.exit(1)
}
console.log('✅ Frontend ready at backend/public/index.html')
