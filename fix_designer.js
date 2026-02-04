import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filePath = 'C:/Projects/Khuyoot App/Code/khuyoot-خيوط/src/pages/DesignerV2_1/DesignerV2_1.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Import
if (!content.includes('GenerationHistoryBlock')) {
    const importSearch = "import { HistoryFilmstrip } from './components/HistoryFilmstrip';";
    const importAdd = "\nimport { GenerationHistoryBlock } from './components/GenerationHistoryBlock';";
    content = content.replace(importSearch, importSearch + importAdd);
    console.log('Import added.');
}

// 2. Add Component
const searchStr = '            deletingItemId={deletingItemId}\n          />\n          )}';
const replaceStr = '            deletingItemId={deletingItemId}\n          />\n          )}\n\n          <GenerationHistoryBlock className="mt-6" />';

if (content.includes(searchStr)) {
    content = content.replace(searchStr, replaceStr);
    console.log('Component added.');
} else {
    // Try with different line endings just in case
    const searchStrCRLF = '            deletingItemId={deletingItemId}\r\n          />\r\n          )}';
    const replaceStrCRLF = '            deletingItemId={deletingItemId}\r\n          />\r\n          )}\r\n\r\n          <GenerationHistoryBlock className="mt-6" />';
    if (content.includes(searchStrCRLF)) {
        content = content.replace(searchStrCRLF, replaceStrCRLF);
        console.log('Component added (CRLF).');
    } else {
        console.log('Could not find component insertion point.');
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('File updated successfully.');
