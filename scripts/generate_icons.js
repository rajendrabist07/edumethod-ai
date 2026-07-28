const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Ensure sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.log("Installing sharp...");
  execSync('npm install sharp --no-save', { stdio: 'inherit' });
}

const sharp = require('sharp');
const publicDir = path.join(__dirname, '../public');
const svgPath = path.join(publicDir, 'favicon.svg');

async function generate() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    
    console.log("Generating apple-touch-icon.png (180x180)...");
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    console.log("Generating android-chrome-192x192.png...");
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'android-chrome-192x192.png'));

    console.log("Generating android-chrome-512x512.png...");
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'android-chrome-512x512.png'));

    console.log("Generating maskable-icon.png (512x512 with padding)...");
    await sharp(svgBuffer)
      .resize(400, 400)
      .extend({
        top: 56, bottom: 56, left: 56, right: 56,
        background: { r: 246, g: 248, b: 245, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'maskable-icon.png'));

    console.log("Generating favicon-32x32.png...");
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));

    console.log("Generating favicon-16x16.png...");
    await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16.png'));

    // Try converting 32x32 to .ico using png-to-ico
    try {
      require.resolve('png-to-ico');
    } catch(e) {
      console.log("Installing png-to-ico...");
      execSync('npm install png-to-ico --no-save', { stdio: 'inherit' });
    }
    const pngToIco = require('png-to-ico');
    const buf = await pngToIco(path.join(publicDir, 'favicon-32x32.png'));
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buf);
    console.log("Generated favicon.ico");

    console.log("All favicons successfully generated!");
  } catch (err) {
    console.error("Error generating icons:", err);
  }
}

generate();
