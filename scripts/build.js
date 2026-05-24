#!/usr/bin/env node
const { execSync } = require('child_process')
const fs   = require('fs')
const path = require('path')

const ROOT     = path.resolve(__dirname, '..')
const BACKEND  = path.join(ROOT, 'backend')
const FRONTEND = path.join(ROOT, 'frontend')
const DIST     = path.join(FRONTEND, 'dist')
const PUBLIC   = path.join(BACKEND, 'public')

function run(cmd, cwd) {
  console.log(`\n> ${cmd}  [in ${cwd}]`)
  execSync(cmd, { stdio: 'inherit', cwd })
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name)
    const d = path.join(to, entry.name)
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d)
  }
}

console.log('=== OncoSense Build ===')
console.log('ROOT:', ROOT)
console.log('Node:', process.version)

console.log('\n[1/4] Installing backend deps...')
run('npm install --legacy-peer-deps', BACKEND)

console.log('\n[2/4] Installing frontend deps...')
run('npm install --legacy-peer-deps', FRONTEND)

console.log('\n[3/4] Building frontend...')
run('npx vite build', FRONTEND)

if (!fs.existsSync(DIST)) {
  console.error('ERROR: frontend/dist not found!')
  process.exit(1)
}
console.log('Vite build OK. dist:', fs.readdirSync(DIST))

console.log('\n[4/4] Copying dist → backend/public...')
if (fs.existsSync(PUBLIC)) fs.rmSync(PUBLIC, { recursive: true, force: true })
copyDir(DIST, PUBLIC)

const indexOk = fs.existsSync(path.join(PUBLIC, 'index.html'))
console.log('backend/public:', fs.readdirSync(PUBLIC))
console.log('index.html present:', indexOk)

if (!indexOk) {
  console.error('ERROR: index.html missing!')
  process.exit(1)
}
console.log('\n✅ Build complete')
