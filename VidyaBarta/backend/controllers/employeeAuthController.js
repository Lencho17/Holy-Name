const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @route   POST /api/employee-auth/login
// @desc    Authenticate employee & get token
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const { data: employee, error } = await supabase
      .from('vidyabarta_employees')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      employee: {
        id: employee.id,
        role: employee.role,
        is_first_login: employee.is_first_login
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, is_first_login: employee.is_first_login });
      }
    );
  } catch (err) {
    console.error('Employee login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/employee-auth/setup-profile
// @desc    Setup profile on first login (change password)
// @access  Private (Employee)
exports.setupProfile = async (req, res) => {
  try {
    const { newPassword, phone, dob, address } = req.body;
    const employeeId = req.user.id; // from auth middleware

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updateData = {
      password: hashedPassword,
      is_first_login: false,
      updated_at: new Date()
    };

    if (phone) updateData.phone = phone;
    if (dob) updateData.dob = dob;
    if (address) updateData.address = address;

    const { error } = await supabase
      .from('vidyabarta_employees')
      .update(updateData)
      .eq('id', employeeId);

    if (error) throw error;

    res.json({ message: 'Profile updated successfully. Please log in with your new password.' });
  } catch (err) {
    console.error('Setup profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/employee-auth/me
// @desc    Get logged in employee profile
// @access  Private (Employee)
exports.getProfile = async (req, res) => {
  try {
    const { data: employee, error } = await supabase
      .from('vidyabarta_employees')
      .select('id, name, email, phone, dob, address, role, payment_type, salary_amount, is_first_login, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/employee-auth/clock-in
// @desc    Clock in (start a new timesheet session)
// @access  Private (Employee)
exports.clockIn = async (req, res) => {
  try {
    // Check if already clocked in
    const { data: activeSession, error: checkErr } = await supabase
      .from('vidyabarta_employee_timesheets')
      .select('id')
      .eq('employee_id', req.user.id)
      .eq('status', 'online')
      .single();

    if (activeSession) {
      return res.status(400).json({ message: 'Already clocked in' });
    }

    const { data, error } = await supabase
      .from('vidyabarta_employee_timesheets')
      .insert([{ employee_id: req.user.id, status: 'online' }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Clock in error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/employee-auth/clock-out
// @desc    Clock out (end active timesheet session)
// @access  Private (Employee)
exports.clockOut = async (req, res) => {
  try {
    const { data: activeSession, error: checkErr } = await supabase
      .from('vidyabarta_employee_timesheets')
      .select('*')
      .eq('employee_id', req.user.id)
      .eq('status', 'online')
      .single();

    if (!activeSession) {
      return res.status(400).json({ message: 'Not currently clocked in' });
    }

    const clockOutTime = new Date();
    const clockInTime = new Date(activeSession.clock_in);
    const durationMinutes = Math.floor((clockOutTime - clockInTime) / (1000 * 60));

    const { data, error } = await supabase
      .from('vidyabarta_employee_timesheets')
      .update({
        clock_out: clockOutTime.toISOString(),
        duration_minutes: durationMinutes,
        status: 'offline'
      })
      .eq('id', activeSession.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Clock out error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/employee-auth/timesheets
// @desc    Get employee's timesheets
// @access  Private (Employee)
exports.getTimesheets = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vidyabarta_employee_timesheets')
      .select('*')
      .eq('employee_id', req.user.id)
      .order('clock_in', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get timesheets error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/employee-auth/payout
// @desc    Get estimated payout for employee based on timesheets
// @access  Private (Employee)
exports.getPayout = async (req, res) => {
  try {
    // We will calculate payout for current month by default
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: employee, error: empErr } = await supabase
      .from('vidyabarta_employees')
      .select('payment_type, salary_amount')
      .eq('id', req.user.id)
      .single();

    if (empErr || !employee) throw empErr || new Error('Employee not found');

    const { data: timesheets, error: timeErr } = await supabase
      .from('vidyabarta_employee_timesheets')
      .select('duration_minutes, clock_in')
      .eq('employee_id', req.user.id)
      .gte('clock_in', startOfMonth)
      .lte('clock_in', endOfMonth)
      .eq('status', 'offline'); // Only completed sessions

    if (timeErr) throw timeErr;

    const totalMinutes = timesheets.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
    const totalHours = totalMinutes / 60;
    
    let estimatedPayout = 0;
    if (employee.payment_type === 'hourly') {
      estimatedPayout = totalHours * (employee.salary_amount || 0);
    } else {
      // Weekly or Monthly fixed salary
      // For now, we simply display the fixed amount. If they want pro-rated later, we can add it here.
      estimatedPayout = employee.salary_amount || 0;
    }

    res.json({
      payment_type: employee.payment_type,
      salary_amount: employee.salary_amount,
      total_hours: totalHours.toFixed(2),
      estimated_payout: estimatedPayout,
      currency: 'INR',
      period: 'current_month'
    });
  } catch (err) {
    console.error('Get payout error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
