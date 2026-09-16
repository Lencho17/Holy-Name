const crypto = require('crypto');
const supabase = require('../config/supabase');

/**
 * Centralized Admit Card Domain Service
 * Enforces Zero Frontend Trust, strict multi-tenant isolation,
 * precise net outstanding fee calculations, routine validation,
 * token lifecycle management, and admit card payload assembly.
 */

/**
 * Get centralized public verification URL for a given QR token
 */
const getVerificationUrl = (qrToken) => {
  if (!qrToken) return null;
  const baseUrl = process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl.replace(/\/$/, '')}/verify/admit-card/${qrToken}`;
};

/**
 * Generate cryptographically random 24-byte hex token
 */
const generateSecureQRToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

/**
 * Evaluate Student Fee Eligibility with strict tenant isolation and precise concession math
 *
 * Calculations:
 * grossOutstanding = SUM(amount_due - amount_paid)
 * approvedDiscount = SUM(approved concession discounts)
 * netOutstanding = MAX(grossOutstanding - approvedDiscount, 0)
 *
 * Classification:
 * netOutstanding <= 0 -> 'eligible'
 * netOutstanding > 0 + valid extension (extension_date >= today) -> 'extension_approved'
 * netOutstanding > 0 + approved concession (balance > 0) -> 'dues_pending'
 * netOutstanding > 0 + no concession/extension -> 'dues_pending'
 */
const determineStudentFeeEligibility = async (student, schoolId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch approved fee concessions & extensions with tenant check on students
    const { data: concessions, error: concErr } = await supabase
      .from('fee_concessions')
      .select('id, student_id, type, discount_amount, extension_date, status')
      .eq('student_id', student.id)
      .eq('status', 'approved');

    if (concErr) throw concErr;

    let approvedDiscount = 0;
    let hasValidExtension = false;
    let validExtensionDate = null;

    if (concessions && concessions.length > 0) {
      concessions.forEach((c) => {
        if (c.type === 'concession') {
          approvedDiscount += Number(c.discount_amount || 0);
        } else if (c.type === 'extension' && c.extension_date) {
          const extDate = new Date(c.extension_date);
          if (extDate >= today) {
            hasValidExtension = true;
            validExtensionDate = c.extension_date;
          }
        }
      });
    }

    // 2. Query fee_records for student (tenant isolated through student.school_id = schoolId)
    const { data: feeRecords, error: feeErr } = await supabase
      .from('fee_records')
      .select('id, amount_due, amount_paid, status')
      .eq('student_id', student.id);

    if (feeErr) throw feeErr;

    let grossOutstanding = 0;
    let hasRecords = feeRecords && feeRecords.length > 0;

    if (hasRecords) {
      grossOutstanding = feeRecords.reduce((sum, r) => {
        const due = Number(r.amount_due || 0);
        const paid = Number(r.amount_paid || 0);
        return sum + Math.max(0, due - paid);
      }, 0);
    } else {
      // 3. Fallback: If no fee_records exist, check fee_structures for the student's grade
      const { data: feeStructure } = await supabase
        .from('fee_structures')
        .select('base_tuition_fee, admission_fee')
        .eq('school_id', schoolId)
        .eq('class_level', student.grade)
        .maybeSingle();

      const baseTuition = Number(feeStructure?.base_tuition_fee || 0);

      if (baseTuition > 0) {
        // Check if student has successful payment in transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('id, amount, status')
          .eq('school_id', schoolId)
          .eq('student_id', student.id)
          .eq('status', 'Success');

        const totalPaid = (transactions || []).reduce((s, t) => s + Number(t.amount || 0), 0);
        if (totalPaid < baseTuition) {
          grossOutstanding = baseTuition - totalPaid;
        }
      }
    }

    const netOutstanding = Math.max(0, grossOutstanding - approvedDiscount);

    let feeEligibility = 'eligible';
    if (netOutstanding <= 0) {
      feeEligibility = 'eligible';
    } else if (hasValidExtension) {
      feeEligibility = 'extension_approved';
    } else {
      feeEligibility = 'dues_pending';
    }

    return {
      feeEligibility,
      grossOutstanding,
      approvedDiscount,
      netOutstanding,
      hasValidExtension,
      validExtensionDate
    };
  } catch (err) {
    console.error(`[FEE_ELIGIBILITY_ERROR] Student: ${student.id}`, err);
    return {
      feeEligibility: 'dues_pending',
      grossOutstanding: 0,
      approvedDiscount: 0,
      netOutstanding: 0,
      hasValidExtension: false,
      validExtensionDate: null
    };
  }
};

/**
 * Validate Exam Timetable Routine
 * Release requires routine rows exist and every row has is_finalized === true
 */
const validateExamRoutine = async (examId, schoolId, classLevel = null) => {
  try {
    let query = supabase
      .from('exam_timetable')
      .select('id, exam_id, class_level, subject, sub_subject, exam_date, start_time, end_time, room_number, total_marks, passing_marks, is_finalized')
      .eq('exam_id', examId)
      .eq('school_id', schoolId);

    if (classLevel) {
      query = query.eq('class_level', classLevel);
    }

    const { data: routineRows, error } = await query;
    if (error) throw error;

    if (!routineRows || routineRows.length === 0) {
      return {
        canRelease: false,
        isFinalized: false,
        reason: 'No timetable routine entries found for this examination and class.',
        routineCount: 0,
        routine: []
      };
    }

    const unfinalizedRows = routineRows.filter((r) => !r.is_finalized);
    if (unfinalizedRows.length > 0) {
      return {
        canRelease: false,
        isFinalized: false,
        reason: `Exam routine has ${unfinalizedRows.length} unfinalized subject(s). Routine must be marked Finalized in Exam Management.`,
        routineCount: routineRows.length,
        routine: routineRows
      };
    }

    return {
      canRelease: true,
      isFinalized: true,
      reason: 'Exam routine is finalized and ready for admit card release.',
      routineCount: routineRows.length,
      routine: routineRows
    };
  } catch (err) {
    console.error(`[ROUTINE_VALIDATION_ERROR] Exam: ${examId}`, err);
    return {
      canRelease: false,
      isFinalized: false,
      reason: 'Failed to validate examination routine.',
      routineCount: 0,
      routine: []
    };
  }
};

/**
 * Assemble Complete Admit Card Payload
 * Includes school branding, student profile, exam metadata, finalized schedule, QR code token & verification URL
 */
const assembleAdmitCardPayload = async (admitCardId, schoolId) => {
  try {
    // 1. Fetch admit card
    const { data: card, error: cardErr } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('id', admitCardId)
      .eq('school_id', schoolId)
      .single();

    if (cardErr || !card) {
      throw new Error('Admit card not found or access denied');
    }

    // 2. Fetch student
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('*')
      .eq('id', card.student_id)
      .eq('school_id', schoolId)
      .single();

    if (studentErr || !student) {
      throw new Error('Student record not found for admit card');
    }

    // 3. Fetch exam
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('*')
      .eq('id', card.exam_id)
      .eq('school_id', schoolId)
      .single();

    if (examErr || !exam) {
      throw new Error('Exam not found for admit card');
    }

    // 4. Fetch finalized timetable
    const { data: timetable } = await supabase
      .from('exam_timetable')
      .select('*')
      .eq('exam_id', card.exam_id)
      .eq('class_level', student.grade)
      .eq('school_id', schoolId)
      .order('exam_date', { ascending: true })
      .order('start_time', { ascending: true });

    // 5. Fetch school branding from site_settings or schools
    const { data: settings } = await supabase
      .from('site_settings')
      .select('school_name, logo, punch_line, office_address, affiliation')
      .eq('school_id', schoolId)
      .maybeSingle();

    const { data: school } = await supabase
      .from('schools')
      .select('name, logo_url, tagline, address, phone, email')
      .eq('id', schoolId)
      .maybeSingle();

    const branding = {
      schoolName: settings?.school_name || school?.name || 'VidyaBarta Academy',
      logoUrl: settings?.logo || school?.logo_url || null,
      punchLine: settings?.punch_line || school?.tagline || 'Excellence in Education',
      address: settings?.office_address || school?.address || '',
      affiliation: settings?.affiliation || 'Affiliated to State Education Board',
      contactPhone: school?.phone || '',
      contactEmail: school?.email || ''
    };

    const verificationUrl = card.qr_token ? getVerificationUrl(card.qr_token) : null;

    return {
      id: card.id,
      status: card.status,
      feeEligibility: card.fee_eligibility,
      outstandingFee: Number(card.outstanding_fee || 0),
      manualOverride: card.manual_override,
      overrideType: card.override_type,
      releaseReason: card.release_reason,
      releasedAt: card.released_at,
      withheldAt: card.withheld_at,
      qrToken: card.qr_token,
      verificationUrl,
      student: {
        id: student.id,
        name: student.student_name,
        admissionId: student.admission_id,
        rollNumber: student.roll_number,
        classLevel: student.grade,
        section: student.section,
        guardianName: student.guardian_name,
        contactNumber: student.contact_number,
        photoUrl: student.photo_url || null,
        gender: student.gender,
        dob: student.date_of_birth
      },
      exam: {
        id: exam.id,
        name: exam.name,
        academicYear: exam.academic_year || new Date().getFullYear().toString(),
        type: exam.type,
        startDate: exam.start_date,
        endDate: exam.end_date
      },
      schedule: timetable || [],
      branding,
      instructions: [
        'Candidates must carry this admit card and school ID to the examination hall for every paper.',
        'Entry to the examination hall is permitted up to 15 minutes before the exam start time.',
        'Electronic gadgets, smart watches, and unauthorized paper sheets are strictly prohibited.',
        'Candidates must verify their question paper subject and check total pages upon receipt.',
        'Admit card is valid only if signed by the Class Teacher and Principal.'
      ]
    };
  } catch (err) {
    console.error(`[ASSEMBLE_ADMIT_CARD_ERROR] AdmitCard: ${admitCardId}`, err);
    throw err;
  }
};

module.exports = {
  getVerificationUrl,
  generateSecureQRToken,
  determineStudentFeeEligibility,
  validateExamRoutine,
  assembleAdmitCardPayload
};
