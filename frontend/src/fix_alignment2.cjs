const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Components', 'AdminPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The parent div needs 'relative' to anchor the absolute center div
const parentStr = `<div className="flex items-center justify-between px-4 lg:px-8 py-3">`;
const parentReplacement = `<div className="flex items-center justify-between px-4 lg:px-8 py-3 relative">`;

// The middle nav div needs absolute positioning
const targetStr = `className="hidden lg:flex items-center justify-center gap-4 flex-1 mx-4"`;
const replacementStr = `className="hidden lg:flex items-center justify-center gap-4 absolute left-1/2 -translate-x-1/2"`;

let modified = false;

if (content.includes(parentStr)) {
  content = content.replace(parentStr, parentReplacement);
  modified = true;
}

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  modified = true;
}

if (modified) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Alignment perfectly centered using absolute positioning!");
} else {
  console.log("Could not find the target strings for alignment.");
}
