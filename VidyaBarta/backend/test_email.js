require('dotenv').config();
const { transporter } = require('./utils/mailer');

async function testEmail() {
  console.log('--- Email Connection Test ---');
  console.log('Checking configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '******** (configured)' : 'NOT CONFIGURED');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Error: EMAIL_USER or EMAIL_PASS environment variables are missing.');
    process.exit(1);
  }

  try {
    console.log('Verification in progress...');
    await transporter.verify();
    console.log('✅ Success: Transporter is ready to send emails.');

    console.log('Sending a test email to', process.env.EMAIL_USER, '...');
    const info = await transporter.sendMail({
      from: `"Holy Name Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Holy Name System - Email Test',
      text: 'This is a test email from the Holy Name School System to verify production SMTP settings.',
      html: '<h1>Email Test Successful</h1><p>The SMTP connection is working correctly.</p>'
    });

    console.log('✅ Success: Test email sent!');
    console.log('Message ID:', info.messageId);
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection Failed:', error.message);
    console.error('Error Code:', error.code);
    console.error('Command:', error.command);
    
    if (error.code === 'ETIMEDOUT') {
      console.error('\nTIP: This is a network timeout. Your hosting provider (Render/Vercel) might be blocking port 465.');
      console.error('Try changing port to 587 and secure to false in utils/mailer.js if this persists.');
    } else if (error.code === 'EAUTH') {
      console.error('\nTIP: Authentication failed. Make sure you are using a "Gmail App Password" and not your regular password.');
    }
    
    process.exit(1);
  }
}

testEmail();
