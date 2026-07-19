const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/mailer');
const crypto = require('crypto');
const csv = require('csv-parser');
const stream = require('stream');

// Generate random password
const generateRandomPassword = () => {
  return crypto.randomBytes(4).toString('hex'); // 8 character random hex
};

// Send Welcome Email
const sendWelcomeEmail = async (email, name, password) => {
  const loginUrl = 'https://employee.vidyabarta.com/login'; // Employee Hub URL

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Vidyabarta!</h2>
      <p>Dear ${name},</p>
      <p>You have been added to the Vidyabarta Employee Hub.</p>
      <p>Please log in using your temporary credentials below:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Login URL: <a href="${loginUrl}">${loginUrl}</a></p>
      <p>You will be asked to fill up your profile and change your password upon your first login.</p>
      <br/>
      <p>Best regards,<br/>The Vidyabarta Team</p>
    </div>
  `;

  await sendEmail({
    from: `"Vidyabarta Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Vidyabarta Employee Hub - Your Credentials',
    html: emailHtml
  });
};

// @desc    Get all Vidyabarta employees
// @route   GET /api/superadmin/employees
// @access  Private (Superadmin)
exports.getEmployees = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vidyabarta_employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a single employee manually
// @route   POST /api/superadmin/employees
// @access  Private (Superadmin)
exports.addEmployee = async (req, res) => {
  try {
    const { name, email, phone, dob, address, payment_type, salary_amount, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if email exists
    const { data: existing, error: checkError } = await supabase
      .from('vidyabarta_employees')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    const tempPassword = generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const employeeData = {
      name,
      email,
      phone,
      dob: dob || null,
      address,
      payment_type: payment_type || null,
      salary_amount: salary_amount ? parseFloat(salary_amount) : null,
      role: role || 'helpdesk',
      password: hashedPassword,
      is_first_login: true
    };

    const { data: newEmployee, error } = await supabase
      .from('vidyabarta_employees')
      .insert(employeeData)
      .select()
      .single();

    if (error) throw error;

    // Send welcome email
    await sendWelcomeEmail(email, name, tempPassword);

    res.status(201).json({ message: 'Employee added successfully', employee: newEmployee });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Bulk upload employees via CSV
// @route   POST /api/superadmin/employees/bulk
// @access  Private (Superadmin)
exports.bulkUploadEmployees = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let addedCount = 0;
        let errors = [];

        for (const row of results) {
          const { name, email, phone, dob, address, payment_type, salary, role } = row;
          
          if (!name || !email) {
            errors.push({ email: email || 'unknown', message: 'Name and email are required' });
            continue;
          }

          try {
            // Check existing
            const { data: existing } = await supabase
              .from('vidyabarta_employees')
              .select('id')
              .eq('email', email)
              .single();

            if (existing) {
              errors.push({ email, message: 'Email already exists' });
              continue;
            }

            const tempPassword = generateRandomPassword();
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);

            let parsedDate = null;
            if (dob) {
              const d = new Date(dob);
              if (!isNaN(d)) parsedDate = d.toISOString().split('T')[0];
            }

            const employeeData = {
              name,
              email,
              phone,
              dob: parsedDate,
              address,
              payment_type: ['hourly', 'weekly', 'monthly'].includes(payment_type?.toLowerCase()) ? payment_type.toLowerCase() : null,
              salary_amount: salary ? parseFloat(salary) : null,
              role: role || 'helpdesk',
              password: hashedPassword,
              is_first_login: true
            };

            const { error: insertError } = await supabase
              .from('vidyabarta_employees')
              .insert(employeeData);

            if (insertError) throw insertError;

            addedCount++;
            
            // Send welcome email asynchronously
            sendWelcomeEmail(email, name, tempPassword).catch(err => {
              console.error('Failed to send welcome email for', email, err);
            });

          } catch (err) {
            errors.push({ email, message: err.message });
          }
        }

        res.json({
          message: `Successfully added ${addedCount} employees.`,
          added: addedCount,
          errors
        });
      });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/superadmin/employees/:id
// @access  Private (Superadmin)
exports.updateEmployee = async (req, res) => {
  try {
    const { name, phone, dob, address, payment_type, salary_amount, role } = req.body;

    const updateData = {
      name,
      phone,
      dob: dob || null,
      address,
      payment_type: payment_type || null,
      salary_amount: salary_amount ? parseFloat(salary_amount) : null,
      role: role || null,
      updated_at: new Date()
    };

    // Remove undefined
    const cleanUpdate = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined));

    const { data: employee, error } = await supabase
      .from('vidyabarta_employees')
      .update(cleanUpdate)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee updated', employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/superadmin/employees/:id
// @access  Private (Superadmin)
exports.deleteEmployee = async (req, res) => {
  try {
    const { error } = await supabase
      .from('vidyabarta_employees')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
