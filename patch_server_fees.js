const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'VidyaBarta/backend/server.js');
let content = fs.readFileSync(serverPath, 'utf8');

if (!content.includes('./routes/fees')) {
  // Add import
  content = content.replace(
    "const authRoutes = require('./routes/auth');",
    "const authRoutes = require('./routes/auth');\nconst feesRoutes = require('./routes/fees');"
  );
  
  // Add app.use
  content = content.replace(
    "app.use('/api/auth', apiLimiter, authRoutes);",
    "app.use('/api/auth', apiLimiter, authRoutes);\napp.use('/api/fees', apiLimiter, feesRoutes);"
  );

  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('server.js successfully updated with fees routes!');
} else {
  console.log('Fees routes already exist in server.js');
}
