const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Components', 'AdminPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The block to replace is inside the return statement starting at <nav
// We will just do targeted string replacements within the nav block.

const navStart = content.indexOf('<nav className="bg-[#0F172A]');
if (navStart !== -1) {
  const navEnd = content.indexOf('</nav>', navStart) + 6;
  let navContent = content.substring(navStart, navEnd);

  // 1. Nav background
  navContent = navContent.replace(
    `<nav className="bg-[#0F172A] text-white shadow-xl z-50 sticky top-0 w-full" style={{ background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 100%)' }}>`,
    `<nav className="bg-white text-gray-800 shadow-sm border-b border-gray-200 z-50 sticky top-0 w-full">`
  );

  // 2. Brand
  navContent = navContent.replace(
    `bg-slate-700/80 flex items-center justify-center border border-slate-600/30`,
    `bg-primary/10 flex items-center justify-center border border-primary/20`
  );
  navContent = navContent.replace(`text-blue-300 text-lg`, `text-primary text-lg`);
  navContent = navContent.replace(`text-slate-200`, `text-gray-900`);
  navContent = navContent.replace(`text-slate-500 font-medium`, `text-gray-500 font-medium`);

  // 3. Desktop Navigation Buttons
  // Active states
  navContent = navContent.replace(`'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-white/10 hover:text-white'`, `'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'`);
  
  navContent = navContent.replaceAll(`'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'`, `'bg-primary/10 text-primary border border-primary/20' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'`);
  
  navContent = navContent.replaceAll(`'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'`, `'bg-amber-50 text-amber-600 border border-amber-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'`);

  // 4. Right Side Actions
  navContent = navContent.replace(`'bg-white/5 text-slate-300 border-white/10'`, `'bg-gray-50 text-gray-600 border-gray-200'`);
  navContent = navContent.replace(`text-white leading-tight`, `text-gray-800 leading-tight`);
  navContent = navContent.replace(`text-blue-300 font-medium`, `text-primary font-medium`);
  
  navContent = navContent.replace(`hover:bg-white/10 rounded-xl text-white`, `hover:bg-gray-100 rounded-xl text-gray-600`);

  // 5. Mobile Navigation Menu
  navContent = navContent.replace(`bg-[#1E293B] border-t border-slate-700`, `bg-white border-t border-gray-100`);
  navContent = navContent.replace(`'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'`, `'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'`);
  navContent = navContent.replaceAll(`'bg-blue-600/20 text-blue-300' : 'text-slate-400 hover:bg-white/5'`, `'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50'`);
  navContent = navContent.replaceAll(`text-slate-500 uppercase`, `text-gray-400 uppercase`);

  content = content.substring(0, navStart) + navContent + content.substring(navEnd);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Color scheme updated successfully!");
} else {
  console.error("Could not find nav block");
}
