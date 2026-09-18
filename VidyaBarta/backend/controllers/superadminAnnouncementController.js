const supabase = require('../config/supabase');
const { sendEmail } = require('../utils/mailer');

/**
 * Helper to fetch target schools and their administrator contacts
 */
async function getTargetSchoolsAndAdmins(filters = {}) {
  const { target_type = 'all', target_school_ids = [], target_package, target_status } = filters;

  let schoolQuery = supabase
    .from('schools')
    .select('id, name, email, phone, subdomain, custom_domain, package, status');

  if (target_type === 'specific' && Array.isArray(target_school_ids) && target_school_ids.length > 0) {
    schoolQuery = schoolQuery.in('id', target_school_ids);
  } else if (target_type === 'package' && target_package) {
    schoolQuery = schoolQuery.eq('package', target_package);
  } else if (target_type === 'status' && target_status) {
    schoolQuery = schoolQuery.eq('status', target_status);
  }

  const { data: schools, error: schoolErr } = await schoolQuery;
  if (schoolErr) throw schoolErr;

  const matchedSchools = schools || [];
  const schoolIds = matchedSchools.map(s => s.id);

  // Fetch administrator contacts for these schools
  let schoolAdmins = [];
  if (schoolIds.length > 0) {
    const { data: admins, error: adminErr } = await supabase
      .from('admins')
      .select('id, name, email, role, school_id')
      .in('school_id', schoolIds)
      .eq('is_approved', true);

    if (!adminErr && admins) {
      schoolAdmins = admins;
    }
  }

  return { schools: matchedSchools, admins: schoolAdmins };
}

/**
 * Generate VidyaBarta SaaS Platform Announcement HTML Email
 */
function generatePlatformEmailHtml({ schoolName, recipientName, title, message, category, priority, actionUrl, actionLabel }) {
  const isCritical = priority === 'Critical' || priority === 'Urgent';
  const headerGradient = isCritical
    ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
    : 'linear-gradient(135deg, #4338CA 0%, #1E1B4B 100%)';
  const badgeBg = isCritical ? '#FEE2E2' : '#E0E7FF';
  const badgeColor = isCritical ? '#991B1B' : '#3730A3';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; margin: 0; padding: 32px 16px; color: #334155;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); border: 1px solid #E2E8F0;">
      
      <!-- Platform Header -->
      <div style="background: ${headerGradient}; padding: 36px 32px; text-align: left;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 20px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.03em;">VidyaBarta</span>
          <span style="background-color: rgba(255, 255, 255, 0.2); color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; margin-left: 10px; text-transform: uppercase;">
            Platform Broadcast
          </span>
        </div>
        <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 800; line-height: 1.35;">
          ${title}
        </h1>
      </div>

      <!-- Content Area -->
      <div style="padding: 32px;">
        
        <div style="margin-bottom: 20px;">
          <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-right: 8px;">
            ${category || 'Platform Notice'}
          </span>
          ${isCritical ? `
          <span style="display: inline-block; background-color: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">
            CRITICAL ALERT
          </span>` : ''}
        </div>

        <p style="font-size: 16px; font-weight: 600; color: #0F172A; margin: 0 0 16px;">
          Hello ${recipientName || 'Administrator'} (${schoolName}),
        </p>

        <div style="background-color: #F8FAFC; border-left: 4px solid ${isCritical ? '#DC2626' : '#4338CA'}; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 28px;">
          <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #334155; white-space: pre-wrap;">
${message}
          </p>
        </div>

        ${actionUrl ? `
        <div style="text-align: center; margin: 32px 0 16px;">
          <a href="${actionUrl}" style="display: inline-block; background-color: ${isCritical ? '#DC2626' : '#4338CA'}; color: #FFFFFF; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 700; box-shadow: 0 4px 14px rgba(67, 56, 202, 0.35);">
            ${actionLabel || 'View Details'} &rarr;
          </a>
        </div>` : ''}

        <div style="background-color: #F1F5F9; border-radius: 12px; padding: 14px 18px; margin-top: 24px; font-size: 12px; color: #64748B;">
          <p style="margin: 0;">This announcement affects your school portal on VidyaBarta. If you have questions, contact <a href="mailto:support@vidyabarta.com" style="color: #4338CA; text-decoration: underline;">support@vidyabarta.com</a>.</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94A3B8;">
        <p style="margin: 0 0 4px;">&copy; ${new Date().getFullYear()} VidyaBarta SaaS Platform. All rights reserved.</p>
        <p style="margin: 0;">Sent by VidyaBarta System Operations.</p>
      </div>

    </div>
  </body>
  </html>
  `;
}

/**
 * @desc    Preview school recipients for SaaS SuperAdmin
 * @route   GET /api/superadmin/announcements/preview-recipients
 * @access  Private (Superadmin / Developer)
 */
exports.previewSchoolRecipients = async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: Superadmin only' });
    }

    const { target_type = 'all', target_school_ids, target_package, target_status } = req.query;

    let parsedIds = [];
    if (target_school_ids) {
      parsedIds = typeof target_school_ids === 'string' ? target_school_ids.split(',').filter(Boolean) : target_school_ids;
    }

    const { schools, admins } = await getTargetSchoolsAndAdmins({
      target_type,
      target_school_ids: parsedIds,
      target_package,
      target_status
    });

    const emailRecipientsSet = new Set();
    schools.forEach(s => {
      if (s.email && s.email.includes('@')) emailRecipientsSet.add(s.email.toLowerCase().trim());
    });
    admins.forEach(a => {
      if (a.email && a.email.includes('@')) emailRecipientsSet.add(a.email.toLowerCase().trim());
    });

    res.json({
      schoolsCount: schools.length,
      adminsCount: admins.length,
      totalEmailRecipients: emailRecipientsSet.size,
      schools: schools.map(s => ({
        id: s.id,
        name: s.name,
        package: s.package,
        status: s.status,
        email: s.email,
        subdomain: s.subdomain,
        custom_domain: s.custom_domain
      }))
    });
  } catch (error) {
    console.error('Superadmin Preview Schools Error:', error);
    res.status(500).json({ message: 'Error previewing schools', error: error.message });
  }
};

/**
 * @desc    Publish announcement to schools (SuperAdmin)
 * @route   POST /api/superadmin/announcements
 * @access  Private (Superadmin / Developer)
 */
exports.publishPlatformAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: Superadmin only' });
    }

    const {
      title,
      message,
      category = 'Platform Update',
      priority = 'Normal',
      target_type = 'all',
      target_school_ids = [],
      target_package,
      target_status,
      channels = ['in_app', 'email'],
      action_url,
      action_label
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const { schools, admins } = await getTargetSchoolsAndAdmins({
      target_type,
      target_school_ids,
      target_package,
      target_status
    });

    if (schools.length === 0) {
      return res.status(400).json({ message: 'No schools matched the selected targeting criteria' });
    }

    // 1. Insert master record in platform_announcements
    const { data: announcement, error: insertErr } = await supabase
      .from('platform_announcements')
      .insert({
        title,
        message,
        category,
        priority,
        target_type,
        target_school_ids,
        target_package,
        target_status,
        channels,
        action_url,
        action_label,
        created_by: req.user.id,
        stats: {
          schools_count: schools.length,
          admins_count: admins.length,
          in_app_count: 0,
          email_sent: 0,
          email_failed: 0
        }
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    let inAppCount = 0;
    let emailSentCount = 0;
    let emailFailedCount = 0;

    // 2. Dispatch In-App Notifications to School Admin Dashboard
    if (channels.includes('in_app')) {
      const schoolNotificationRows = schools.map(school => ({
        school_id: school.id,
        platform_announcement_id: announcement.id,
        title,
        message,
        category,
        priority,
        action_url: action_url || null,
        action_label: action_label || null,
        is_read: false
      }));

      const { error: notifErr } = await supabase
        .from('school_notifications')
        .insert(schoolNotificationRows);

      if (!notifErr) {
        inAppCount = schoolNotificationRows.length;
      } else {
        console.error('Error inserting school notifications:', notifErr);
      }
    }

    // 3. Dispatch Emails to School Contacts & Admins
    if (channels.includes('email')) {
      const emailTasks = [];
      const sentEmails = new Set();

      // Collect school official emails
      schools.forEach(school => {
        if (school.email && school.email.includes('@')) {
          const emailKey = school.email.toLowerCase().trim();
          if (!sentEmails.has(emailKey)) {
            sentEmails.add(emailKey);
            emailTasks.push({
              to: school.email,
              schoolName: school.name,
              recipientName: school.name + ' Administration'
            });
          }
        }
      });

      // Collect school admin users' emails
      admins.forEach(admin => {
        if (admin.email && admin.email.includes('@')) {
          const emailKey = admin.email.toLowerCase().trim();
          if (!sentEmails.has(emailKey)) {
            sentEmails.add(emailKey);
            const school = schools.find(s => s.id === admin.school_id);
            emailTasks.push({
              to: admin.email,
              schoolName: school?.name || 'School Partner',
              recipientName: admin.name || 'School Administrator'
            });
          }
        }
      });

      // Send emails concurrently in batches of 5
      for (let i = 0; i < emailTasks.length; i += 5) {
        const batch = emailTasks.slice(i, i + 5);
        await Promise.all(
          batch.map(async (task) => {
            try {
              const html = generatePlatformEmailHtml({
                schoolName: task.schoolName,
                recipientName: task.recipientName,
                title,
                message,
                category,
                priority,
                actionUrl: action_url,
                actionLabel: action_label
              });

              await sendEmail({
                from: `"VidyaBarta Platform" <${process.env.EMAIL_USER}>`,
                to: task.to,
                subject: `${priority === 'Critical' || priority === 'Urgent' ? '🚨 [CRITICAL] ' : ''}${title} - VidyaBarta`,
                html,
                text: `${title}\n\nDear ${task.recipientName},\n\n${message}\n\nVidyaBarta Platform Team`
              });

              emailSentCount++;
            } catch (err) {
              console.error(`Platform broadcast email failed to ${task.to}:`, err.message);
              emailFailedCount++;
            }
          })
        );
      }
    }

    // 4. Update stats
    const finalStats = {
      schools_count: schools.length,
      admins_count: admins.length,
      in_app_count: inAppCount,
      email_sent: emailSentCount,
      email_failed: emailFailedCount
    };

    await supabase
      .from('platform_announcements')
      .update({ stats: finalStats })
      .eq('id', announcement.id);

    res.status(201).json({
      message: 'Platform announcement published successfully!',
      announcement: {
        ...announcement,
        stats: finalStats
      },
      summary: finalStats
    });
  } catch (error) {
    console.error('Publish Platform Announcement Error:', error);
    res.status(500).json({ message: 'Failed to publish announcement', error: error.message });
  }
};

/**
 * @desc    Get all platform announcements (SuperAdmin)
 * @route   GET /api/superadmin/announcements
 * @access  Private (Superadmin / Developer)
 */
exports.getPlatformAnnouncements = async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: Superadmin only' });
    }

    const { data, error } = await supabase
      .from('platform_announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Get Platform Announcements Error:', error);
    res.status(500).json({ message: 'Server error fetching platform announcements' });
  }
};

/**
 * @desc    Delete platform announcement (SuperAdmin)
 * @route   DELETE /api/superadmin/announcements/:id
 * @access  Private (Superadmin / Developer)
 */
exports.deletePlatformAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: Superadmin only' });
    }

    const { id } = req.params;

    // Delete linked school notifications
    await supabase.from('school_notifications').delete().eq('platform_announcement_id', id);

    const { error } = await supabase.from('platform_announcements').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Platform announcement deleted successfully' });
  } catch (error) {
    console.error('Delete Platform Announcement Error:', error);
    res.status(500).json({ message: 'Failed to delete platform announcement' });
  }
};
