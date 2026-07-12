const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, 'VidyaBarta/backend/routes/auth.js');
let content = fs.readFileSync(authPath, 'utf8');

if (!content.includes('/school-admins')) {
  const schoolAdminsRoutes = `
// GET /api/auth/school-admins (for school admins to manage their sub-admins)
router.get('/school-admins', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only school admins can manage sub-admins' });
    }
    const { data: admins } = await supabase
      .from('admins')
      .select('id, first_name, last_name, email, phone, is_approved, created_at')
      .eq('school_id', req.user.school_id)
      .eq('role', 'admin');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/auth/school-admins (for school admins to add sub-admins)
router.post('/school-admins', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Check limit (Max 3 admins per school)
    const { count } = await supabase
      .from('admins')
      .select('id', { count: 'exact' })
      .eq('school_id', req.user.school_id)
      .eq('role', 'admin');
      
    if (count >= 3) {
      return res.status(400).json({ message: 'Limit reached: Maximum 3 admins allowed per school.' });
    }

    const { first_name, last_name, email, phone, password } = req.body;
    const lowerEmail = email.toLowerCase();
    const { data: exists } = await supabase.from('admins').select('id').eq('email', lowerEmail).single();
    
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: admin, error } = await supabase.from('admins').insert({
      first_name,
      last_name,
      email: lowerEmail,
      phone,
      password: hashedPassword,
      school_id: req.user.school_id,
      role: 'admin',
      is_approved: true // Auto approved since created by the primary admin
    }).select().single();

    if (error) throw error;
    res.status(201).json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/auth/school-admins/:id
router.delete('/school-admins/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    
    // Ensure the admin to delete belongs to the same school
    const { data: adminToDelete } = await supabase.from('admins').select('school_id').eq('id', req.params.id).single();
    if (!adminToDelete || adminToDelete.school_id !== req.user.school_id) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Cannot delete oneself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await supabase.from('admins').delete().eq('id', req.params.id);
    res.json({ message: 'Admin removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
`;

  // Insert before module.exports = router;
  content = content.replace("module.exports = router;", schoolAdminsRoutes + "\nmodule.exports = router;");
  fs.writeFileSync(authPath, content, 'utf8');
  console.log('auth.js successfully updated!');
} else {
  console.log('Routes already exist.');
}
