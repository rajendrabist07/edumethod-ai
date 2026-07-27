const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/brand/logo-mark.svg');
const publicDir = path.join(__dirname, '../public');

async function build() {
  const svgBuffer = fs.readFileSync(svgPath);

  // Favicon 16x16
  await sharp(svgBuffer).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('favicon-16x16.png generated');

  // Favicon 32x32
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('favicon-32x32.png generated');

  // Apple Touch Icon 180x180
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('apple-touch-icon.png generated');

  // Android Chrome 192x192
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'android-chrome-192x192.png'));
  console.log('android-chrome-192x192.png generated');

  // Android Chrome 512x512
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'android-chrome-512x512.png'));
  console.log('android-chrome-512x512.png generated');

  // Maskable Icon (pad the 512x512 icon for safe zone)
  await sharp(svgBuffer)
    .resize(384, 384)
    .extend({ top: 64, bottom: 64, left: 64, right: 64, background: { r: 11, g: 13, b: 20, alpha: 1 } }) // #0B0D14
    .png()
    .toFile(path.join(publicDir, 'maskable-icon.png'));
  console.log('maskable-icon.png generated');

  // Simple copy for favicon.ico (most modern browsers just use the 32x32 png if specified in meta)
  fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.ico'));
  console.log('favicon.ico copied');
}

build().catch(console.error);
