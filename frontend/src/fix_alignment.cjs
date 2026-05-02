const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Components', 'AdminPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Target the desktop navigation div
const targetStr = `className="hidden lg:flex items-center gap-2 flex-1 ml-10"`;
const replacementStr = `className="hidden lg:flex items-center justify-center gap-4 flex-1 mx-4"`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Alignment updated successfully to justify-center!");
} else {
  console.log("Could not find the target string for alignment.");
}
