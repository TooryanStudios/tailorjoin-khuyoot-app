import fs from 'fs';
const content = fs.readFileSync('c:/Projects/Khuyoot App/Code/khuyoot/pages/Account.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');
let inJSX = 0;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let j = 0; j < line.length; j++) {
        let char = line[j];
        if (char === '{') stack.push({line: i+1, char: j+1});
        if (char === '}') {
            if (stack.length === 0) {
                console.log(`Extra } at line ${i+1}, char ${j+1}`);
            } else {
                stack.pop();
            }
        }
    }
}

if (stack.length > 0) {
    stack.forEach(s => console.log(`Unclosed { at line ${s.line}, char ${s.char}`));
} else {
    console.log('Brackets are balanced.');
}
