#!/usr/bin/env node

/**
 * Generate PWA icons from SVG
 * This script generates PNG icons from the SVG source
 */

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const iconSizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'icon-maskable-192x192.png', size: 192 },
  { name: 'icon-maskable-512x512.png', size: 512 },
];

async function generateIcons() {
  const svgPath = join(rootDir, 'public', 'icons', 'icon.svg');
  const outputDir = join(rootDir, 'public', 'icons');

  // Check if SVG exists
  if (!existsSync(svgPath)) {
    console.error('❌ Error: icon.svg not found at', svgPath);
    process.exit(1);
  }

  console.log('🎨 Generating PWA icons from SVG...\n');

  // Try to import sharp
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (error) {
    console.error('❌ Error: sharp is not installed\n');
    console.log('To generate icons, install sharp:');
    console.log('  yarn add -D sharp');
    console.log('  npm install -D sharp\n');
    console.log('Or use one of the alternative methods in public/icons/README.md');
    process.exit(1);
  }

  // Generate each icon
  for (const icon of iconSizes) {
    try {
      const outputPath = join(outputDir, icon.name);
      await sharp(svgPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${icon.name} (${icon.size}×${icon.size})`);
    } catch (error) {
      console.error(`❌ Error generating ${icon.name}:`, error.message);
    }
  }

  console.log('\n✨ Icon generation complete!');
  console.log('\nNext steps:');
  console.log('1. Review generated icons in public/icons/');
  console.log('2. Run: yarn build');
  console.log('3. Test PWA installation');
}

generateIcons().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
