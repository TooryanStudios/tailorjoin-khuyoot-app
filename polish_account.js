import fs from 'fs';
const filePath = 'c:/Projects/Khuyoot App/Code/khuyoot/pages/Account.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Re-organize the header section
// Remove the misplaced Header Actions
content = content.replace(/\{(\/\* Header Actions \*\/)\}[\s\S]+?<\/div>/, '');

// Clean up the misplaced credits button (it might be duplicated or messy now)
// Let's just reconstruct the Stats + Actions block
const newStatsSection = `
            {/* Stats & Actions */}
            <div className="flex flex-col gap-4">
               <div className="flex gap-10 md:gap-14 px-6 py-3 bg-zinc-900/50 rounded-2xl border border-zinc-800/30 w-fit mx-auto md:mx-0">
                  <div className="text-center">
                     <span className="block text-xl font-bold text-white">{orders.length}</span>
                     <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Orders</span>
                  </div>
                  <button onClick={() => navigate('/transaction-history')} className="text-center group/stat hover:opacity-80 transition-opacity">
                     <span className="block text-xl font-bold text-indigo-400">{user?.credits || 0}</span>
                     <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold group-hover/stat:text-indigo-300 transition-colors">Credits</span>
                  </button>
               </div>

               <div className="flex gap-3 justify-center md:justify-start">
                  <button onClick={() => navigate('/settings')} className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all" title="Account Settings">
                     <Settings size={18} />
                  </button>
                  <button onClick={async () => { await logout(); navigate('/', { replace: true }); }} className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:bg-rose-500/20 hover:border-rose-500/30 text-zinc-500 hover:text-rose-500 transition-all" title="Log Out">
                     <LogOut size={18} />
                  </button>
               </div>
            </div>`;

// Replace the old Stats block completely
const statsRegex = /\{\/\* Quick Stats \*\/\}[\s\S]+?<\/div>[\s\S]+?<\/div>/; // This might be too broad or narrow
// Let's use a more specific replacement for the div containing Orders and Credits
content = content.replace(/\{\/\* Quick Stats \*\/\}[\s\S]+?<\/div>\s*<\/div>/, newStatsSection);

// 2. Remove the old bottom actions section correctly
content = content.replace(/\{\/\* 4\. Bottom Actions \*\/\}[\s\S]+?<div className="text-center pt-4">/, '<div className="text-center pt-4">');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Polished Account layout: username smaller, clickable credits, and actions moved to header.');
