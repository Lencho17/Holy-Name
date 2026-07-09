const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Components', 'AdminPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const navStart = content.indexOf('<nav className="bg-gradient-to-r from-[#F0F7FF] to-[#E0EFFF]');
if (navStart !== -1) {
  const navEnd = content.indexOf('</nav>', navStart) + 6;
  let navContent = content.substring(navStart, navEnd);

  // 1. Nav background (Glassmorphic)
  navContent = navContent.replace(
    `<nav className="bg-gradient-to-r from-[#F0F7FF] to-[#E0EFFF] text-blue-900 shadow-sm border-b border-blue-100 z-50 sticky top-0 w-full">`,
    `<nav className="bg-white/70 backdrop-blur-xl text-blue-950 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-white/50 z-50 sticky top-0 w-full">`
  );

  // 2. Main Navigation Buttons (Rounded Pill, better hovers)
  navContent = navContent.replaceAll(`rounded-xl text-sm font-semibold transition-all flex items-center gap-2`, `rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 px-5 py-2.5`);
  navContent = navContent.replace(`'bg-primary text-white shadow-md' : 'text-blue-800 hover:bg-blue-100/50 hover:text-blue-950'`, `'bg-blue-500/10 text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] border border-blue-200/50' : 'text-blue-800 hover:bg-white/60 hover:shadow-sm hover:text-blue-950 border border-transparent'`);
  navContent = navContent.replaceAll(`'bg-primary/10 text-primary border border-primary/20' : 'text-blue-800 hover:bg-blue-100/50 hover:text-blue-950'`, `'bg-blue-500/10 text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] border border-blue-200/50' : 'text-blue-800 hover:bg-white/60 hover:shadow-sm hover:text-blue-950 border border-transparent'`);
  navContent = navContent.replaceAll(`'bg-amber-50 text-amber-600 border border-amber-200' : 'text-blue-800 hover:bg-blue-100/50 hover:text-blue-950'`, `'bg-amber-500/10 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] border border-amber-200/50' : 'text-blue-800 hover:bg-white/60 hover:shadow-sm hover:text-blue-950 border border-transparent'`);

  // 3. Dropdown styling (Glassmorphic, softer corners)
  navContent = navContent.replaceAll(`bg-white rounded-2xl shadow-2xl border border-gray-100`, `bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/60`);

  // 4. Dropdown Items
  navContent = navContent.replaceAll(`rounded-xl text-sm transition-colors text-left`, `rounded-2xl text-sm transition-all duration-200 text-left`);
  navContent = navContent.replaceAll(`'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-600 font-medium'`, `'bg-blue-50/80 text-blue-700 font-bold shadow-sm' : 'hover:bg-blue-50/50 text-gray-600 font-medium'`);
  navContent = navContent.replaceAll(`'bg-amber-50 text-amber-700 font-bold' : 'hover:bg-gray-50 text-gray-600 font-medium'`, `'bg-amber-50/80 text-amber-700 font-bold shadow-sm' : 'hover:bg-amber-50/50 text-gray-600 font-medium'`);
  
  // Grid dropdown icons wrapper
  navContent = navContent.replaceAll(`rounded-lg bg-gray-50`, `rounded-xl bg-white shadow-sm border border-gray-100/50`);

  // 5. Timer and Profile (Pill shapes, glass layers)
  navContent = navContent.replace(`rounded-lg border 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse' : 'bg-blue-100/40 text-blue-800 border-blue-200'`, `rounded-full border 'bg-red-500/20 text-red-600 border-red-500/30 animate-pulse' : 'bg-white/60 backdrop-blur-md text-blue-800 border-white/50 shadow-sm'`);
  // Fix timer replace if it was slightly off
  navContent = navContent.replace(`rounded-lg border \${sessionRemaining <= 120 ? 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse' : 'bg-blue-100/40 text-blue-800 border-blue-200'}`, `rounded-full border \${sessionRemaining <= 120 ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : 'bg-white/60 backdrop-blur-md text-blue-800 border-white/50 shadow-sm'}`);

  navContent = navContent.replace(`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600`, `w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600`);
  navContent = navContent.replace(`w-10 h-10 rounded-xl bg-primary/10`, `w-10 h-10 rounded-full bg-primary/10`);

  // Mobile menu background
  navContent = navContent.replace(`bg-[#F0F7FF] border-t border-blue-100`, `bg-white/95 backdrop-blur-xl border-t border-white/50`);

  content = content.substring(0, navStart) + navContent + content.substring(navEnd);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Glassmorphic UI upgrade applied successfully!");
} else {
  console.error("Could not find nav block. Please check the target string.");
}
