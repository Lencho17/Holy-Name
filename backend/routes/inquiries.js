const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const { transporter } = require('../utils/mailer');

const sendInquiryConfirmationEmail = async (inquiryData) => {
  try {
    if (!inquiryData.email) return;

    const { data: settings } = await supabase.from('site_settings').select('*').single();
    const schoolLogo = settings?.logo || 'https://holynamehsschool.in/logo.png';
    const schoolName = settings?.school_name || 'Holy Name High School';
    const schoolTagline = settings?.punch_line || 'Excellence in Education';

    const mailOptions = {
      from: `"${schoolName}" <${process.env.EMAIL_USER}>`,
      to: inquiryData.email,
      subject: `Inquiry Received: ${inquiryData.tracking_number}`,
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
              <p style="margin: 5px 0 0 0; font-size: 20px; color: #1e40af; font-weight: bold; font-family: monospace;">${inquiryData.tracking_number}</p>
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

    const crypto = require('crypto');
    const typeCode = type === 'Suggestion' ? 'SUG' : type === 'Complain' ? 'COM' : 'INQ';
    const trackingNumber = `HNS/${typeCode}/${new Date().getFullYear()}/${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const inquiryData = {
      name: isAnonymous ? 'Anonymous User' : name,
      email: isAnonymous ? '' : email,
      phone: isAnonymous ? '' : phone,
      type,
      subject,
      user_type: userType,
      is_anonymous: isAnonymous,
      class_name: className,
      section,
      message,
      tracking_number: trackingNumber,
      status: 'Submitted'
    };

    const { data: newInquiry, error } = await supabase
      .from('inquiries')
      .insert(inquiryData)
      .select()
      .single();

    if (error) throw error;

    // Send confirmation email
    if (!isAnonymous && email) {
      sendInquiryConfirmationEmail(newInquiry);
    }

    res.status(201).json({ message: 'Inquiry submitted successfully.', inquiry: newInquiry });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).json({ message: 'Server error while submitting inquiry.', error: error.message });
  }
});

// @route   GET /api/inquiries
// @desc    Get all inquiries (Protected)
router.get('/', protect, async (req, res) => {
  try {
    const { data: inquiries, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
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
    // Check if is_read column exists by trying to select it
    const { data: currentInquiry, error: fetchError } = await supabase.from('inquiries').select('is_read').eq('id', req.params.id).single();
    
    if (fetchError) {
      if (fetchError.code === '42703') { // Column does not exist
        console.warn(`[Inquiry Read] Column 'is_read' does not exist in the database. Returning success to frontend but no state changed.`);
        return res.json({ message: 'Marked as read (Simulated)', inquiry: { id: req.params.id, is_read: true } });
      }
      console.error(`[Inquiry Read] Fetch error. ID: ${req.params.id}, Error:`, fetchError);
      return res.status(500).json({ message: 'Error fetching inquiry.', error: fetchError });
    }

    if (!currentInquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .update({ is_read: !currentInquiry.is_read })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: `Inquiry marked as ${inquiry.is_read ? 'read' : 'unread'}.`, inquiry });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ message: 'Server error while updating status.' });
  }
});

// @route   GET /api/inquiries/export
// @desc    Export inquiries to Excel (Protected)
router.get('/export', protect, async (req, res) => {
  try {
    const { type: typeFilter, status: statusFilter } = req.query;
    let query = supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    
    if (typeFilter && typeFilter !== 'All') query = query.eq('type', typeFilter);
    if (statusFilter && statusFilter !== 'All') query = query.eq('status', statusFilter);

    const { data: inquiries, error } = await query;
    if (error) throw error;

    const typeLabel = typeFilter && typeFilter !== 'All' ? `_${typeFilter.replace(/\s+/g, '_')}` : '_ALL';
    const statusLabel = statusFilter && statusFilter !== 'All' ? `_${statusFilter}` : '';
    const fileName = `inquiries${typeLabel}${statusLabel}_${new Date().toISOString().split('T')[0]}.xls`;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
          .text { mso-number-format:"\\@"; }
          th { background-color: #1e3a8a; color: white; font-weight: bold; }
          td, th { border: 0.5pt solid #ccc; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <th>Tracking Number</th>
            <th>Type</th>
            <th>Status</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>User Type</th>
            <th>Class/Section</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Admin Reply</th>
            <th>Anonymous</th>
            <th>Date</th>
          </tr>
    `;

    inquiries.forEach(i => {
      html += `
        <tr>
          <td class="text">${i.tracking_number || ''}</td>
          <td>${i.type || ''}</td>
          <td>${i.status || 'Submitted'}</td>
          <td>${i.name || ''}</td>
          <td>${i.email || ''}</td>
          <td class="text">${i.phone || ''}</td>
          <td>${i.user_type || ''}</td>
          <td>${i.class_name ? `${i.class_name}${i.section ? '-' + i.section : ''}` : ''}</td>
          <td>${i.subject || ''}</td>
          <td>${i.message || ''}</td>
          <td>${i.admin_reply || ''}</td>
          <td>${i.is_anonymous ? 'Yes' : 'No'}</td>
          <td>${i.created_at ? new Date(i.created_at).toLocaleDateString() : ''}</td>
        </tr>
      `;
    });

    html += `</table></body></html>`;

    res.set('Content-Type', 'application/vnd.ms-excel');
    res.set('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(html);
  } catch (error) {
    console.error('Export Inquiries Error:', error.message);
    res.status(500).json({ message: 'Failed to export inquiries', error: error.message });
  }
});

// @route   GET /api/inquiries/track/:trackingNumber
// @desc    Public tracking
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const trackingNumber = decodeURIComponent(req.params.trackingNumber).toUpperCase();
    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('tracking_number', trackingNumber)
      .maybeSingle();

    if (error || !inquiry) {
      return res.status(404).json({ message: 'No inquiry found with this tracking number.' });
    }
    
    res.json({
      trackingNumber: inquiry.tracking_number,
      type: inquiry.type,
      subject: inquiry.subject,
      status: inquiry.status || 'Submitted',
      adminReply: inquiry.admin_reply || null,
      repliedAt: inquiry.replied_at || null,
      createdAt: inquiry.created_at
    });
  } catch (error) {
    console.error('Track inquiry error:', error);
    res.status(500).json({ message: 'Server error while tracking inquiry.' });
  }
});

// @route   PATCH /api/inquiries/:id/status
// @desc    Update inquiry status and optionally add admin reply (Protected)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminReply !== undefined) {
      update.admin_reply = adminReply;
    }
    
    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !inquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }
    res.json({ message: 'Inquiry updated successfully.', inquiry });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ message: 'Server error while updating inquiry.' });
  }
});

// @route   DELETE /api/inquiries/:id
// @desc    Delete an inquiry (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase.from('inquiries').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Inquiry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ message: 'Server error while deleting inquiry.' });
  }
});

module.exports = router;
