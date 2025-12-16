import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public', 'og');
const svgPath = join(publicDir, 'khuyoot-og.svg');
const jpgPath = join(publicDir, 'khuyoot-og.jpg');

async function convertSvgToJpg() {
  try {
    console.log('📥 Reading SVG file...');
    const svgBuffer = readFileSync(svgPath);
    
    console.log('🔄 Converting SVG to JPG with optimization...');
    const jpgBuffer = await sharp(svgBuffer)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();
    
    console.log('💾 Saving optimized JPG...');
    writeFileSync(jpgPath, jpgBuffer);
    
    const sizeInKB = (jpgBuffer.length / 1024).toFixed(2);
    console.log(`✅ Successfully created ${jpgPath}`);
    console.log(`📊 File size: ${sizeInKB} KB`);
    
    if (jpgBuffer.length > 300 * 1024) {
      console.warn('⚠️  Warning: File size exceeds 300KB. Consider reducing quality.');
    } else {
      console.log('✅ File size is optimal for web sharing!');
    }
  } catch (error) {
    console.error('❌ Error converting SVG to JPG:', error);
    process.exit(1);
  }
}

convertSvgToJpg();
