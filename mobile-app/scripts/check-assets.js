#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const required = [
  { file: 'icon.png', width: 1024, height: 1024 },
  { file: 'splash.png', width: 1284, height: 2778 },
  { file: 'favicon.png', width: 48, height: 48 }
];

function readPngDimensions(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const header = Buffer.alloc(24);
  try {
    const bytes = fs.readSync(fd, header, 0, 24, 0);
    if (bytes < 24) throw new Error('file too small to be valid PNG');
    const pngSig = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
    if (!header.slice(0,8).equals(pngSig)) throw new Error('not a PNG');
    const width = header.readUInt32BE(16);
    const height = header.readUInt32BE(20);
    return { width, height };
  } finally {
    fs.closeSync(fd);
  }
}

let errors = 0;
console.log('Checking mobile app assets in', assetsDir);

for (const req of required) {
  const p = path.join(assetsDir, req.file);
  if (!fs.existsSync(p)) {
    console.error(`✖ Missing asset: ${req.file} — expected at ${p}`);
    errors++;
    continue;
  }
  try {
    const dims = readPngDimensions(p);
    if (dims.width !== req.width || dims.height !== req.height) {
      console.error(`✖ Wrong dimensions for ${req.file}: found ${dims.width}x${dims.height}, expected ${req.width}x${req.height}`);
      errors++;
    } else {
      console.log(`✔ ${req.file}: ${dims.width}x${dims.height}`);
    }
  } catch (err) {
    console.error(`✖ Could not validate ${req.file}: ${err.message}`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\nAsset check failed: ${errors} issue(s). Please add/replace files in ${assetsDir}`);
  process.exit(1);
}

console.log('\nAll required assets present and valid.');
process.exit(0);
