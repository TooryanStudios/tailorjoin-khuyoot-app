import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "src/pages/DesignerV2_1/DesignerV2_1.tsx");

// Read the file
let content = fs.readFileSync(filePath, "utf-8");

// Check if already added
if (content.includes('          <GenerationHistoryBlock className="mt-6" />')) {
  console.log(" GenerationHistoryBlock already integrated");
  process.exit(0);
}

// Find the exact location: after HistoryFilmstrip closing )
// Look for the pattern:           )}
// Followed by blank line and then {/* Full Size Comparison Section */}
const pattern = /(\n          \))\s*(\n\n          \{\*\/\* Full Size Comparison)/;

if (!pattern.test(content)) {
  console.log(" Could not find insertion point");
  process.exit(1);
}

// Do the replacement with proper JSX
const replacement = '$1\n\n          {/* Generation History Block - full featured display */}\n          <GenerationHistoryBlock className="mt-6" />$2';
const newContent = content.replace(pattern, replacement);

// Write the file
fs.writeFileSync(filePath, newContent, "utf-8");
console.log(" Successfully integrated GenerationHistoryBlock!");
