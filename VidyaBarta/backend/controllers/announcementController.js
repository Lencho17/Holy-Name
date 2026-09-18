const supabase = require('../config/supabase');
const { getEquivalentClasses } = require('../utils/classMapping');
const { sendEmail } = require('../utils/mailer');

/**
 * Helper to fetch matching students based on filters:
 * - class_level: 'All' or specific grade e.g. 'IV', '10', '9'
 * - section: 'All' or 'A', 'B', etc.
 * - fee_status: 'all', 'due'/'defaulters', 'admission_fee_pending', 'admission_fee_paid', 'all_clear'
 * - search: keyword for name or admission_id
 * - student_ids: optional array of explicit student UUIDs
 */
async function getMatchingStudents(schoolId, filters = {}) {
  const { class_level, section, fee_status, search, student_ids } = filters;

  let query = supabase
    .from('students')
    .select('id, student_name, admission_id, grade, section, email, contact_number, admission_fee_paid, enrollment_status, school_id')
    .neq('enrollment_status', 'deleted');

  if (schoolId) {
    query = query.or(`school_id.eq.${schoolId},school_id.is.null`);
  }

  // Filter by explicit student IDs if provided
  if (Array.isArray(student_ids) && student_ids.length > 0) {
    query = query.in('id', student_ids);
  }

  // Filter by search string
  if (search && search.trim()) {
    const s = search.trim();
    query = query.or(`student_name.ilike.%${s}%,admission_id.ilike.%${s}%,email.ilike.%${s}%`);
  }

  // Filter by Class Level
  if (class_level && String(class_level).trim().toLowerCase() !== 'all' && String(class_level).trim() !== '') {
    const variants = getEquivalentClasses(class_level);
    const orClauses = [];
    variants.forEach(v => {
      orClauses.push(`grade.eq."${v}"`);
      orClauses.push(`grade.ilike."${v} %"`);
      orClauses.push(`grade.ilike."Class ${v}%"`);
    });
    query = query.or(orClauses.join(','));
  }

  // Filter by Section
  if (section && String(section).trim().toLowerCase() !== 'all' && String(section).trim() !== '') {
    query = query.or(`section.eq."${section}",grade.ilike."% ${section}"`);
  }

  const { data: students, error } = await query;
  if (error) throw error;

  let filtered = students || [];

  // Filter by Fee Status
  if (fee_status && fee_status !== 'all') {
    // Check fee_records for pending/overdue dues
    const studentIds = filtered.map(s => s.id);
    let pendingFeeStudentIds = new Set();

    if (studentIds.length > 0) {
      const { data: pendingRecords } = await supabase
        .from('fee_records')
        .select('student_id')
        .in('student_id', studentIds)
        .in('status', ['Pending', 'Overdue', 'pending', 'overdue']);

      if (pendingRecords) {
        pendingRecords.forEach(r => pendingFeeStudentIds.add(r.student_id));
      }
    }

    if (fee_status === 'admission_fee_pending') {
      filtered = filtered.filter(s => s.admission_fee_paid === false);
    } else if (fee_status === 'admission_fee_paid') {
      filtered = filtered.filter(s => s.admission_fee_paid === true);
    } else if (fee_status === 'due' || fee_status === 'defaulters') {
      // Either admission fee unpaid OR pending fee record
      filtered = filtered.filter(s => s.admission_fee_paid === false || pendingFeeStudentIds.has(s.id));
    } else if (fee_status === 'all_clear' || fee_status === 'paid') {
      // Both admission fee paid AND no pending fee records
      filtered = filtered.filter(s => s.admission_fee_paid === true && !pendingFeeStudentIds.has(s.id));
    }
  }

  return filtered;
}

/**
 * Generate school announcement email HTML
 */
function generateAnnouncementEmailHtml({ schoolName, studentName, title, message, category, priority, admissionId, grade }) {
  const isUrgent = priority === 'Urgent' || priority === 'High';
  const headerColor = isUrgent ? '#DC2626' : '#2563EB';
  const badgeBg = isUrgent ? '#FEE2E2' : '#DBEAFE';
  const badgeColor = isUrgent ? '#991B1B' : '#1E40AF';
  const portalUrl = process.env.CLIENT_URL || 'https://holynamehsschool.in';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border: 1px solid #E2E8F0;">
      
      <!-- Top Banner -->
      <div style="background: linear-gradient(135deg, ${headerColor}, #1E3A8A); padding: 28px 32px; text-align: left;">
        <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
          ${schoolName || 'Holy Name School'}
        </p>
        <h1 style="margin: 8px 0 0; color: #FFFFFF; font-size: 22px; font-weight: 800; line-height: 1.3;">
          ${title}
        </h1>
      </div>

      <!-- Main Body -->
      <div style="padding: 32px;">
        
        <!-- Category & Priority Badges -->
        <div style="margin-bottom: 20px;">
          <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-right: 8px;">
            ${category || 'Announcement'}
          </span>
          ${isUrgent ? `
          <span style="display: inline-block; background-color: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">
            ⚠️ URGENT
          </span>` : ''}
        </div>

        <p style="font-size: 16px; font-weight: 600; color: #0F172A; margin: 0 0 16px;">
          Dear ${studentName || 'Student'},
        </p>

        <!-- Message Box -->
        <div style="background-color: #F8FAFC; border-left: 4px solid ${headerColor}; padding: 18px 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 15px; line-height: 1.65; color: #334155; white-space: pre-wrap;">
${message}
          </p>
        </div>

        <!-- Student Meta Box -->
        <div style="background-color: #F1F5F9; border-radius: 12px; padding: 14px 18px; margin-bottom: 28px; font-size: 13px; color: #475569;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span><strong>Admission ID:</strong> ${admissionId || 'N/A'}</span>
            <span><strong>Class / Grade:</strong> ${grade || 'N/A'}</span>
          </div>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0 16px;">
          <a href="${portalUrl}/student-login" style="display: inline-block; background-color: ${headerColor}; color: #FFFFFF; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
            Access Student Portal &rarr;
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94A3B8;">
        <p style="margin: 0 0 4px;">You are receiving this official communication as a registered student or parent.</p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${schoolName || 'Holy Name School'}. Powered by VidyaBarta.</p>
      </div>

    </div>
  </body>
  </html>
  `;
}

/**
 * @desc    Preview matching recipients for given filters
 * @route   GET /api/announcements/preview-recipients
 * @access  Private (Admin / Staff)
 */
exports.previewRecipients = async (req, res) => {
  try {
    const schoolId = req.user?.school_id || null;
    const { class_level, section, fee_status, search, student_ids } = req.query;

    let parsedStudentIds = null;
    if (student_ids) {
      parsedStudentIds = typeof student_ids === 'string' ? student_ids.split(',').filter(Boolean) : student_ids;
    }

    const students = await getMatchingStudents(schoolId, {
      class_level,
      section,
      fee_status,
      search,
      student_ids: parsedStudentIds
    });

    const emailReadyCount = students.filter(s => s.email && s.email.includes('@')).length;

    res.json({
      totalCount: students.length,
      emailReadyCount,
      missingEmailCount: students.length - emailReadyCount,
      students: students.slice(0, 100).map(s => ({
        id: s.id,
        name: s.student_name,
        admission_id: s.admission_id,
        grade: s.grade,
        section: s.section,
        email: s.email,
        fee_paid: s.admission_fee_paid,
        has_email: Boolean(s.email && s.email.includes('@'))
      }))
    });
  } catch (error) {
    console.error('Preview Recipients Error:', error);
    res.status(500).json({ message: 'Error previewing recipients', error: error.message });
  }
};

/**
 * @desc    Create & broadcast an announcement to filtered students
 * @route   POST /api/announcements
 * @access  Private (Admin / Staff)
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const schoolId = req.user?.school_id || null;
    const {
      title,
      message,
      target_class = 'All',
      target_section = 'All',
      target_fee_status = 'all',
      target_student_ids = [],
      category = 'General',
      priority = 'Normal',
      channels = ['in_app', 'email']
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    // 1. Get all matching students
    const matchedStudents = await getMatchingStudents(schoolId, {
      class_level: target_class,
      section: target_section,
      fee_status: target_fee_status,
      student_ids: target_student_ids
    });

    if (matchedStudents.length === 0) {
      return res.status(400).json({ message: 'No students matched the selected filters. Please adjust your criteria.' });
    }

    // 2. Fetch school profile for email branding
    let schoolName = 'Holy Name School';
    if (schoolId) {
      const { data: school } = await supabase
        .from('schools')
        .select('name')
        .eq('id', schoolId)
        .maybeSingle();
      if (school?.name) schoolName = school.name;
    }

    // 3. Check if sender exists in staff table (for FK constraint)
    let validStaffId = null;
    if (req.user?.id) {
      const { data: staffExists } = await supabase
        .from('staff')
        .select('id')
        .eq('id', req.user.id)
        .maybeSingle();
      if (staffExists) validStaffId = staffExists.id;
    }

    // 4. Create the announcement master record
    const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const { data: announcement, error: announceError } = await supabase
      .from('announcements')
      .insert({
        school_id: schoolId,
        staff_id: validStaffId,
        created_by: isUUID(req.user?.id) ? req.user.id : null,
        created_by_name: req.user?.name || req.user?.first_name || 'Administrator',
        title,
        message,
        target_class,
        target_section,
        target_fee_status,
        target_student_ids,
        category,
        priority,
        channels,
        stats: {
          total_recipients: matchedStudents.length,
          in_app_count: 0,
          email_sent: 0,
          email_failed: 0,
          email_skipped: 0
        }
      })
      .select()
      .single();

    if (announceError) throw announceError;

    let inAppCount = 0;
    let emailSentCount = 0;
    let emailFailedCount = 0;
    let emailSkippedCount = 0;

    // 4. Record In-Site Announcements for all matched students (permanently kept for lifetime in announcement section)
    if (matchedStudents.length > 0) {
      const notificationRows = matchedStudents.map(student => ({
        school_id: schoolId,
        student_id: student.id,
        announcement_id: announcement.id,
        title,
        message,
        category,
        priority,
        is_read: false
      }));

      // Chunk inserts in batches of 100
      for (let i = 0; i < notificationRows.length; i += 100) {
        const chunk = notificationRows.slice(i, i + 100);
        const { error: notifError } = await supabase.from('student_notifications').insert(chunk);
        if (!notifError) {
          inAppCount += chunk.length;
        } else {
          console.error('Batch in-app notification insert error:', notifError);
        }
      }
    }

    // 5. Dispatch Email Notifications if selected
    if (channels.includes('email')) {
      const emailRecipients = matchedStudents.filter(s => s.email && s.email.includes('@'));
      emailSkippedCount = matchedStudents.length - emailRecipients.length;

      // Send emails concurrently in batches of 5 to respect rate limits
      for (let i = 0; i < emailRecipients.length; i += 5) {
        const batch = emailRecipients.slice(i, i + 5);
        await Promise.all(
          batch.map(async (student) => {
            try {
              const html = generateAnnouncementEmailHtml({
                schoolName,
                studentName: student.student_name,
                title,
                message,
                category,
                priority,
                admissionId: student.admission_id,
                grade: student.grade
              });

              await sendEmail({
                from: `"${schoolName}" <${process.env.EMAIL_USER}>`,
                to: student.email,
                subject: `${priority === 'Urgent' ? '⚠️ [URGENT] ' : ''}${title} - ${schoolName}`,
                html,
                text: `${title}\n\nDear ${student.student_name},\n\n${message}\n\n${schoolName}`
              });

              emailSentCount++;
            } catch (mailErr) {
              console.error(`Failed to send email to ${student.email}:`, mailErr.message);
              emailFailedCount++;
            }
          })
        );
      }
    }

    // 6. Update announcement stats
    const finalStats = {
      total_recipients: matchedStudents.length,
      in_app_count: inAppCount,
      email_sent: emailSentCount,
      email_failed: emailFailedCount,
      email_skipped: emailSkippedCount
    };

    await supabase
      .from('announcements')
      .update({ stats: finalStats })
      .eq('id', announcement.id);

    res.status(201).json({
      message: 'Announcement broadcasted successfully!',
      announcement: {
        ...announcement,
        stats: finalStats
      },
      summary: {
        total_recipients: matchedStudents.length,
        in_app_delivered: inAppCount,
        email_sent: emailSentCount,
        email_failed: emailFailedCount,
        email_skipped_no_email: emailSkippedCount
      }
    });
  } catch (error) {
    console.error('Create Announcement Error:', error);
    res.status(500).json({ message: 'Failed to broadcast announcement', error: error.message });
  }
};

/**
 * @desc    Get all announcements for school
 * @route   GET /api/announcements
 * @access  Private (Admin / Staff)
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const schoolId = req.user?.school_id || null;

    let query = supabase
      .from('announcements')
      .select('*, staff:staff_id(name)')
      .order('created_at', { ascending: false });

    if (schoolId) {
      query = query.or(`school_id.eq.${schoolId},school_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get Announcements Error:', error);
    res.status(500).json({ message: 'Server error fetching announcements' });
  }
};

/**
 * @desc    Delete announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (Admin)
 */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete linked student notifications first
    await supabase.from('student_notifications').delete().eq('announcement_id', id);

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete Announcement Error:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
};
