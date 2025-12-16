const fs = require('fs');
const path = require('path');

// Simple SVG to use as placeholder
const createSVG = (size, letter) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${letter}</text>
</svg>
`.trim();

const publicDir = path.join(__dirname, '..', 'public');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create SVG icons (browsers will render them fine)
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createSVG(192, 'خ'));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createSVG(512, 'خ'));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-192x192.png'), createSVG(192, 'خ'));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createSVG(512, 'خ'));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createSVG(180, 'خ'));

console.log('✅ Icons generated successfully in public/ directory');
console.log('Note: These are placeholder SVG files. Replace with proper PNG icons later.');
