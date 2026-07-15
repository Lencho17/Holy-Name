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
    const { admissionId, contactNumber, trimester, isNewAdmission } = req.query;
    if (!admissionId || !contactNumber) {
      return res.status(400).json({ message: 'Admission ID and Contact Number are required' });
    }

    // Verify student
    const { data: student, error } = await supabase
      .from('students')
      .select('id, student_name')
      .eq('admission_id', admissionId)
      .eq('contact_number', contactNumber)
      .maybeSingle();

    if (error || !student) {
      return res.status(404).json({ message: 'Student not found with provided credentials' });
    }

    const feeDetails = await calculateStudentFee(student.id, parseInt(trimester) || 1, isNewAdmission === 'true');
    feeDetails.student_name = student.student_name;
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
    const { admissionId, contactNumber, trimester, isNewAdmission } = req.body;
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
    const feeDetails = await calculateStudentFee(student.id, trimester, isNewAdmission);
    
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

module.exports = router;
