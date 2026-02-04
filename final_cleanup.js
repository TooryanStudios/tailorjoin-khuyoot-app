import fs from 'fs';
const filePath = 'c:/Projects/Khuyoot App/Code/khuyoot/pages/Account.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Correctly remove the old bottom actions section
const bottomActionsStart = content.indexOf('{/* 4. Bottom Actions */}');
if (bottomActionsStart !== -1) {
    // Find the following <div className="text-center pt-4"> which marks the start of the next section
    const nextSectionStart = content.indexOf('<div className="text-center pt-4">', bottomActionsStart);
    if (nextSectionStart !== -1) {
        content = content.substring(0, bottomActionsStart) + content.substring(nextSectionStart);
    }
}

// 2. Double check if we have redundant code fragments
// The file should end with:
/*
      <div className="text-center pt-4">
         <button onClick={() => navigate('/admin')} className="text-[10px] text-zinc-600 hover:text-indigo-400 transition-colors uppercase tracking-[0.2em]">
            Developer Mode
         </button>
      </div>
      
    </div>
  );
};
*/
// Wait, I removed the developer mode before.
// In the recent view_file (line 730), it seems it came back or I didn't remove it properly.
/*
730:          <button onClick={() => navigate('/admin')} className="text-[10px] text-zinc-600 hover:text-indigo-400 transition-colors uppercase tracking-[0.2em]">
731:             Developer Mode
732:          </button>
*/

// Let's just remove that whole footer block as requested.
content = content.replace(/<div className="text-center pt-4">[\s\S]+?<\/div>/, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Final cleanup of Account page: removed redundant bottom actions and developer mode footer.');
