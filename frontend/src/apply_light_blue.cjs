const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Components', 'AdminPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const navStart = content.indexOf('<nav className="bg-white text-gray-800');
if (navStart !== -1) {
  const navEnd = content.indexOf('</nav>', navStart) + 6;
  let navContent = content.substring(navStart, navEnd);

  // 1. Nav background
  navContent = navContent.replace(
    `<nav className="bg-white text-gray-800 shadow-sm border-b border-gray-200 z-50 sticky top-0 w-full">`,
    `<nav className="bg-gradient-to-r from-[#F0F7FF] to-[#E0EFFF] text-blue-900 shadow-sm border-b border-blue-100 z-50 sticky top-0 w-full">`
  );

  // 2. Brand
  navContent = navContent.replace(`text-gray-900`, `text-blue-950`);
  navContent = navContent.replace(`text-gray-500 font-medium`, `text-blue-600/80 font-medium`);

  // 3. Desktop Navigation Buttons
  // Inactive states
  navContent = navContent.replaceAll(`'text-gray-600 hover:bg-gray-100 hover:text-gray-900'`, `'text-blue-800 hover:bg-blue-100/50 hover:text-blue-950'`);
  
  // 4. Right Side Actions
  navContent = navContent.replace(`'bg-gray-50 text-gray-600 border-gray-200'`, `'bg-blue-100/40 text-blue-800 border-blue-200'`);
  navContent = navContent.replace(`text-gray-800 leading-tight`, `text-blue-950 leading-tight`);
  navContent = navContent.replace(`hover:bg-gray-100 rounded-xl text-gray-600`, `hover:bg-blue-100/60 rounded-xl text-blue-800`);

  // 5. Mobile Navigation Menu
  navContent = navContent.replace(`bg-white border-t border-gray-100`, `bg-[#F0F7FF] border-t border-blue-100`);
  navContent = navContent.replaceAll(`'text-gray-600 hover:bg-gray-50'`, `'text-blue-800 hover:bg-blue-100/50'`);
  navContent = navContent.replaceAll(`'text-gray-500 hover:bg-gray-50'`, `'text-blue-700 hover:bg-blue-100/50'`);
  navContent = navContent.replaceAll(`text-gray-400 uppercase`, `text-blue-500/80 uppercase`);

  content = content.substring(0, navStart) + navContent + content.substring(navEnd);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Light blue scheme applied successfully!");
} else {
  console.error("Could not find nav block to update. Maybe it was already updated?");
}
