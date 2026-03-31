const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { protect } = require('../middleware/auth');
const { transporter } = require('../utils/mailer');
const SiteContent = require('../models/SiteContent');

const sendInquiryConfirmationEmail = async (inquiryData) => {
  try {
    if (!inquiryData.email) return;

    const siteContent = await SiteContent.findOne();
    const schoolLogo = siteContent?.schoolProfile?.logo || 'https://holynamehsschool.in/logo.png';
    const schoolName = siteContent?.schoolProfile?.name || 'Holy Name High School';
    const schoolTagline = siteContent?.schoolProfile?.punchLine || 'Excellence in Education';

    const mailOptions = {
      from: `"${schoolName}" <${process.env.EMAIL_USER}>`,
      to: inquiryData.email,
      subject: `Inquiry Received: ${inquiryData.trackingNumber}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #444; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <div style="background-color: #1e3a8a; color: white; padding: 25px; text-align: center;">
            ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" style="max-height: 60px; margin-bottom: 10px; border-radius: 6px;">` : ''}
            <h2 style="margin: 0; font-size: 20px;">${schoolName}</h2>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8; font-style: italic;">${schoolTagline}</p>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h3 style="color: #1e3a8a; margin-top: 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Inquiry Acknowledgment</h3>
            <p>Dear <strong>${inquiryData.name || 'User'}</strong>,</p>
            <p>We have successfully received your <strong>${inquiryData.type.toLowerCase()}</strong> regarding <strong>"${inquiryData.subject}"</strong>. Thank you for reaching out to us.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0; text-align: center; border-radius: 8px;">
              <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase;">Tracking Number</p>
              <p style="margin: 5px 0 0 0; font-size: 20px; color: #1e40af; font-weight: bold; font-family: monospace;">${inquiryData.trackingNumber}</p>
            </div>

            <p>Our team will review your message and get back to you as soon as possible if a response is required.</p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
            
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
              This is an automated confirmation. Please do not reply directly to this email.<br/>
              &copy; ${new Date().getFullYear()} ${schoolName}, Sivasagar.
            </p>
          </div>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Inquiry confirmation email sent to ${inquiryData.email}`);
  } catch (err) {
    console.error('Failed to send inquiry confirmation email:', err.message);
  }
};

// @route   POST /api/inquiries
// @desc    Submit a new inquiry (Public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, type, subject, message, userType, isAnonymous, className, section } = req.body;

    if (!type || !subject || !message) {
      return res.status(400).json({ message: 'Please provide type, subject, and message.' });
    }

    if (!isAnonymous && (type === 'Suggestion' || type === 'Complain') && (!name || !email)) {
       return res.status(400).json({ message: 'Name and email are required unless anonymous.' });
    }

    // Generate Tracking Number: HNS/TYPE/YEAR/SEQUENCE
    const year = new Date().getFullYear();
    const typeCode = type === 'Suggestion' ? 'SUG' : type === 'Complain' ? 'COM' : 'INQ';
    const count = await Inquiry.countDocuments({ 
      type, 
      createdAt: { 
        $gte: new Date(year, 0, 1), 
        $lt: new Date(year + 1, 0, 1) 
      } 
    });
    const trackingNumber = `HNS/${typeCode}/${year}/${(count + 1).toString().padStart(3, '0')}`;

    const newInquiry = new Inquiry({
      name: isAnonymous ? 'Anonymous User' : name,
      email: isAnonymous ? '' : email,
      phone: isAnonymous ? '' : phone,
      type,
      subject,
      userType,
      isAnonymous,
      className,
      section,
      message,
      trackingNumber
    });

    await newInquiry.save();

    // Send confirmation email
    if (!isAnonymous && email) {
      sendInquiryConfirmationEmail(newInquiry);
    }

    res.status(201).json({ message: 'Inquiry submitted successfully.', inquiry: newInquiry });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).json({ message: 'Server error while submitting inquiry.' });
  }
});

// @route   GET /api/inquiries
// @desc    Get all inquiries (Protected)
router.get('/', protect, async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ message: 'Server error while fetching inquiries.' });
  }
});

// @route   PATCH /api/inquiries/:id/read
// @desc    Toggle isRead status (Protected)
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    inquiry.isRead = !inquiry.isRead;
    await inquiry.save();

    res.json({ message: `Inquiry marked as ${inquiry.isRead ? 'read' : 'unread'}.`, inquiry });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ message: 'Server error while updating status.' });
  }
});

// @route   DELETE /api/inquiries/:id
// @desc    Delete an inquiry (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    await Inquiry.deleteOne({ _id: req.params.id });
    res.json({ message: 'Inquiry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ message: 'Server error while deleting inquiry.' });
  }
});

module.exports = router;
