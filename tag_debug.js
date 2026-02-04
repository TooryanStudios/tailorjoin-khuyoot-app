import fs from 'fs';
const content = fs.readFileSync('c:/Projects/Khuyoot App/Code/khuyoot/pages/Account.tsx', 'utf8');
const lines = content.split('\n');

let level = 0;
for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const opened = (l.match(/<[a-zA-Z0-9]/g) || []).length;
    const closed = (l.match(/<\//g) || []).length;
    const selfClosed = (l.match(/\/>/g) || []).length;
    
    // Ignore self-closing tags like img, input
    const imgCount = (l.match(/<img/g) || []).length;
    const inputCount = (l.match(/<input/g) || []).length;
    
    const diff = opened - closed - selfClosed;
    level += diff;
    
    if (diff !== 0) {
        // console.log(`Line ${i+1}: level=${level} (opened=${opened}, closed=${closed}, self=${selfClosed}) | ${l.trim().substring(0, 50)}`);
    }
}
console.log('Final level:', level);
