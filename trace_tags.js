import fs from 'fs';
const content = fs.readFileSync('c:/Projects/Khuyoot App/Code/khuyoot/pages/Account.tsx', 'utf8');

const tagRegex = /<(\/?[a-zA-Z0-9]+)(\s[^>]*)?>/g;
let stack = [];
let match;
const selfClosing = ['img', 'input', 'br', 'hr', 'link', 'meta'];

while ((match = tagRegex.exec(content)) !== null) {
    let tagName = match[1];
    let fullTag = match[0];
    
    if (fullTag.endsWith('/>')) continue;
    if (selfClosing.includes(tagName)) continue;
    
    if (tagName.startsWith('/')) {
        let name = tagName.substring(1);
        if (stack.length === 0) {
            console.log(`Extra closing tag </${name}> at line ${content.substring(0, match.index).split('\n').length}`);
        } else {
            stack.pop();
        }
    } else {
        stack.push({name: tagName, line: content.substring(0, match.index).split('\n').length});
    }
}

console.log('Unclosed tags:', stack);
