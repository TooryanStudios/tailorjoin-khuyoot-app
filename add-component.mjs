import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "src/pages/DesignerV2_1/DesignerV2_1.tsx");

// Read the file
let content = fs.readFileSync(filePath, "utf-8");

// Pattern to find: closing ) of HistoryFilmstrip followed by comment for Full Size Comparison
const searchPattern = /(\s+\}\))\s*\n\s*(\{\*\/\* Full Size Comparison Section)/;

// Check if GenerationHistoryBlock is already added
if (content.includes('<GenerationHistoryBlock className="mt-6" />')) {
  console.log(" GenerationHistoryBlock already integrated!");
  process.exit(0);
}

// Check if pattern exists
if (!searchPattern.test(content)) {
  console.log(" Could not find insertion pattern in file");
  console.log("Trying alternative approach...");
  
  // Try finding just the HistoryFilmstrip closing
  const altPattern = /(<\/HistoryFilmstrip>)\s*\n\s*(\{\*\/\* Full Size)/;
  if (altPattern.test(content)) {
    console.log(" Found alternative pattern");
    const replacement = '$1\n\n          {/* Generation History Block - full featured display */}\n          <GenerationHistoryBlock className="mt-6" />\n\n          $2';
    const newContent = content.replace(altPattern, replacement);
    fs.writeFileSync(filePath, newContent, "utf-8");
    console.log(" GenerationHistoryBlock component added!");
  } else {
    console.log(" Could not find any suitable insertion point");
    process.exit(1);
  }
} else {
  const replacement = '$1\n\n          {/* Generation History Block - full featured display */}\n          <GenerationHistoryBlock className="mt-6" />\n\n          $2';
  const newContent = content.replace(searchPattern, replacement);
  fs.writeFileSync(filePath, newContent, "utf-8");
  console.log(" GenerationHistoryBlock component added!");
}
