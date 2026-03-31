const fs = require('fs');
const path = require('path');

// Load .env manually
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const { transporter } = require('./backend/utils/mailer');

console.log('Verifying transporter with user:', process.env.EMAIL_USER);

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Transporter is ready');
    process.exit(0);
  }
});
