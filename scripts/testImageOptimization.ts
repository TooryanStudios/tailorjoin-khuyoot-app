/**
 * Test Image Optimization
 * 
 * This script tests the image optimization utilities to verify:
 * 1. WebP support detection
 * 2. URL generation for optimized thumbnails
 * 3. Bandwidth savings calculations
 */

import { 
  getOptimizedImageUrl, 
  supportsWebP, 
  calculateBandwidthSavings,
  getEstimatedFileSize 
} from '../src/utils/imageOptimization';

// Sample Firebase Storage URLs for testing
const sampleUrls = [
  'https://firebasestorage.googleapis.com/v0/b/khuyoot-app.appspot.com/o/templates%2Ftemplate-123.jpg?alt=media&token=abc123',
  'https://firebasestorage.googleapis.com/v0/b/khuyoot-app.appspot.com/o/productImages%2Fproduct-456.png?alt=media',
  'https://firebasestorage.googleapis.com/v0/b/khuyoot-app.appspot.com/o/userUploads%2Fuser-789%2Fimage.jpeg?alt=media&token=xyz789',
];

console.log('🧪 Image Optimization Test\n');
console.log('='.repeat(60));

// Test 1: WebP Support
console.log('\n📊 Test 1: WebP Support Detection');
console.log('-'.repeat(60));
const webpSupported = supportsWebP();
console.log(`WebP Supported: ${webpSupported ? '✅ Yes' : '❌ No'}`);

// Test 2: URL Generation
console.log('\n🔗 Test 2: Optimized URL Generation');
console.log('-'.repeat(60));

sampleUrls.forEach((url, idx) => {
  console.log(`\nSample ${idx + 1}:`);
  console.log(`Original URL: ${url}`);
  
  const thumbnail = getOptimizedImageUrl(url, 'thumbnail');
  const medium = getOptimizedImageUrl(url, 'medium');
  const large = getOptimizedImageUrl(url, 'large');
  
  console.log(`  📸 Thumbnail (300x400): ${thumbnail}`);
  console.log(`  🖼️  Medium (600x800):   ${medium}`);
  console.log(`  🎨 Large (1200x1600):  ${large}`);
});

// Test 3: File Size Estimates
console.log('\n📏 Test 3: Estimated File Sizes');
console.log('-'.repeat(60));
console.log(`Original JPEG: ${getEstimatedFileSize('original')}KB`);
console.log(`Thumbnail WebP (300x400): ${getEstimatedFileSize('thumbnail')}KB`);
console.log(`Medium WebP (600x800): ${getEstimatedFileSize('medium')}KB`);
console.log(`Large WebP (1200x1600): ${getEstimatedFileSize('large')}KB`);

// Test 4: Bandwidth Savings
console.log('\n💰 Test 4: Bandwidth Savings Calculations');
console.log('-'.repeat(60));

const scenarios = [
  { name: 'Template Picker (20 images)', count: 20, size: 'thumbnail' as const },
  { name: 'Preview Modal (5 images)', count: 5, size: 'medium' as const },
  { name: 'Try-On Canvas (1 image)', count: 1, size: 'large' as const },
];

scenarios.forEach(({ name, count, size }) => {
  console.log(`\n${name}:`);
  const savings = calculateBandwidthSavings(count, size);
  console.log(`  Original Size:  ${savings.originalSize}`);
  console.log(`  Optimized Size: ${savings.optimizedSize}`);
  console.log(`  Savings:        ${savings.savings} (${savings.savingsPercent})`);
  console.log(`  Speed Increase: ${savings.speedupFactor} faster`);
});

// Test 5: Edge Cases
console.log('\n🔍 Test 5: Edge Cases');
console.log('-'.repeat(60));

const edgeCases = [
  { name: 'Null URL', url: null },
  { name: 'Undefined URL', url: undefined },
  { name: 'Blob URL', url: 'blob:http://localhost:3000/abc-123' },
  { name: 'Data URL', url: 'data:image/png;base64,iVBORw0KGgoAAAANS' },
  { name: 'Invalid URL', url: 'not-a-valid-url' },
  { name: 'Non-Firebase URL', url: 'https://example.com/image.jpg' },
];

edgeCases.forEach(({ name, url }) => {
  const result = getOptimizedImageUrl(url as any, 'thumbnail');
  console.log(`${name}: ${result || '(null)'}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed!\n');

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testImageOptimization = {
    getOptimizedImageUrl,
    supportsWebP,
    calculateBandwidthSavings,
    getEstimatedFileSize,
  };
  console.log('💡 Tip: Test functions are available in browser console as window.testImageOptimization');
}
