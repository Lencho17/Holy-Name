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
