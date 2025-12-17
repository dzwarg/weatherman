# PWA Icons

This directory contains the PWA icons for the Weatherman application.

## Required Icons

The following icons are required for the PWA:

- `icon-192x192.png` - Standard PWA icon (192×192)
- `icon-512x512.png` - Large PWA icon (512×512)
- `icon-maskable-192x192.png` - Maskable icon for Android (192×192)
- `icon-maskable-512x512.png` - Maskable icon for Android (512×512)
- `icon.svg` - Favicon and fallback icon

## Generating Icons

You can generate the PNG icons from the SVG using one of these methods:

### Method 1: Using @svgr/cli and sharp (Recommended)

```bash
# Install dependencies
yarn add -D sharp sharp-cli

# Generate icons
npx sharp-cli -i public/icons/icon.svg -o public/icons/icon-192x192.png resize 192 192
npx sharp-cli -i public/icons/icon.svg -o public/icons/icon-512x512.png resize 512 512
npx sharp-cli -i public/icons/icon.svg -o public/icons/icon-maskable-192x192.png resize 192 192
npx sharp-cli -i public/icons/icon.svg -o public/icons/icon-maskable-512x512.png resize 512 512
```

### Method 2: Using Online Tools

1. Open [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Upload `icon.svg`
3. Configure settings for PWA
4. Download generated icons
5. Place files in this directory

### Method 3: Using Inkscape (Command Line)

```bash
inkscape public/icons/icon.svg -w 192 -h 192 -o public/icons/icon-192x192.png
inkscape public/icons/icon.svg -w 512 -h 512 -o public/icons/icon-512x512.png
inkscape public/icons/icon.svg -w 192 -h 192 -o public/icons/icon-maskable-192x192.png
inkscape public/icons/icon.svg -w 512 -h 512 -o public/icons/icon-maskable-512x512.png
```

## Maskable Icons

Maskable icons should have:
- Safe zone: 80% of the canvas (centered)
- Padding: 10% on all sides
- The current SVG is designed to work as both standard and maskable

## Design Guidelines

- **Theme**: Weather + Clothing
- **Colors**: Primary blue (#4A90E2), White, Gold (#FFD700)
- **Elements**: Sun, cloud, t-shirt representing the app's purpose
- **Style**: Child-friendly, simple, recognizable

## Current Status

✅ SVG icon created (`icon.svg`)
⚠️ PNG icons need to be generated (see methods above)

The SVG icon is currently being used as a fallback. For optimal PWA installation experience, generate the PNG icons using one of the methods above.
