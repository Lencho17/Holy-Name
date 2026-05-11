const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const router = express.Router();

// POST submit application (public)
router.post('/', async (req, res) => {
  try {
    const crypto = require('crypto');
    const refNum = `TDR-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const { data: application, error } = await supabase
      .from('tender_applications')
      .insert({
        tender_id: req.body.tenderId,
        reference_number: refNum,
        company_name: req.body.companyName,
        registration_number: req.body.registrationNumber,
        contact_person: req.body.contactPerson,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        bid_amount: req.body.bidAmount,
        proposed_timeline: req.body.proposedTimeline,
        document_url: JSON.stringify({
          technicalProposalUrl: req.body.technicalProposalUrl,
          financialProposalUrl: req.body.financialProposalUrl,
          companyProfileUrl: req.body.companyProfileUrl
        }),
        status: 'Pending'
      })
      .select('*, tenders(*)')
      .single();

    if (error) throw error;
    res.status(201).json(application);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET export all applications to XLS (Admin)
router.get('/export', protect, async (req, res) => {
  try {
    const { data: applications, error } = await supabase
      .from('tender_applications')
      .select('*, tenders(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
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
            <th>Reference Number</th>
            <th>Tender Title</th>
            <th>Company Name</th>
            <th>Registration Number</th>
            <th>Contact Person</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Bid Amount</th>
            <th>Proposed Timeline</th>
            <th>Status</th>
            <th>Submission Date</th>
          </tr>
    `;

    applications.forEach(a => {
      html += `
        <tr>
          <td class="text">${a.reference_number || ''}</td>
          <td>${a.tenders?.title || 'Unknown'}</td>
          <td>${a.company_name || ''}</td>
          <td class="text">${a.registration_number || ''}</td>
          <td>${a.contact_person || ''}</td>
          <td>${a.email || ''}</td>
          <td class="text">${a.phone || ''}</td>
          <td>${a.address || ''}</td>
          <td>${a.bid_amount || ''}</td>
          <td>${a.proposed_timeline || ''}</td>
          <td>${a.status || ''}</td>
          <td>${a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</td>
        </tr>
      `;
    });

    html += `</table></body></html>`;

    const fileName = `tender_applications_export_${new Date().toISOString().split('T')[0]}.xls`;
    res.set('Content-Type', 'application/vnd.ms-excel');
    res.set('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(html);
  } catch (error) {
    console.error('Export Tender Applications Error:', error.message);
    res.status(500).json({ message: 'Failed to export tender applications', error: error.message });
  }
});

// GET all applications (admin)
router.get('/', protect, async (req, res) => {
  try {
    const { data: apps, error } = await supabase
      .from('tender_applications')
      .select('*, tenders(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const processedApps = apps.map(app => {
      let docs = {};
      try { docs = JSON.parse(app.document_url || '{}'); } catch(e){}
      return {
        ...app,
        technical_proposal_url: docs.technicalProposalUrl || app.document_url,
        financial_proposal_url: docs.financialProposalUrl || '',
        company_profile_url: docs.companyProfileUrl || ''
      };
    });

    res.json(processedApps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET track application (public)
router.get('/track/:ref', async (req, res) => {
  try {
    const { ref } = req.params;
    const { email } = req.query;

    if (!ref || !email) {
      return res.status(400).json({ message: 'Reference number and email are required.' });
    }

    const { data: app, error } = await supabase
      .from('tender_applications')
      .select('*, tenders(*)')
      .eq('reference_number', ref.toUpperCase())
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error || !app) {
      return res.status(404).json({ message: 'No application found with the provided reference number and email.' });
    }

    res.json({
      referenceNumber: app.reference_number,
      tenderTitle: app.tenders?.title || 'Unknown Tender',
      companyName: app.company_name,
      status: app.status,
      submittedAt: app.created_at
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single application (admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: app, error } = await supabase
      .from('tender_applications')
      .select('*, tenders(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !app) return res.status(404).json({ message: 'Application not found' });
    
    let docs = {};
    try { docs = JSON.parse(app.document_url || '{}'); } catch(e){}
    
    const processedApp = {
      ...app,
      technical_proposal_url: docs.technicalProposalUrl || app.document_url,
      financial_proposal_url: docs.financialProposalUrl || '',
      company_profile_url: docs.companyProfileUrl || ''
    };

    res.json(processedApp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update status (admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const { data: updatedApp, error } = await supabase
      .from('tender_applications')
      .update({ status: req.body.status, updated_at: new Date() })
      .eq('id', req.params.id)
      .select('*, tenders(*)')
      .single();

    if (error) throw error;
    res.json(updatedApp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE application (admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase.from('tender_applications').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
