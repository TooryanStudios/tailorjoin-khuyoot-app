import fs from 'fs';
const filePath = 'c:/Projects/Khuyoot App/Code/khuyoot/pages/Account.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Shrink username
content = content.replace(
    'h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white"',
    'h2 className="text-lg md:text-xl font-bold tracking-tight text-white"'
);

// 2. Make credits clickable
content = content.replace(
    /<div className="text-center">\s+<span className="block text-xl font-bold text-indigo-400">\{user\?\.credits \|\| 0\}<\/span>\s+<span className="text-\[10px\] text-zinc-500 uppercase tracking-widest font-semibold">Credits<\/span>\s+<\/div>/,
    `<button onClick={() => navigate('/transaction-history')} className="text-center group/stat hover:opacity-80 transition-opacity">
                  <span className="block text-xl font-bold text-indigo-400">{user?.credits || 0}</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold group-hover/stat:text-indigo-300 transition-colors">Credits</span>
               </button>`
);

// 3. Move settings/logout to header below stats
const statsSearch = '<div className="flex gap-10 md:gap-14 px-4 py-2 bg-zinc-900/50 rounded-2xl border border-zinc-800/30">';
const statsEndIndex = content.indexOf('</div>', content.indexOf(statsSearch) + statsSearch.length);

if (statsEndIndex !== -1) {
    const afterStats = `
            {/* Header Actions */}
            <div className="flex gap-4 mt-4 justify-center md:justify-start">
               <button onClick={() => navigate('/settings')} className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all shadow-sm" title="Account Settings">
                  <Settings size={18} />
               </button>
               <button onClick={async () => { await logout(); navigate('/', { replace: true }); }} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 transition-all shadow-sm" title="Log Out">
                  <LogOut size={18} />
               </button>
            </div>`;
    
    // We need to insert this AFTER the stats block closing div
    content = content.substring(0, statsEndIndex + 6) + afterStats + content.substring(statsEndIndex + 6);
}

// 4. Remove the old bottom actions section
const bottomActionsStart = content.indexOf('{/* 4. Bottom Actions */}');
const bottomActionsEnd = content.indexOf('</div>', content.indexOf('group', bottomActionsStart) + 10); // Find the end of the second button's div
// Actually let's just use regex to remove the whole section cleanly
content = content.replace(/\{\/\* 4\. Bottom Actions \*\/\}[\s\S]+?<div className="text-center pt-4">/, '<div className="text-center pt-4">');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated Account page layout: smaller name, clickable credits, and moved header actions.');
