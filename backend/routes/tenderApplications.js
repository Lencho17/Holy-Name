const express = require('express');
const TenderApplication = require('../models/TenderApplication');
const { protect } = require('../middleware/auth');
const router = express.Router();

// POST submit application (public)
router.post('/', async (req, res) => {
  try {
    const lastApp = await TenderApplication.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastApp && lastApp.referenceNumber) {
      const lastNum = parseInt(lastApp.referenceNumber.split('-')[2]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const refNum = `TDR-${new Date().getFullYear()}-${nextNum.toString().padStart(4, '0')}`;

    const application = new TenderApplication({
      ...req.body,
      referenceNumber: refNum
    });

    await application.save();
    res.status(201).json(application);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET export all applications to XLS (Admin) - Must be before parameterized routes
router.get('/export', protect, async (req, res) => {
  console.log('Export Tender Applications triggered (HTML Table mode)');
  try {
    const applications = await TenderApplication.find().populate('tenderId').sort({ createdAt: -1 });
    
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
          <td class="text">${a.referenceNumber || ''}</td>
          <td>${a.tenderId?.title || 'Unknown'}</td>
          <td>${a.companyName || ''}</td>
          <td class="text">${a.registrationNumber || ''}</td>
          <td>${a.contactPerson || ''}</td>
          <td>${a.email || ''}</td>
          <td class="text">${a.phone || ''}</td>
          <td>${a.address || ''}</td>
          <td>${a.bidAmount || ''}</td>
          <td>${a.proposedTimeline || ''}</td>
          <td>${a.status || ''}</td>
          <td>${a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</td>
        </tr>
      `;
    });

    html += `</table></body></html>`;

    const fileName = `tender_applications_export_${new Date().toISOString().split('T')[0]}.xls`;
    
    res.set('Content-Type', 'application/vnd.ms-excel');
    res.set('Content-Disposition', `attachment; filename=${fileName}`);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.removeHeader('ETag');

    res.send(html);
  } catch (error) {
    console.error('Export Tender Applications Error:', error.message);
    res.status(500).json({ message: 'Failed to export tender applications', error: error.message });
  }
});

// GET all applications (admin)
router.get('/', protect, async (req, res) => {
  try {
    const apps = await TenderApplication.find().populate('tenderId').sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single application (admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const app = await TenderApplication.findById(req.params.id).populate('tenderId');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update status (admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const updatedApp = await TenderApplication.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true }
    );
    res.json(updatedApp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE application (admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    await TenderApplication.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
