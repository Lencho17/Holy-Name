const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const { calculateStudentFee } = require('../utils/feeCalculator');

// @desc    Get Fee Structures for School
// @route   GET /api/fees/structures
// @access  Private (Admin)
router.get('/structures', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { data, error } = await supabase.from('fee_structures').select('*').eq('school_id', req.user.school_id);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update Fee Structure
// @route   PUT /api/fees/structures/:class_level
// @access  Private (Admin)
router.put('/structures/:class_level', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { base_tuition_fee, admission_fee, subject_fees } = req.body;
    
    // Upsert structure
    const { data, error } = await supabase.from('fee_structures').upsert({
      school_id: req.user.school_id,
      class_level: req.params.class_level,
      base_tuition_fee,
      admission_fee,
      subject_fees,
      updated_at: new Date()
    }, { onConflict: 'school_id, class_level' }).select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get School Bank Details
// @route   GET /api/fees/bank-details
// @access  Private (Admin)
router.get('/bank-details', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { data, error } = await supabase.from('school_bank_details').select('*').eq('school_id', req.user.school_id).maybeSingle();
    if (error) throw error;
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update School Bank Details
// @route   PUT /api/fees/bank-details
// @access  Private (Admin)
router.put('/bank-details', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { account_number, ifsc_code, account_holder_name } = req.body;
    
    const { data, error } = await supabase.from('school_bank_details').upsert({
      school_id: req.user.school_id,
      account_number,
      ifsc_code,
      account_holder_name,
      updated_at: new Date()
    }, { onConflict: 'school_id' }).select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get Student Dues (For Student Portal)
// @route   GET /api/fees/my-dues
// @access  Public (Student)
router.get('/my-dues', async (req, res) => {
  try {
    const { quarter, isNewAdmission, admissionId, contactNumber } = req.query;
    let studentId, studentName, schoolId;

    // Check for auth header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const { data: stu } = await supabase.from('students').select('id, student_name, school_id').eq('id', decoded.id).single();
        if (stu) {
          studentId = stu.id;
          studentName = stu.student_name;
          schoolId = stu.school_id;
        }
      } catch (e) {
        // Fallback to query
      }
    }

    if (!studentId) {
      if (!admissionId || !contactNumber) {
        return res.status(400).json({ message: 'Admission ID and Contact Number are required' });
      }

      // Verify student
      const { data: student, error } = await supabase
        .from('students')
        .select('id, student_name, school_id')
        .eq('admission_id', admissionId)
        .eq('contact_number', contactNumber)
        .maybeSingle();

      if (error || !student) {
        return res.status(404).json({ message: 'Student not found with provided credentials' });
      }

      studentId = student.id;
      studentName = student.student_name;
      schoolId = student.school_id;
    }

    const fee_record_id = `QUARTER-${quarter}`;

    // Check if already paid
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('status')
      .eq('student_id', studentId)
      .eq('fee_record_id', fee_record_id)
      .in('status', ['Success', 'completed'])
      .maybeSingle();

    const feeDetails = await calculateStudentFee(studentId, parseInt(quarter) || 1, isNewAdmission === 'true');
    feeDetails.student_name = studentName;
    feeDetails.fee_record_id = fee_record_id;
    feeDetails.school_id = schoolId;
    feeDetails.student_id = studentId;
    feeDetails.isPaid = !!tx;
    
    res.json(feeDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Create SBI Epay Order (Mock)
// @route   POST /api/fees/checkout
// @access  Public (Student)
router.post('/checkout', async (req, res) => {
  try {
    const { admissionId, contactNumber, quarter, isNewAdmission } = req.body;
    if (!admissionId || !contactNumber) {
      return res.status(400).json({ message: 'Admission ID and Contact Number are required' });
    }

    // Verify student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, school_id')
      .eq('admission_id', admissionId)
      .eq('contact_number', contactNumber)
      .maybeSingle();

    if (studentError || !student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // 1. Calculate actual dues from backend
    const feeDetails = await calculateStudentFee(student.id, quarter, isNewAdmission);
    
    if (feeDetails.total <= 0) {
      return res.status(400).json({ message: 'No dues to pay' });
    }

    // 2. Calculate splits
    const gross_amount = feeDetails.total;
    const platform_fee_amount = (gross_amount * (feeDetails.platformFeePct || 0)) / 100;
    const transaction_fee_amount = (gross_amount * (feeDetails.transactionFeePct || 0)) / 100;
    const net_to_school = gross_amount - platform_fee_amount - transaction_fee_amount;

    // 3. Record transaction (Mocking the SBI Epay creation step and immediate success)
    const { data: transaction, error } = await supabase.from('transactions').insert({
      school_id: student.school_id,
      student_id: student.id,
      gross_amount,
      platform_fee_amount,
      transaction_fee_amount,
      net_to_school,
      status: 'Success', // Mocking success immediately for testing
      payment_method: 'UPI',
      sbi_reference_id: 'SBI' + Date.now()
    }).select().single();

    if (error) throw error;

    // ── Credit the school's escrow wallet ──
    let { data: wallet } = await supabase
      .from('school_wallets')
      .select('*')
      .eq('school_id', student.school_id)
      .single();

    if (wallet) {
      const newBalance = Number(wallet.balance) + net_to_school;
      await supabase
        .from('school_wallets')
        .update({ balance: newBalance, last_updated: new Date() })
        .eq('id', wallet.id);

      // Record credit in ledger
      await supabase.from('wallet_ledger').insert({
        school_id: student.school_id,
        type: 'credit',
        amount: net_to_school,
        balance_after: newBalance,
        reference_type: 'fee_payment',
        reference_id: transaction.id,
        description: `Fee payment received (₹${gross_amount} gross, ₹${net_to_school} net)`
      });
    } else {
      // Create wallet with initial balance
      await supabase
        .from('school_wallets')
        .insert([{ school_id: student.school_id, balance: net_to_school }]);

      await supabase.from('wallet_ledger').insert({
        school_id: student.school_id,
        type: 'credit',
        amount: net_to_school,
        balance_after: net_to_school,
        reference_type: 'fee_payment',
        reference_id: transaction.id,
        description: `Fee payment received — wallet created (₹${gross_amount} gross, ₹${net_to_school} net)`
      });
    }
    
    res.json({ message: 'Payment Successful', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Checkout failed', error: error.message });
  }
});

// @desc    Get School Transactions
// @route   GET /api/fees/transactions
// @access  Private (Admin)
router.get('/transactions', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { data, error } = await supabase
      .from('transactions')
      .select('*, students(student_name, grade)')
      .eq('school_id', req.user.school_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get Global Revenue (SaaS Superadmin)
// @route   GET /api/fees/global-revenue
// @access  Private (Superadmin)
router.get('/global-revenue', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') return res.status(403).json({ message: 'Forbidden' });
    const { data, error } = await supabase
      .from('transactions')
      .select('*, schools(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Initiate SBI ePay Payment
// @route   POST /api/fees/initiate-payment
// @access  Public (Student)
router.post('/initiate-payment', async (req, res) => {
  try {
    const { studentId, invoiceId, amount } = req.body;
    
    // In a real integration, you would construct the payload here
    // as per SBI ePay Merchant Integration Guide.
    // e.g., Merchant ID, Amount, Return URL, etc.
    const orderId = 'ORD' + Date.now();
    
    // Encrypt the payload using SBI ePay provided Encryption Key (AES-128/256)
    // const encryptedPayload = encrypt(payload, MERCHANT_KEY);
    
    // Create a pending transaction record
    const { data: transaction, error } = await supabase.from('transactions').insert({
      student_id: studentId,
      fee_record_id: invoiceId, // Linking to invoice
      gross_amount: amount,
      status: 'pending',
      payment_method: 'SBI_EPAY',
      order_id: orderId
    }).select().single();

    if (error) throw error;

    // Return the encrypted payload and URL to the frontend so it can submit the form to SBI ePay
    res.json({ 
      orderId, 
      paymentUrl: 'https://staging.sbiepay.sbi/pay', // Staging URL
      payload: 'mock_encrypted_payload' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to initiate payment', error: error.message });
  }
});

// @desc    Handle SBI ePay Callback
// @route   POST /api/fees/payment-callback
// @access  Public (SBI ePay Server)
router.post('/payment-callback', async (req, res) => {
  try {
    const { responsePayload } = req.body; // Encrypted response from SBI ePay

    // Decrypt the payload
    // const decrypted = decrypt(responsePayload, MERCHANT_KEY);
    // Parse the decrypted response
    const mockDecrypted = { orderId: req.body.orderId, status: 'SUCCESS', sbiRef: 'SBI' + Date.now() };

    // Update transaction
    const { error } = await supabase.from('transactions')
      .update({ 
        status: mockDecrypted.status, 
        sbi_reference_id: mockDecrypted.sbiRef,
        sbi_response: mockDecrypted 
      })
      .eq('order_id', mockDecrypted.orderId);

    if (error) throw error;

    // Optionally redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL}/payment-status?orderId=${mockDecrypted.orderId}`);
  } catch (error) {
    res.status(500).json({ message: 'Callback processing failed', error: error.message });
  }
});

// @desc    Double Verification for SBI ePay
// @route   POST /api/fees/verify-payment
// @access  Public
router.post('/verify-payment', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // Call SBI ePay Status Query API to verify final status
    // const response = await fetch('https://staging.sbiepay.sbi/statusQuery', { ... })
    const mockStatusResponse = { status: 'SUCCESS' }; // Mock response
    
    // Update our DB if needed
    await supabase.from('transactions')
      .update({ status: mockStatusResponse.status })
      .eq('order_id', orderId);

    res.json({ verified: true, status: mockStatusResponse.status });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
});

module.exports = router;
