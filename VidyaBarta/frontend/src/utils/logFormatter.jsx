import React from 'react';

/**
 * Parses raw audit log text (e.g. "POST /api/communication | Payload: {...}")
 * and converts it into a human-readable action title and formatted summary tags.
 */
export function parseLogDetails(logText) {
  if (!logText || typeof logText !== 'string') {
    return { title: 'System Activity', summary: 'No details available', payloadObj: null };
  }

  // If it's just a browser user-agent string (like "Mozilla/5.0..."), return clean device info
  if (logText.includes('Mozilla/') || logText.includes('AppleWebKit/') || logText.includes('Chrome/')) {
    let browser = 'Web Browser';
    if (logText.includes('Chrome')) browser = 'Chrome';
    else if (logText.includes('Safari')) browser = 'Safari';
    else if (logText.includes('Firefox')) browser = 'Firefox';
    else if (logText.includes('Edge')) browser = 'Edge';

    let os = 'Device';
    if (logText.includes('Windows')) os = 'Windows';
    else if (logText.includes('Macintosh') || logText.includes('Mac OS')) os = 'macOS';
    else if (logText.includes('Android')) os = 'Android';
    else if (logText.includes('iPhone') || logText.includes('iPad')) os = 'iOS';
    else if (logText.includes('Linux')) os = 'Linux';

    return {
      title: `${browser} on ${os}`,
      summary: `Logged in via ${browser} (${os})`,
      payloadObj: null
    };
  }

  // Check if formatted like "METHOD /api/endpoint | Payload: {...}"
  const methodMatch = logText.match(/^(POST|GET|PUT|PATCH|DELETE)\s+([^\s|]+)(?:\s*\|\s*Payload:\s*(.*))?$/s);

  if (!methodMatch) {
    // If it has "Payload:", strip any api URL from before it
    if (logText.includes('| Payload:')) {
      const parts = logText.split('| Payload:');
      const routePart = parts[0].trim();
      const payloadPart = parts[1]?.trim() || '';
      return formatEndpointAction(routePart, payloadPart);
    }
    return { title: logText.replace(/\/api\//g, '').replace(/https?:\/\/[^\s]+/g, ''), summary: '', payloadObj: null };
  }

  const method = methodMatch[1];
  const endpoint = methodMatch[2];
  const payloadStr = methodMatch[3]?.trim() || '';

  return formatEndpointAction(`${method} ${endpoint}`, payloadStr);
}

function formatEndpointAction(endpointWithMethod, payloadStr) {
  let payloadObj = null;
  if (payloadStr && payloadStr !== 'Unparseable payload' && payloadStr !== '{}') {
    try {
      payloadObj = JSON.parse(payloadStr);
    } catch (e) {
      // truncated JSON or string
    }
  }

  const cleanEndpoint = endpointWithMethod.toLowerCase();

  // 1. Student Auth & Login
  if (cleanEndpoint.includes('/student-auth/login') || cleanEndpoint.includes('/student/login')) {
    const user = payloadObj?.rollNumber || payloadObj?.email || payloadObj?.identifier || '';
    return {
      title: 'Student Portal Login',
      summary: user ? `Student logged in (${user})` : 'Student logged in successfully',
      payloadObj
    };
  }

  // 2. Auth Logout
  if (cleanEndpoint.includes('/auth/logout')) {
    return {
      title: 'User Logout',
      summary: 'Logged out of the system session',
      payloadObj: null
    };
  }

  // 3. Admin / Staff Login
  if (cleanEndpoint.includes('/auth/login') || cleanEndpoint.includes('/employee-auth/login')) {
    const email = payloadObj?.email || '';
    return {
      title: 'Staff / Admin Login',
      summary: email ? `Logged in as ${email}` : 'Authentication login successful',
      payloadObj
    };
  }

  // 4. Communication & Broadcasts
  if (cleanEndpoint.includes('/communication')) {
    const audience = payloadObj?.audience || 'Recipients';
    const channel = payloadObj?.channel || 'Message';
    const msg = payloadObj?.message ? `"${payloadObj.message.substring(0, 60)}${payloadObj.message.length > 60 ? '...' : ''}"` : '';
    return {
      title: `Broadcast Sent via ${channel}`,
      summary: `To: ${audience} ${msg ? `• Message: ${msg}` : ''}`,
      payloadObj
    };
  }

  // 5. Students Management
  if (cleanEndpoint.includes('/students')) {
    if (cleanEndpoint.includes('post')) {
      const name = payloadObj?.name || payloadObj?.studentName || '';
      const cls = payloadObj?.classLevel || payloadObj?.grade || '';
      const sec = payloadObj?.section || '';
      const phone = payloadObj?.phone || payloadObj?.contact_number || '';
      return {
        title: 'New Student Enrolled',
        summary: `${name ? `Student: ${name}` : 'Student record created'} ${cls ? `(Class ${cls} ${sec})` : ''} ${phone ? `• Phone: ${phone}` : ''}`,
        payloadObj
      };
    }
    if (cleanEndpoint.includes('patch') || cleanEndpoint.includes('put')) {
      return {
        title: 'Updated Student Profile',
        summary: payloadObj?.name ? `Updated details for ${payloadObj.name}` : 'Student profile details updated',
        payloadObj
      };
    }
    if (cleanEndpoint.includes('delete')) {
      return {
        title: 'Student Record Removed',
        summary: 'Deleted student profile from database',
        payloadObj
      };
    }
  }

  // 6. Exams & Marks
  if (cleanEndpoint.includes('/finalize')) {
    return {
      title: 'Exam Results Finalized',
      summary: 'Locked and finalized examination marks permanently',
      payloadObj
    };
  }
  if (cleanEndpoint.includes('/publish')) {
    return {
      title: 'Exam Results Published',
      summary: 'Published exam results for student portal viewing',
      payloadObj
    };
  }
  if (cleanEndpoint.includes('/marks')) {
    const count = Array.isArray(payloadObj?.marks) ? `${payloadObj.marks.length} entries` : '';
    return {
      title: 'Exam Marks Submitted',
      summary: count ? `Saved marks for ${count}` : 'Submitted marks entries',
      payloadObj
    };
  }
  if (cleanEndpoint.includes('/exams') && cleanEndpoint.includes('post')) {
    const name = payloadObj?.name || '';
    const cls = payloadObj?.class_level || '';
    return {
      title: 'Created New Exam',
      summary: `${name || 'Exam created'} ${cls ? `(Class ${cls})` : ''}`,
      payloadObj
    };
  }

  // 7. Timetable
  if (cleanEndpoint.includes('/timetable')) {
    return {
      title: 'Timetable Updated',
      summary: payloadObj?.is_published ? 'Published class timetable' : 'Updated class period schedule',
      payloadObj
    };
  }

  // 8. UDISE Profile
  if (cleanEndpoint.includes('/udise')) {
    return {
      title: 'UDISE Profile Submitted',
      summary: 'Completed mandatory UDISE data verification',
      payloadObj
    };
  }

  // 9. Grievances
  if (cleanEndpoint.includes('/grievance')) {
    const status = payloadObj?.status || 'Resolved';
    return {
      title: `Exam Grievance ${status}`,
      summary: payloadObj?.admin_reply ? `Reply: "${payloadObj.admin_reply}"` : 'Updated student grievance status',
      payloadObj
    };
  }

  // 10. Admission
  if (cleanEndpoint.includes('/admission')) {
    const name = payloadObj?.studentName || payloadObj?.name || '';
    const cls = payloadObj?.classApplyingFor || '';
    return {
      title: 'Admission Application',
      summary: `${name ? `Applicant: ${name}` : 'Application processed'} ${cls ? `for Class ${cls}` : ''}`,
      payloadObj
    };
  }

  // 11. Fees
  if (cleanEndpoint.includes('/fee') || cleanEndpoint.includes('/payment')) {
    const amt = payloadObj?.amount || payloadObj?.feeAmount || '';
    return {
      title: 'Fee Payment Processed',
      summary: amt ? `Amount: ₹${amt}` : 'Fee transaction recorded',
      payloadObj
    };
  }

  // Generic fallback: clean up URL path into human readable Title
  const path = cleanEndpoint
    .replace(/^(post|get|put|patch|delete)\s+/, '')
    .replace(/^\/api\//, '')
    .replace(/^[a-f0-9-]{16,}\//, '')
    .split('?')[0];

  const words = path
    .split(/[\/\-_]/)
    .filter(w => !w.match(/^[a-f0-9]{8,}$/)) // filter uuid chunks
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  let summaryText = '';
  if (payloadObj && typeof payloadObj === 'object') {
    const keys = Object.keys(payloadObj).filter(k => !k.toLowerCase().includes('token') && !k.toLowerCase().includes('id'));
    if (keys.length > 0) {
      summaryText = keys.slice(0, 3).map(k => `${k}: ${payloadObj[k]}`).join(' • ');
    }
  }

  return {
    title: words || 'System Update',
    summary: summaryText || 'System operation executed successfully',
    payloadObj
  };
}

/**
 * Component to render a clean, human-readable log item
 */
export const HumanReadableLog = ({ logText, className = '' }) => {
  const { title, summary, payloadObj } = parseLogDetails(logText);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
        <span>{title}</span>
      </div>
      {summary && (
        <div className="text-[11px] text-gray-600 font-medium break-words leading-relaxed">
          {summary}
        </div>
      )}
    </div>
  );
};
