const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function ensureDir(dir) {
  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function main() {
  const src = path.resolve(__dirname, '../assets/images/icon.png');
  if (!fs.existsSync(src)) {
    console.error('Source image not found:', src);
    process.exit(1);
  }

  const outDir = path.resolve(__dirname, '../assets/images');
  await ensureDir(outDir);

  const bgColor = '#2f8f3e';

  const tasks = [
    // Adaptive foreground (optional; app uses icon.png + backgroundColor)
    sharp(src)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outDir, 'adaptive-foreground.png')),

    // Adaptive background (solid color)
    sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 3,
        background: bgColor
      }
    })
      .png()
      .toFile(path.join(outDir, 'adaptive-background.png')),

    // favicon (64x64)
    sharp(src)
      .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outDir, 'favicon.png'))
  ];

  try {
    await Promise.all(tasks);
    console.log('Generated icons in', outDir);
  } catch (err) {
    console.error('Failed to generate icons:', err);
    process.exit(1);
  }
}

main();

