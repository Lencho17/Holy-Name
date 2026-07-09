const fs = require('fs');
const path = require('path');

const files = [
  'About.jsx',
  'Admission.jsx',
  'Career.jsx',
  'Complaints.jsx',
  'Contact.jsx',
  'Courses.jsx',
  'Faculty.jsx',
  'Gallery.jsx',
  'Notice.jsx',
  'Principal.jsx',
  'StudentPortal.jsx'
];

const dir = 'C:/Users/lench/OneDrive/Documents/Holy-Name/frontend/src/Components';

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    console.log('Not found:', file);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  let regex;
  let replacedCount = 0;
  
  if (file === 'Faculty.jsx') {
    // Replace only the specific occurrence for Faculty
    regex = /src="https:\/\/images\.unsplash\.com\/photo-1524178232363-1fb2b075b655\?q=80&w=2070&auto=format&fit=crop"/g;
    content = content.replace(regex, (match) => {
      replacedCount++;
      return replacedCount === 2 ? 'src={schoolProfile?.heroImages?.[0] || ' + JSON.stringify(match.replace(/src=/,'').replace(/"/g,'')) + '}' : match;
    });
  } else {
    // For other files, replace the first occurrence of an unsplash image with 'q=80' and 'w=2070' 
    // which signifies it's the hero bg image.
    regex = /src="(https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+[^"]*w=2070[^"]*)"/g;
    content = content.replace(regex, (match, p1) => {
      if (replacedCount === 0) {
        replacedCount++;
        return 'src={schoolProfile?.heroImages?.[0] || ' + JSON.stringify(p1) + '}';
      }
      return match;
    });
  }

  // Also need to make sure schoolProfile is extracted from SiteDataContext!
  if (replacedCount > 0 && !content.includes(' schoolProfile') && !content.includes('{schoolProfile')) {
    const contextRegex = /const\s*{\s*([^}]+)\s*}\s*=\s*useContext\(\s*SiteDataContext\s*\);/;
    if (contextRegex.test(content)) {
      content = content.replace(contextRegex, (match, p1) => {
        return `const { ${p1}, schoolProfile } = useContext(SiteDataContext);`;
      });
    } else {
      // If there's no SiteDataContext import and useContext, we need to add it manually.
      // E.g., Contact.jsx actually DOES NOT use SiteDataContext!
      // Let's add the import and the context hook.
      if (!content.includes('SiteDataContext')) {
         content = content.replace(/(import React[^;]*;)/, "$1\nimport { SiteDataContext } from '../context/SiteDataContext';");
         const compRegex = /const\s+[A-Za-z]+\s*=\s*\([^)]*\)\s*=>\s*{/;
         content = content.replace(compRegex, (match) => {
            return match + "\n  const { schoolProfile } = useContext(SiteDataContext);";
         });
         
         // Fix useContext if not imported
         if (!content.includes('useContext')) {
            content = content.replace(/import React/, "import React, { useContext }");
         }
      } else {
         const compRegex = /const\s+[A-Za-z]+\s*=\s*\([^)]*\)\s*=>\s*{/;
         content = content.replace(compRegex, (match) => {
            return match + "\n  const { schoolProfile } = useContext(SiteDataContext);";
         });
      }
    }
  }

  if (replacedCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
  } else {
    console.log('No hero updated for', file);
  }
});
