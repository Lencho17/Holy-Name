const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const { transporter } = require('../utils/mailer');

// @desc    Get school wallet balance and history
// @route   GET /api/wallet
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const school_id = req.user.school_id;

    // Fetch or create wallet
    let { data: wallet } = await supabase
      .from('school_wallets')
      .select('*')
      .eq('school_id', school_id)
      .single();

    if (!wallet) {
      const { data: newWallet } = await supabase
        .from('school_wallets')
        .insert([{ school_id, balance: 0 }])
        .select()
        .single();
      wallet = newWallet;
    }

    // Also fetch payout requests history
    const { data: payouts } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('school_id', school_id)
      .order('requested_at', { ascending: false });

    // Calculate total collections (net_to_school from transactions)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('net_to_school')
      .eq('school_id', school_id)
      .eq('status', 'completed');
      
    const totalEarnings = transactions?.reduce((sum, tx) => sum + Number(tx.net_to_school), 0) || 0;

    res.json({
      balance: wallet.balance,
      totalEarnings,
      payouts: payouts || []
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Request a payout from wallet
// @route   POST /api/wallet/payout
// @access  Private (Admin)
router.post('/payout', protect, async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // 1. Get wallet
    const { data: wallet } = await supabase
      .from('school_wallets')
      .select('*')
      .eq('school_id', school_id)
      .single();

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance for payout' });
    }

    // 2. Deduct from wallet immediately
    const newBalance = Number(wallet.balance) - Number(amount);
    await supabase
      .from('school_wallets')
      .update({ balance: newBalance, last_updated: new Date() })
      .eq('id', wallet.id);

    // 3. Create payout request
    const { data: payoutRequest, error: payoutError } = await supabase
      .from('payout_requests')
      .insert([{ school_id, amount, status: 'Processed' }]) // Auto-processed for now, but usually 'Pending'
      .select()
      .single();

    if (payoutError) throw payoutError;

    // 4. Send Email Notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.user.email,
      subject: 'Wallet Payout Processed - VidyaBarta SaaS',
      html: `
        <h3>Payout Processed</h3>
        <p>Dear Admin,</p>
        <p>Your cash-out request for <strong>₹${amount}</strong> has been processed successfully on ${new Date().toLocaleString()}.</p>
        <p>The amount has been deducted from your platform wallet and will reflect in your registered bank account shortly.</p>
        <p>Thank you for using VidyaBarta.</p>
      `
    };

    await transporter.sendMail(mailOptions).catch(e => console.error('Mail error:', e));

    res.status(201).json({ message: 'Payout requested successfully', balance: newBalance });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error during payout' });
  }
});

// Webhook / utility for simulating adding funds to a wallet when a transaction completes
router.post('/add-funds', async (req, res) => {
    // In production, this would be called by the SBI ePay webhook internally
    const { school_id, amount } = req.body;
    
    // Fetch or create wallet
    let { data: wallet } = await supabase
      .from('school_wallets')
      .select('*')
      .eq('school_id', school_id)
      .single();

    if (!wallet) {
      const { data: newWallet } = await supabase
        .from('school_wallets')
        .insert([{ school_id, balance: amount }])
        .select()
        .single();
    } else {
        await supabase
        .from('school_wallets')
        .update({ balance: Number(wallet.balance) + Number(amount), last_updated: new Date() })
        .eq('id', wallet.id);
    }
    res.send('OK');
});

module.exports = router;
