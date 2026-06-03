// scripts/generate-icon.js — generates all icon assets from code
// Run with: node scripts/generate-icon.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BUILD = path.join(__dirname, '..', 'build');
fs.mkdirSync(BUILD, { recursive: true });

// ── Icon SVG ──────────────────────────────────────────────────
// The WorkQuest logo: an A-frame (mountain peak) mark
// Derived from the in-app SVG: M3 12 L8 4 L13 12 + crossbar M5.5 9 L10.5 9
// in a 16×16 viewBox, scaled to fill the icon

function buildIconSVG(size) {
  const LOGO  = size * 0.60;          // logo occupies 60% of the icon
  const PAD   = (size - LOGO) / 2;   // center it
  const SCALE = LOGO / 16;           // 16-unit viewBox → pixel scale

  const x = (n) => (PAD + n * SCALE).toFixed(2);
  const y = (n) => (PAD + n * SCALE).toFixed(2);

  const TW = (2.5 * SCALE).toFixed(2); // triangle stroke width
  const CW = (2.0 * SCALE).toFixed(2); // crossbar stroke width

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <!-- Full-bleed gradient background (platform applies its own mask) -->
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <!-- A-frame triangle -->
  <polyline
    points="${x(3)},${y(12)} ${x(8)},${y(4)} ${x(13)},${y(12)}"
    stroke="white" stroke-width="${TW}"
    stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- Crossbar -->
  <line
    x1="${x(5.5)}" y1="${y(9)}" x2="${x(10.5)}" y2="${y(9)}"
    stroke="white" stroke-width="${CW}" stroke-linecap="round"/>
</svg>`;
}

function buildSplashSVG(size) {
  const LOGO  = size * 0.28;
  const PAD   = (size - LOGO) / 2;
  const SCALE = LOGO / 16;

  const x = (n) => (PAD + n * SCALE).toFixed(2);
  const y = (n) => (PAD + n * SCALE).toFixed(2);

  const TW = (2.5 * SCALE).toFixed(2);
  const CW = (2.0 * SCALE).toFixed(2);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0d0d1a"/>
  <polyline
    points="${x(3)},${y(12)} ${x(8)},${y(4)} ${x(13)},${y(12)}"
    stroke="#6366f1" stroke-width="${TW}"
    stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <line
    x1="${x(5.5)}" y1="${y(9)}" x2="${x(10.5)}" y2="${y(9)}"
    stroke="#6366f1" stroke-width="${CW}" stroke-linecap="round"/>
</svg>`;
}

async function writePNG(svgStr, outPath, size) {
  await sharp(Buffer.from(svgStr))
    .resize(size, size)
    .png()
    .toFile(outPath);
}

async function main() {
  const { default: pngToIco } = await import('png-to-ico');
  console.log('Generating WorkQuest icons…\n');

  // 1. Master 1024×1024 icon PNG (used by everything)
  const iconSVG = buildIconSVG(1024);
  const masterPath = path.join(BUILD, 'icon.png');
  await writePNG(iconSVG, masterPath, 1024);
  console.log('✓ build/icon.png            1024×1024');

  // 2. Splash screen PNG (2732×2732 covers largest iPad retina)
  const splashSVG = buildSplashSVG(2732);
  await writePNG(splashSVG, path.join(BUILD, 'splash.png'), 2732);
  console.log('✓ build/splash.png          2732×2732');

  // 3. Windows ICO (multi-size, required by electron-builder)
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const icoPNGs = [];
  for (const sz of icoSizes) {
    const buf = await sharp(Buffer.from(buildIconSVG(sz))).resize(sz, sz).png().toBuffer();
    icoPNGs.push(buf);
  }
  const icoBuffer = await pngToIco(icoPNGs);
  fs.writeFileSync(path.join(BUILD, 'icon.ico'), icoBuffer);
  console.log('✓ build/icon.ico            Windows (16–256px)');

  // 4. Extra sizes used by @capacitor/assets and electron-builder
  const extras = { 512: 'icon-512.png', 192: 'icon-192.png' };
  for (const [sz, name] of Object.entries(extras)) {
    await writePNG(buildIconSVG(Number(sz)), path.join(BUILD, name), Number(sz));
    console.log(`✓ build/${name.padEnd(20)} ${sz}×${sz}`);
  }

  console.log('\n✓ All icons generated in build/\n');
  console.log('Next: npx @capacitor/assets generate --iconBackgroundColor "#6366f1" --splashBackgroundColor "#0d0d1a"');
}

main().catch((err) => { console.error(err); process.exit(1); });
