/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const svgPath = path.join(publicDir, 'icon.svg');

async function generateIcons() {
  try {
    // Read SVG file
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate 192x192 icon
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192x192.png'));

    console.log('✓ Generated icon-192x192.png');

    // Generate 512x512 icon
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512x512.png'));

    console.log('✓ Generated icon-512x512.png');

    console.log('✓ All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
