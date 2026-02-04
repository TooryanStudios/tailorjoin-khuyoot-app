import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "src/pages/DesignerV2_1/DesignerV2_1.tsx");

// Read the file
let content = fs.readFileSync(filePath, "utf-8");

// Check if already integrated correctly
if (content.includes('<GenerationHistoryBlock className="mt-6" />')) {
  console.log("✓ GenerationHistoryBlock already integrated");
  process.exit(0);
}

// Find the exact location: after showHistoryFilmstrip block closes
// We need to find the pattern where:
// 1. HistoryFilmstrip closes with )}
// 2. Then blank lines
// 3. Then {features.showFullComparison && (

// Use a simple approach: find the line with HistoryFilmstrip closing }
// and insert after showHistoryFilmstrip block

const lines = content.split("\n");
let insertIndex = -1;

// Find the line that closes HistoryFilmstrip - look for ) that comes after HistoryFilmstrip
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("showHistoryFilmstrip")) {
    // Found the start of the conditional, now find where it closes
    let bracketCount = 0;
    let inConditional = false;
    for (let j = i; j < lines.length; j++) {
      const line = lines[j];
      // Count opening parens after &&
      if (line.includes("&&")) inConditional = true;
      if (inConditional) {
        bracketCount += (line.match(/\(/g) || []).length;
        bracketCount -= (line.match(/\)/g) || []).length;
        // When brackets balance, we've closed the conditional
        if (bracketCount === 0 && line.includes(")")) {
          insertIndex = j + 1;
          break;
        }
      }
    }
    break;
  }
}

if (insertIndex === -1) {
  console.log("✗ Could not find insertion point");
  process.exit(1);
}

// Insert the GenerationHistoryBlock before the showFullComparison
// We'll add it as a standalone component (not wrapped in conditional)
const newLine = "          <GenerationHistoryBlock className=\"mt-6\" />";
lines.splice(insertIndex, 0, newLine);

// Write back
content = lines.join("\n");
fs.writeFileSync(filePath, content, "utf-8");
console.log("✓ GenerationHistoryBlock integrated successfully!");
console.log(`✓ Inserted at line ${insertIndex + 1}`);
