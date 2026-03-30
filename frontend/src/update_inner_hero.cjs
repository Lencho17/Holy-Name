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

  if (content.includes('schoolProfile?.heroImages?.[0]')) {
    content = content.replace(/schoolProfile\?\.heroImages\?\.\[0\]/g, 'schoolProfile?.innerPageHeroImages?.[0]');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
  } else {
    console.log('No heroImages found for', file);
  }
});
