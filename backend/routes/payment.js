const express = require('express');
const axios = require('axios');
const Admission = require('../models/Admission');

const router = express.Router();

// POST /api/payment/create-order — Create a UPIGateway order
router.post('/create-order', async (req, res) => {
  try {
    const { admissionId, amount, studentName, email, contactNumber } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const admission = await Admission.findById(admissionId);
    if (!admission) {
      return res.status(404).json({ message: 'Admission application not found' });
    }

    // Call UPIGateway
    const upiGatewayKey = process.env.UPIGATEWAY_KEY;
    if (!upiGatewayKey) {
        throw new Error('UPIGateway key is missing in environment variables.');
    }

    // Setup redirect URL (frontend success page)
    let clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    // UPIGateway does not accept 'localhost' in redirect URLs, replace with '127.0.0.1' for local dev
    if (clientUrl.includes('localhost')) {
        clientUrl = clientUrl.replace('localhost', '127.0.0.1');
    }
    const redirectUrl = `${clientUrl}/admission?verified=true&ref=${admission.referenceNumber}`;

    const orderData = {
      key: upiGatewayKey,
      client_txn_id: admission._id.toString(),
      amount: amount.toString(),
      p_info: 'Admission Fee',
      customer_name: studentName || 'Applicant',
      customer_email: email || 'applicant@example.com',
      customer_mobile: contactNumber || '0000000000',
      redirect_url: redirectUrl
    };

    const gatewayRes = await axios.post('https://merchant.upigateway.com/api/create_order', orderData);

    if (gatewayRes.data.status === true) {
      res.json({
        payment_url: gatewayRes.data.data.payment_url,
        order_id: gatewayRes.data.data.order_id,
        upi_intent: gatewayRes.data.data.upi_intent
      });
    } else {
      throw new Error(gatewayRes.data.msg || 'Failed to create UPIGateway order');
    }
  } catch (error) {
    console.error('[UPIGateway] Order creation error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to initiate payment. ' + (error.response?.data?.msg || error.message) });
  }
});

// POST /api/payment/check-status — Check status of order
router.post('/check-status', async (req, res) => {
  try {
      const { admissionId } = req.body;
      const date = new Date().toLocaleDateString('en-CA'); // format: YYYY-MM-DD
      
      const payload = {
          key: process.env.UPIGATEWAY_KEY,
          client_txn_id: admissionId,
          txn_date: date
      };

      const checkRes = await axios.post('https://merchant.upigateway.com/api/check_order_status', payload);
      
      if (checkRes.data.status === true && checkRes.data.data.status === 'success') {
          // Update admission status
          const admission = await Admission.findById(admissionId);
          if (admission && !admission.upiTransactionId) {
             admission.upiTransactionId = checkRes.data.data.upi_txn_id || 'AUTO_VERIFIED';
             await admission.save();
          }
          res.json({ verified: true, data: checkRes.data.data });
      } else {
          res.json({ verified: false, data: checkRes.data.data });
      }
  } catch (error) {
      console.error('[UPIGateway] Status check error:', error.message);
      res.status(500).json({ message: 'Failed to verify payment status.' });
  }
});

// POST /api/payment/webhook — UPIGateway Webhook
router.post('/webhook', async (req, res) => {
  try {
    const data = req.body;
    console.log('[UPIGateway Webhook Received]', data);

    if (data.status === 'success') {
      const admissionId = data.client_txn_id;
      if (admissionId) {
        const admission = await Admission.findById(admissionId);
        if (admission) {
          admission.upiTransactionId = data.upi_txn_id;
          await admission.save();
          console.log(`[UPIGateway] Payment verified for Admission ID: ${admissionId}`);
        }
      }
    }
    
    // Always return 200 OK so gateway knows we received it
    res.status(200).send('OK');
  } catch (error) {
    console.error('[UPIGateway] Webhook processing error:', error.message);
    res.status(500).send('Error');
  }
});

module.exports = router;
