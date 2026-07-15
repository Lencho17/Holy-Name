const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const { transporter } = require('../utils/mailer');

// ─────────────────────────────────────────────────
// SCHOOL ADMIN ENDPOINTS
// ─────────────────────────────────────────────────

// @desc    Get school wallet balance, ledger, and payout history
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

    // Fetch payout requests history
    const { data: payouts } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('school_id', school_id)
      .order('requested_at', { ascending: false });

    // Fetch wallet ledger (audit trail)
    const { data: ledger } = await supabase
      .from('wallet_ledger')
      .select('*')
      .eq('school_id', school_id)
      .order('created_at', { ascending: false })
      .limit(200);

    // Calculate total collections (net_to_school from transactions)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('net_to_school')
      .eq('school_id', school_id)
      .eq('status', 'completed');

    const totalEarnings = transactions?.reduce((sum, tx) => sum + Number(tx.net_to_school), 0) || 0;

    // Calculate total payouts (only Approved/Processed)
    const totalPayouts = (payouts || [])
      .filter(p => p.status === 'Approved' || p.status === 'Processed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({
      balance: wallet.balance,
      totalEarnings,
      totalPayouts,
      payouts: payouts || [],
      ledger: ledger || []
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Request a payout from wallet (goes to Pending for SuperAdmin approval)
// @route   POST /api/wallet/payout
// @access  Private (Admin)
router.post('/payout', protect, async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (amount < 100) {
      return res.status(400).json({ message: 'Minimum payout amount is ₹100' });
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

    // 2. Deduct from wallet immediately (escrow hold)
    const newBalance = Number(wallet.balance) - Number(amount);
    await supabase
      .from('school_wallets')
      .update({ balance: newBalance, last_updated: new Date() })
      .eq('id', wallet.id);

    // 3. Record debit in wallet ledger
    const { data: payoutRequest, error: payoutError } = await supabase
      .from('payout_requests')
      .insert([{ school_id, amount, status: 'Pending' }])
      .select()
      .single();

    if (payoutError) throw payoutError;

    await supabase.from('wallet_ledger').insert({
      school_id,
      type: 'debit',
      amount: Number(amount),
      balance_after: newBalance,
      reference_type: 'payout',
      reference_id: payoutRequest.id,
      description: `Payout requested — ₹${amount} (pending approval)`
    });

    // 4. Send Email Notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.user.email,
      subject: 'Wallet Payout Requested - VidyaBarta SaaS',
      html: `
        <h3>Payout Request Submitted</h3>
        <p>Dear Admin,</p>
        <p>Your cash-out request for <strong>₹${amount}</strong> has been submitted on ${new Date().toLocaleString('en-IN')}.</p>
        <p>The amount has been reserved from your wallet and is <strong>pending approval</strong>. You will be notified once it is processed.</p>
        <p><strong>Remaining Balance:</strong> ₹${newBalance.toFixed(2)}</p>
        <p>Thank you for using VidyaBarta.</p>
      `
    };

    await transporter.sendMail(mailOptions).catch(e => console.error('Mail error:', e));

    res.status(201).json({
      message: 'Payout request submitted (pending approval)',
      balance: newBalance,
      payout: payoutRequest
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error during payout' });
  }
});

// ─────────────────────────────────────────────────
// SUPERADMIN ENDPOINTS
// ─────────────────────────────────────────────────

// @desc    Get all school wallets (SuperAdmin overview)
// @route   GET /api/wallet/all-wallets
// @access  Private (SuperAdmin/Developer)
router.get('/all-wallets', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { data: wallets, error } = await supabase
      .from('school_wallets')
      .select('*, schools(name, subdomain, logo_url)')
      .order('balance', { ascending: false });

    if (error) throw error;

    // Aggregate stats
    const totalEscrow = (wallets || []).reduce((sum, w) => sum + Number(w.balance), 0);

    res.json({
      wallets: wallets || [],
      totalEscrow
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get all payout requests (SuperAdmin)
// @route   GET /api/wallet/all-payouts
// @access  Private (SuperAdmin/Developer)
router.get('/all-payouts', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { data: payouts, error } = await supabase
      .from('payout_requests')
      .select('*, schools(name, subdomain)')
      .order('requested_at', { ascending: false });

    if (error) throw error;

    const pendingCount = (payouts || []).filter(p => p.status === 'Pending').length;
    const pendingAmount = (payouts || [])
      .filter(p => p.status === 'Pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({
      payouts: payouts || [],
      pendingCount,
      pendingAmount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Approve or reject a payout request (SuperAdmin)
// @route   PATCH /api/wallet/payout/:id/status
// @access  Private (SuperAdmin/Developer)
router.patch('/payout/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }

    // Fetch the payout request
    const { data: payout, error: fetchError } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !payout) {
      return res.status(404).json({ message: 'Payout request not found' });
    }

    if (payout.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot update — payout is already ${payout.status}` });
    }

    // Update payout status
    const { error: updateError } = await supabase
      .from('payout_requests')
      .update({
        status,
        admin_note: admin_note || null,
        processed_by: req.user.email || req.user.name,
        processed_at: new Date()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // If REJECTED, refund the amount back to the wallet
    if (status === 'Rejected') {
      const { data: wallet } = await supabase
        .from('school_wallets')
        .select('*')
        .eq('school_id', payout.school_id)
        .single();

      if (wallet) {
        const refundedBalance = Number(wallet.balance) + Number(payout.amount);
        await supabase
          .from('school_wallets')
          .update({ balance: refundedBalance, last_updated: new Date() })
          .eq('id', wallet.id);

        // Ledger entry for refund
        await supabase.from('wallet_ledger').insert({
          school_id: payout.school_id,
          type: 'credit',
          amount: Number(payout.amount),
          balance_after: refundedBalance,
          reference_type: 'payout',
          reference_id: payout.id,
          description: `Payout rejected — ₹${payout.amount} refunded to wallet${admin_note ? ` (${admin_note})` : ''}`
        });
      }
    }

    // If APPROVED, update ledger description
    if (status === 'Approved') {
      // Update the existing debit ledger entry description
      await supabase
        .from('wallet_ledger')
        .update({ description: `Payout approved — ₹${payout.amount} transferred to bank` })
        .eq('reference_id', payout.id)
        .eq('reference_type', 'payout')
        .eq('type', 'debit');
    }

    res.json({ message: `Payout ${status.toLowerCase()} successfully` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get platform-wide wallet summary stats (SuperAdmin)
// @route   GET /api/wallet/summary
// @access  Private (SuperAdmin/Developer)
router.get('/summary', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Total escrow held across all schools
    const { data: wallets } = await supabase
      .from('school_wallets')
      .select('balance');

    const totalEscrow = (wallets || []).reduce((sum, w) => sum + Number(w.balance), 0);

    // Pending payouts
    const { data: pendingPayouts } = await supabase
      .from('payout_requests')
      .select('amount')
      .eq('status', 'Pending');

    const pendingPayoutAmount = (pendingPayouts || []).reduce((sum, p) => sum + Number(p.amount), 0);

    // Total processed payouts
    const { data: processedPayouts } = await supabase
      .from('payout_requests')
      .select('amount')
      .in('status', ['Approved', 'Processed']);

    const totalProcessedPayouts = (processedPayouts || []).reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({
      totalEscrow,
      pendingPayoutCount: (pendingPayouts || []).length,
      pendingPayoutAmount,
      totalProcessedPayouts,
      totalWallets: (wallets || []).length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
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

      await supabase.from('wallet_ledger').insert({
        school_id,
        type: 'credit',
        amount: Number(amount),
        balance_after: Number(amount),
        reference_type: 'manual_adjustment',
        description: 'Manual funds added (wallet created)'
      });
    } else {
        const newBalance = Number(wallet.balance) + Number(amount);
        await supabase
        .from('school_wallets')
        .update({ balance: newBalance, last_updated: new Date() })
        .eq('id', wallet.id);

        await supabase.from('wallet_ledger').insert({
          school_id,
          type: 'credit',
          amount: Number(amount),
          balance_after: newBalance,
          reference_type: 'manual_adjustment',
          description: `Manual funds added — ₹${amount}`
        });
    }
    res.send('OK');
});

module.exports = router;
