const fs = require('fs');
const filePath = 'C:\\Projects\\Khuyoot App\\Code\\khuyoot-خيوط\\src\\pages\\DesignerV2_1\\DesignerV2_1.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove any existing instances
content = content.replace(/<GenerationHistoryBlock[^>]*\/>/g, '');

// 2. Find the main content area start
const insertionPoint = 'className={lex-1 min-h-0';
if (content.includes(insertionPoint)) {
    const parts = content.split(insertionPoint);
    const afterClassIndex = parts[1].indexOf('>');
    if (afterClassIndex !== -1) {
        const pre = parts[0] + insertionPoint + parts[1].substring(0, afterClassIndex + 1);
        const post = parts[1].substring(afterClassIndex + 1);
        content = pre + '\n          <GenerationHistoryBlock className=\"m-8\" />' + post;
        console.log(\"Component moved to top of scrollable content.\");
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(\"File updated successfully.\");
