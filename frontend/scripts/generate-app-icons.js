/**
 * Generates app icon, adaptive icon, and splash icon from the source logo.
 * Run from frontend: node scripts/generate-app-icons.js
 * Preserves quality: center-crops to square, outputs 1024x1024 PNG (no unnecessary upscale).
 */
const path = require('path');
const fs = require('fs');

const SIZE = 1024;
const frontendDir = path.join(__dirname, '..');
const logoPath = path.join(frontendDir, '..', 'image', 'packing logo.jpg');
const outDir = path.join(frontendDir, 'assets', 'images');

if (!fs.existsSync(logoPath)) {
  console.error('Logo not found at:', logoPath);
  process.exit(1);
}

async function main() {
  const sharp = require('sharp');
  const image = sharp(logoPath);
  const meta = await image.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (!w || !h) {
    console.error('Could not read image dimensions');
    process.exit(1);
  }
  const size = Math.min(w, h);
  const left = Math.floor((w - size) / 2);
  const top = Math.floor((h - size) / 2);
  const pngBuffer = await image
    .extract({ left, top, width: size, height: size })
    .resize(SIZE, SIZE)
    .png({ compressionLevel: 0 })
    .toBuffer();
  await Promise.all([
    fs.promises.writeFile(path.join(outDir, 'icon.png'), pngBuffer),
    fs.promises.writeFile(path.join(outDir, 'adaptive-icon.png'), pngBuffer),
    fs.promises.writeFile(path.join(outDir, 'splash-icon.png'), pngBuffer),
  ]);
  console.log('Generated icon.png, adaptive-icon.png, splash-icon.png (1024x1024) in', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
