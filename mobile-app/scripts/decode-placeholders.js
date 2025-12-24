#!/usr/bin/env node
// Decode .base64 placeholder files into .png files
import fs from 'fs';
import path from 'path';

const assetsDir = path.join(process.cwd(), 'assets');
const list = [
  'icon.png.base64',
  'splash.png.base64',
  'favicon.png.base64',
];

for (const name of list) {
  const src = path.join(assetsDir, name);
  const dest = path.join(assetsDir, name.replace('.base64', ''));
  if (!fs.existsSync(src)) {
    console.warn('Missing', src);
    continue;
  }
  const b64 = fs.readFileSync(src, 'utf8').trim();
  fs.writeFileSync(dest, Buffer.from(b64, 'base64'));
  console.log('Wrote', dest);
}
