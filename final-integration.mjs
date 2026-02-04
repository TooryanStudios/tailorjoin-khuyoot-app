import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "src/pages/DesignerV2_1/DesignerV2_1.tsx");

// Read the file
let content = fs.readFileSync(filePath, "utf-8");

// Check if already fully integrated with proper JSX
if (content.includes('          <GenerationHistoryBlock className="mt-6" />\n\n          {/* Full Size Comparison')) {
  console.log("✓ GenerationHistoryBlock is properly integrated with correct JSX");
  process.exit(0);
}

// Check if it has the broken version
if (content.includes('} */>') || content.includes('} */}')) {
  console.log("! Found broken JSX syntax, fixing...");
  
  // Fix broken syntax
  content = content.replace(/} \*\/\}/g, "");
  content = content.replace(/} \*\/>/g, "");
  
  fs.writeFileSync(filePath, content, "utf-8");
  console.log("✓ Fixed broken syntax");
  process.exit(0);
}

// Look for the HistoryFilmstrip closing pattern
const pattern = /(\n          \))\s*(\n\n          \{\/\* Full Size Comparison)/;

if (!pattern.test(content)) {
  console.log("✗ Could not find insertion point - pattern not found");
  process.exit(1);
}

// Insert the component with proper JSX
const replacement = '$1\n\n          {/* Generation History Block - full featured display */}\n          <GenerationHistoryBlock className="mt-6" />$2';
const newContent = content.replace(pattern, replacement);

// Verify the change was made
if (newContent === content) {
  console.log("✗ Replacement failed - no changes made");
  process.exit(1);
}

// Write the file
fs.writeFileSync(filePath, newContent, "utf-8");
console.log("✓ GenerationHistoryBlock integrated successfully!");
console.log("✓ Component will display generation history in Designer V2.1");
