const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

// SBI ePay Constants (To be replaced with actual env variables when bank provides them)
const SBI_MERCHANT_ID = process.env.SBI_MERCHANT_ID || 'TEST_MERCHANT_ID';
const SBI_ENCRYPTION_KEY = process.env.SBI_ENCRYPTION_KEY || '1234567890123456'; // 16 bytes for AES-128
const SBI_PAYMENT_URL = process.env.SBI_PAYMENT_URL || 'https://test.sbiepay.sbi/payAgg/payRequest.req';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper function to encrypt payload as per SBI ePay rules (Usually AES-128-ECB or AES-128-CBC)
// *Note: Bank will specify if it's CBC or ECB. For this boilerplate, we use AES-128-ECB which is common for older Indian bank gateways.
const encryptSbiPayload = (payloadString, key) => {
  try {
    const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
    let encrypted = cipher.update(payloadString, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  } catch (error) {
    console.error("Encryption Error:", error);
    throw new Error('Failed to encrypt payment data');
  }
};

// Helper function to decrypt payload
const decryptSbiPayload = (encryptedString, key) => {
  try {
    const decipher = crypto.createDecipheriv('aes-128-ecb', key, null);
    let decrypted = decipher.update(encryptedString, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Decryption Error:", error);
    throw new Error('Failed to decrypt payment data');
  }
};

// @desc    Initiate SBI ePay Transaction
// @route   POST /api/payments/initiate
// @access  Private (Student)
router.post('/initiate', protect, async (req, res) => {
  try {
    const { fee_record_id, amount, student_id, school_id } = req.body;

    if (!fee_record_id || !amount || !student_id) {
      return res.status(400).json({ message: 'Missing required payment details' });
    }

    // 1. Create a unique Order ID
    const orderNo = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 2. Create the transaction record in the database as 'pending'
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert([{
        school_id,
        student_id,
        fee_record_id,
        gross_amount: amount,
        net_to_school: amount,
        status: 'pending',
        sbi_reference_id: orderNo, // using this field temporarily for our Order ID
        payment_method: 'SBI_EPAY'
      }])
      .select()
      .single();

    if (txError) throw txError;

    // 3. Format the payload string as per typical SBI ePay format:
    // Format: merchantId|operatingMode|country|currency|amount|orderNo|successUrl|failUrl
    // *The exact pipe-separated format will be in the bank's integration doc*
    const successUrl = `${FRONTEND_URL}/payment-success?order_no=${orderNo}`;
    const failUrl = `${FRONTEND_URL}/payment-failure?order_no=${orderNo}`;
    
    const payloadString = `${SBI_MERCHANT_ID}|DOM|IN|INR|${amount}|${orderNo}|${successUrl}|${failUrl}`;
    
    // 4. Encrypt the payload
    const encData = encryptSbiPayload(payloadString, SBI_ENCRYPTION_KEY);

    // 5. Send back the required fields for the frontend auto-submit form
    res.json({
      paymentUrl: SBI_PAYMENT_URL,
      merchantId: SBI_MERCHANT_ID,
      encData: encData
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error during payment initiation' });
  }
});

// @desc    Webhook / Callback for SBI ePay response (Optional/Additional to Success URL)
// @route   POST /api/payments/callback
// @access  Public (Called by SBI)
router.post('/callback', async (req, res) => {
  try {
    const { encdata, merchant_id } = req.body;
    
    if (!encdata) {
      return res.status(400).send('Invalid Response');
    }

    // Decrypt the response from bank
    const decryptedString = decryptSbiPayload(encdata, SBI_ENCRYPTION_KEY);
    
    // Parse the decrypted string (e.g. orderNo|sbiRefNo|amount|status|...)
    const responseParts = decryptedString.split('|');
    const orderNo = responseParts[0]; 
    const sbiRefNo = responseParts[1];
    const status = responseParts[3]; // 'SUCCESS' or 'FAIL'
    
    // Update the transaction in database
    await supabase
      .from('transactions')
      .update({ 
        status: status === 'SUCCESS' ? 'completed' : 'failed',
        sbi_reference_id: sbiRefNo 
      })
      .eq('sbi_reference_id', orderNo); // using orderNo to find the tx

    res.send('OK');
  } catch (err) {
    console.error("SBI Webhook Error:", err);
    res.status(500).send('Internal Error');
  }
});

module.exports = router;
