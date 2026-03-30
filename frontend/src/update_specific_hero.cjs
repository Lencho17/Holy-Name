const fs = require('fs');
const path = require('path');

const pageMapping = {
  'About.jsx': 'about',
  'Admission.jsx': 'admission',
  'Career.jsx': 'career',
  'Complaints.jsx': 'complaints',
  'Contact.jsx': 'contact',
  'Courses.jsx': 'courses',
  'Faculty.jsx': 'faculty',
  'Gallery.jsx': 'gallery',
  'Notice.jsx': 'notice',
  'Principal.jsx': 'principal',
  'StudentPortal.jsx': 'studentPortal'
};

const dir = 'C:/Users/lench/OneDrive/Documents/Holy-Name/frontend/src/Components';

Object.keys(pageMapping).forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    console.log('Not found:', file);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const fieldName = pageMapping[file];

  // We are looking for something like: src={schoolProfile?.innerPageHeroImages?.[0] || "..."}
  // Let's replace innerPageHeroImages?.[0] with pageHeroImages?.<fieldName>
  
  const searchStr = 'schoolProfile?.innerPageHeroImages?.[0]';
  if (content.includes(searchStr)) {
    content = content.replace(/schoolProfile\?\.innerPageHeroImages\?\.\[0\]/g, `schoolProfile?.pageHeroImages?.${fieldName}`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file, 'to use', fieldName);
  } else {
    console.log('Could not find innerPageHeroImages block in', file);
  }
});
