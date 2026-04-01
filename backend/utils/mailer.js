const nodemailer = require('nodemailer');

const createTransporter = () => {
  // Using explicit host/port instead of 'service' for better control in production
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // SSL/TLS port
    secure: true, // true for 465, false for 587
    // Absolutely force IPv4 to bypass Render IPv6 routing issues
    lookup: (hostname, options, callback) => require('dns').lookup(hostname, { family: 4 }, callback),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Do not fail on invalid certs (common issue in cloud environments)
      rejectUnauthorized: false,
    },
    // Production-optimized timeouts
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  return transporter;
};

const transporter = createTransporter();

// Verification log for monitoring
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email Transporter Verification Failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      console.dir(error, { depth: null });
    }
  } else {
    console.log('✅ Email Transporter is ready');
  }
});

const sendEmail = async (options) => {
  try {
    const info = await transporter.sendMail(options);
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    // Important: throw the error so the caller can handle it or return 500
    throw error;
  }
};

module.exports = {
  transporter,
  sendEmail,
};
