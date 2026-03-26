const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src', 'Components');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replacements
  content = content.replace(/from-canva-cyan to-canva-purple/g, 'from-primary to-primary-container');
  content = content.replace(/text-canva-purple/g, 'text-primary');
  content = content.replace(/text-canva-cyan/g, 'text-secondary');
  content = content.replace(/bg-canva-purple/g, 'bg-primary');
  content = content.replace(/hover:bg-canva-purple/g, 'hover:bg-primary-container');
  content = content.replace(/hover:bg-canva-cyan/g, 'hover:bg-primary-container');
  content = content.replace(/hover:text-canva-purple/g, 'hover:text-primary');

  fs.writeFileSync(filePath, content);
});

console.log('Replaced successfully.');
