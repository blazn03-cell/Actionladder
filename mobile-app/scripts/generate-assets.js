#!/usr/bin/env node
// Generate PNG assets from SVG placeholders using sharp
// Usage: node scripts/generate-assets.js

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const assetsDir = path.join(process.cwd(), 'assets');
const mappings = [
  { src: 'icon.svg', dest: 'icon.png', width: 1024, height: 1024 },
  { src: 'splash.svg', dest: 'splash.png', width: 1284, height: 2778 },
  { src: 'favicon.svg', dest: 'favicon.png', width: 48, height: 48 },
];

async function run() {
  if (!fs.existsSync(assetsDir)) {
    console.error('Assets folder not found:', assetsDir);
    process.exit(1);
  }

  for (const m of mappings) {
    const src = path.join(assetsDir, m.src);
    const dest = path.join(assetsDir, m.dest);
    if (!fs.existsSync(src)) {
      console.warn('Skipping missing source:', src);
      continue;
    }

    try {
      await sharp(src)
        .resize(m.width, m.height, { fit: 'cover' })
        .png({ quality: 90 })
        .toFile(dest);
      console.log('Wrote', dest);
    } catch (err) {
      console.error('Failed to convert', src, err);
    }
  }
}

run();
