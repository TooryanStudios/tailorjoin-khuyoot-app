import fs from 'fs';
const filePath = 'c:/Projects/Khuyoot App/Code/khuyoot/pages/Account.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the missing closing div and indentation
// The main return div (533) is open.
// Inside it:
// Header (536..643) - now closed.
// Actions Grid (645..660) - closed.
// Orders List (663..720) - closed.
// Then line 723: </div> closes 533.

// Wait, I noticed line 643 is intended 3 spaces.
// Let's re-read the file and apply a clean reconstruction of the end.

const lines = content.split(/\r?\n/);
// Clean up trailing empty lines
while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
}

// Ensure the file ends correctly
// Last 3 lines should be:
//     </div>
//   );
// };

// Let's check the current last lines
console.log('Last 5 lines:', lines.slice(-5));

// If brackets are balanced, maybe there's a stray char.
// Let's just rewrite the end carefully.
const lastDivIndex = lines.findLastIndex(l => l.includes('</div>') && l.trim() === '</div>');
// No, that's brittle.

// Let's try to find the "return (" and count from there.
let level = 0;
for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    level += (l.match(/<[a-zA-Z0-9]/g) || []).length;
    level -= (l.match(/<\//g) || []).length;
    level -= (l.match(/\/>/g) || []).length;
}
console.log('Final tag level (should be 0):', level);

// If level is 1, we need one more </div>.
if (level === 1) {
    // Insert before );
    const returnIndex = lines.findLastIndex(l => l.includes(');'));
    if (returnIndex !== -1) {
        lines.splice(returnIndex, 0, '    </div>');
        console.log('Added missing </div> before );');
    }
}

fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
