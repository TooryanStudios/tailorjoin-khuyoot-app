import fs from 'fs';
const content = fs.readFileSync('c:/Projects/Khuyoot App/Code/khuyoot/pages/Account.tsx', 'utf8');

let tagStack = [];
const tagRegex = /<(\/?[a-zA-Z0-9]+)(\s[^>]*)?>/g;
let match;

while ((match = tagRegex.exec(content)) !== null) {
    let tagName = match[1];
    if (tagName.startsWith('/')) {
        let closingName = tagName.substring(1);
        if (tagStack.length === 0) {
            console.log(`Extra closing tag </${closingName}> at index ${match.index}`);
        } else {
            let lastTag = tagStack.pop();
            if (lastTag.name !== closingName) {
                console.log(`Tag mismatch: <${lastTag.name}> (line ${lastTag.line}) closed by </${closingName}> at line ${content.substring(0, match.index).split('\n').length}`);
            }
        }
    } else {
        // Self-closing tags in React usually end with />
        if (!match[0].endsWith('/>')) {
             // Basic list of tags that are often self-closing or handled differently
             const selfClosing = ['img', 'input', 'hr', 'br', 'meta', 'link'];
             if (!selfClosing.includes(tagName)) {
                tagStack.push({name: tagName, line: content.substring(0, match.index).split('\n').length});
             }
        }
    }
}

if (tagStack.length > 0) {
    tagStack.forEach(t => console.log(`Unclosed tag <${t.name}> at line ${t.line}`));
} else {
    console.log('Tags are balanced.');
}
