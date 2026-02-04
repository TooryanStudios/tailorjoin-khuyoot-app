const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/DesignerV2_1/DesignerV2_1.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Check if GenerationHistoryBlock is already in JSX
if (content.includes('<GenerationHistoryBlock className="mt-6" />')) {
  console.log(' GenerationHistoryBlock component already added');
  process.exit(0);
}

// Find the closing bracket of HistoryFilmstrip with proper context
const pattern = /(\}\))\s*\n\s*(\{\/\* Full Size Comparison Section)/;

if (!pattern.test(content)) {
  console.log(' Could not find insertion point');
  process.exit(1);
}

// Perform the replacement
const replacement = '$1\n\n          {/* Generation History Block - full featured display */}\n          <GenerationHistoryBlock className="mt-6" />\n\n          $2';
const newContent = content.replace(pattern, replacement);

// Write the modified content
fs.writeFileSync(filePath, newContent, 'utf-8');
console.log(' GenerationHistoryBlock component added successfully!');
