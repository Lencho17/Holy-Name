const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protectAnyStaff, protectStudent } = require('../middleware/auth');
const {
  getVerificationUrl,
  generateSecureQRToken,
  determineStudentFeeEligibility,
  validateExamRoutine,
  assembleAdmitCardPayload
} = require('../services/admitCardService');

/**
 * Log administrative activity to admin_activity table
 */
const logActivity = async (req, action, details = {}) => {
  try {
    const adminId = req.user?.id;
    // admin_activity table expects valid UUID for admin_id or null
    const isValidUUID = typeof adminId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminId);
    
    await supabase.from('admin_activity').insert({
      admin_id: isValidUUID ? adminId : null,
      email: req.user?.email || 'admin@school.com',
      action: `[ADMIT_CARD] ${action}: ${JSON.stringify(details)}`,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'VidyaBarta-Server'
    });
  } catch (err) {
    console.error('[ACTIVITY_LOG_ERROR]', err.message);
  }
};

/**
 * GET /api/admit-cards/exams
 * Fetch all exams for the school, annotated with routine item counts and finalized status
 */
router.get('/exams', protectAnyStaff, async (req, res) => {
  try {
    const { school_id } = req.user;
    let query = supabase
      .from('exams')
      .select('id, name, class_level, type, start_date, end_date, status, workflow_status, school_id')
      .order('start_date', { ascending: false });

    if (school_id) {
      query = query.eq('school_id', school_id);
    }

    const { data: exams, error } = await query;
    if (error) throw error;

    // Annotate with routine counts and finalized status
    const annotatedExams = await Promise.all(
      (exams || []).map(async (exam) => {
        let timetableQuery = supabase
          .from('exam_timetable')
          .select('id, is_finalized, class_level')
          .eq('exam_id', exam.id);

        if (school_id) {
          timetableQuery = timetableQuery.eq('school_id', school_id);
        }

        const { data: timetables } = await timetableQuery;
        const routineCount = (timetables || []).length;
        const routineFinalized = routineCount > 0 && timetables.every((t) => t.is_finalized === true);

        return {
          ...exam,
          routineCount,
          routineFinalized
        };
      })
    );

    return res.json({
      success: true,
      data: annotatedExams,
      message: 'Exams fetched successfully'
    });
  } catch (err) {
    console.error('[GET_EXAMS_ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to fetch examinations'
    });
  }
});

/**
 * GET /api/admit-cards/exams/:examId/classes
 * Fetch available classes and sections for an exam
 */
router.get('/exams/:examId/classes', protectAnyStaff, async (req, res) => {
  try {
    const { examId } = req.params;
    const { school_id } = req.user;

    // Verify exam belongs to school
    let examQuery = supabase.from('exams').select('id, class_level, school_id').eq('id', examId);
    if (school_id) examQuery = examQuery.eq('school_id', school_id);
    const { data: exam, error: examErr } = await examQuery.single();

    if (examErr || !exam) {
      return res.status(404).json({
        success: false,
        error: 'EXAM_NOT_FOUND',
        message: 'Exam not found or access denied'
      });
    }

    // Get distinct class levels and sections from students table
    let studentsQuery = supabase
      .from('students')
      .select('grade, section')
      .order('grade', { ascending: true });

    if (school_id) studentsQuery = studentsQuery.eq('school_id', school_id);
    if (exam.class_level) {
      studentsQuery = studentsQuery.eq('grade', exam.class_level);
    }

    const { data: studentsList, error: stErr } = await studentsQuery;
    if (stErr) throw stErr;

    const classSectionMap = {};
    (studentsList || []).forEach((st) => {
      const cls = st.grade || 'General';
      const sec = st.section || 'A';
      if (!classSectionMap[cls]) {
        classSectionMap[cls] = new Set();
      }
      classSectionMap[cls].add(sec);
    });

    const result = Object.keys(classSectionMap).map((cls) => ({
      classLevel: cls,
      sections: Array.from(classSectionMap[cls]).sort()
    }));

    return res.json({
      success: true,
      data: result,
      message: 'Classes fetched successfully'
    });
  } catch (err) {
    console.error('[GET_EXAM_CLASSES_ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to fetch exam classes'
    });
  }
});

/**
 * GET /api/admit-cards/exams/:examId/students
 * Fetch students for exam, class, and section with routine validation and live fee eligibility
 */
router.get('/exams/:examId/students', protectAnyStaff, async (req, res) => {
  try {
    const { examId } = req.params;
    const { class_level, section } = req.query;
    const { school_id } = req.user;

    if (!class_level) {
      return res.status(400).json({
        success: false,
        error: 'CLASS_REQUIRED',
        message: 'class_level query parameter is required'
      });
    }

    // 1. Verify exam belongs to school
    let examQuery = supabase.from('exams').select('*').eq('id', examId);
    if (school_id) examQuery = examQuery.eq('school_id', school_id);
    const { data: exam, error: examErr } = await examQuery.single();

    if (examErr || !exam) {
      return res.status(404).json({
        success: false,
        error: 'EXAM_NOT_FOUND',
        message: 'Exam not found or access denied'
      });
    }

    // 2. Validate Routine status on the backend
    const routineValidation = await validateExamRoutine(examId, school_id || exam.school_id, class_level);

    // 3. Fetch enrolled students with tenant isolation
    let studentsQuery = supabase
      .from('students')
      .select('id, student_name, admission_id, roll_number, grade, section, guardian_name, contact_number, photo_url, school_id')
      .eq('grade', class_level)
      .order('roll_number', { ascending: true })
      .order('student_name', { ascending: true });

    if (school_id) studentsQuery = studentsQuery.eq('school_id', school_id);
    if (section) studentsQuery = studentsQuery.eq('section', section);

    const { data: students, error: stErr } = await studentsQuery;
    if (stErr) throw stErr;

    // 4. Fetch existing admit card records for this exam
    let cardsQuery = supabase
      .from('admit_cards')
      .select('*')
      .eq('exam_id', examId);

    if (school_id) cardsQuery = cardsQuery.eq('school_id', school_id);
    const { data: existingCards, error: cardErr } = await cardsQuery;
    if (cardErr) throw cardErr;

    const cardsByStudentId = new Map();
    (existingCards || []).forEach((c) => {
      cardsByStudentId.set(c.student_id, c);
    });

    // 5. Evaluate live fee eligibility & compile student roster
    let totalStudents = (students || []).length;
    let eligibleCount = 0;
    let concessionCount = 0;
    let extensionCount = 0;
    let duesPendingCount = 0;
    let releasedCount = 0;
    let withheldCount = 0;

    const studentRoster = await Promise.all(
      (students || []).map(async (st) => {
        const feeInfo = await determineStudentFeeEligibility(st, school_id || st.school_id);
        const card = cardsByStudentId.get(st.id);

        const cardStatus = card?.status || 'pending';
        const isReleased = cardStatus === 'released';
        const isWithheld = cardStatus === 'withheld';

        // Count metrics
        if (cardStatus === 'released') releasedCount++;
        else if (cardStatus === 'withheld') withheldCount++;

        if (feeInfo.feeEligibility === 'eligible') {
          eligibleCount++;
        } else if (feeInfo.feeEligibility === 'extension_approved') {
          extensionCount++;
        } else {
          duesPendingCount++;
        }

        if (feeInfo.approvedDiscount > 0) {
          concessionCount++;
        }

        return {
          studentId: st.id,
          name: st.student_name,
          admissionId: st.admission_id,
          rollNumber: st.roll_number,
          classLevel: st.grade,
          section: st.section,
          guardianName: st.guardian_name,
          contactNumber: st.contact_number,
          photoUrl: st.photo_url || null,
          feeStatus: feeInfo.feeEligibility,
          outstandingFee: feeInfo.netOutstanding,
          grossOutstanding: feeInfo.grossOutstanding,
          approvedDiscount: feeInfo.approvedDiscount,
          hasValidExtension: feeInfo.hasValidExtension,
          validExtensionDate: feeInfo.validExtensionDate,
          admitCardId: card?.id || null,
          admitCardStatus: cardStatus,
          manualOverride: card?.manual_override || false,
          overrideType: card?.override_type || 'none',
          releaseReason: card?.release_reason || null,
          releasedAt: card?.released_at || null,
          withheldAt: card?.withheld_at || null,
          qrToken: isReleased ? card?.qr_token : null,
          verificationUrl: isReleased && card?.qr_token ? getVerificationUrl(card.qr_token) : null
        };
      })
    );

    return res.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          name: exam.name,
          classLevel: exam.class_level,
          startDate: exam.start_date,
          endDate: exam.end_date,
          academicYear: exam.academic_year || new Date().getFullYear().toString()
        },
        routineStatus: routineValidation,
        metrics: {
          totalStudents,
          eligible: eligibleCount,
          concessionApproved: concessionCount,
          extensionApproved: extensionCount,
          duesPending: duesPendingCount,
          released: releasedCount,
          withheld: withheldCount
        },
        students: studentRoster
      },
      message: 'Student admit card roster evaluated successfully'
    });
  } catch (err) {
    console.error('[GET_EXAM_STUDENTS_ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to fetch student admit cards'
    });
  }
});

/**
 * POST /api/admit-cards/bulk-release
 * Idempotently release admit cards for students.
 * Enforces Zero Frontend Trust: Re-validates routine finalization and fee eligibility directly from DB.
 */
router.post('/bulk-release', protectAnyStaff, async (req, res) => {
  try {
    const { examId, class_level, section, mode = 'cleared_students', studentIds = [] } = req.body;
    const { school_id } = req.user;

    if (!examId || !class_level) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'examId and class_level are required'
      });
    }

    // 1. Zero Frontend Trust: Revalidate routine finalization from DB
    const routineValidation = await validateExamRoutine(examId, school_id, class_level);
    if (!routineValidation.canRelease) {
      return res.status(400).json({
        success: false,
        error: 'ROUTINE_NOT_FINALIZED',
        message: routineValidation.reason || 'Exam routine must be finalized before releasing admit cards.'
      });
    }

    // 2. Fetch candidate students directly from DB
    let studentsQuery = supabase
      .from('students')
      .select('id, student_name, grade, section, school_id')
      .eq('grade', class_level);

    if (school_id) studentsQuery = studentsQuery.eq('school_id', school_id);
    if (section) studentsQuery = studentsQuery.eq('section', section);

    if (mode === 'selected_students' && Array.isArray(studentIds) && studentIds.length > 0) {
      studentsQuery = studentsQuery.in('id', studentIds);
    }

    const { data: students, error: stErr } = await studentsQuery;
    if (stErr) throw stErr;

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NO_STUDENTS_FOUND',
        message: 'No matching students found for the specified criteria'
      });
    }

    // 3. Fetch existing cards to maintain idempotency
    const { data: existingCards } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('exam_id', examId)
      .in('student_id', students.map((s) => s.id));

    const existingCardMap = new Map();
    (existingCards || []).forEach((c) => existingCardMap.set(c.student_id, c));

    let releasedCount = 0;
    let skippedCount = 0;

    for (const student of students) {
      const existingCard = existingCardMap.get(student.id);

      // Idempotency: If already released, skip to preserve token and timestamps
      if (existingCard && existingCard.status === 'released') {
        skippedCount++;
        continue;
      }

      // Re-evaluate fee eligibility in real-time from DB
      const feeInfo = await determineStudentFeeEligibility(student, school_id || student.school_id);

      // If mode is cleared_students, student must be eligible or extension_approved
      if (mode === 'cleared_students') {
        if (feeInfo.feeEligibility !== 'eligible' && feeInfo.feeEligibility !== 'extension_approved') {
          // If manual override is active, permit release
          if (!existingCard || !existingCard.manual_override || existingCard.override_type !== 'force_release') {
            skippedCount++;
            continue;
          }
        }
      }

      const newToken = generateSecureQRToken();
      const now = new Date().toISOString();

      if (existingCard) {
        // Atomic update from pending or withheld -> released
        const { error: updateErr } = await supabase
          .from('admit_cards')
          .update({
            status: 'released',
            fee_eligibility: feeInfo.feeEligibility,
            outstanding_fee: feeInfo.netOutstanding,
            qr_token: newToken,
            qr_token_created_at: now,
            qr_token_revoked_at: null,
            released_by: req.user?.id || 'admin',
            released_at: now,
            updated_at: now
          })
          .eq('id', existingCard.id)
          .eq('school_id', school_id || student.school_id);

        if (!updateErr) releasedCount++;
      } else {
        // Insert new released admit card
        const { error: insertErr } = await supabase
          .from('admit_cards')
          .insert({
            exam_id: examId,
            student_id: student.id,
            school_id: school_id || student.school_id,
            status: 'released',
            fee_eligibility: feeInfo.feeEligibility,
            outstanding_fee: feeInfo.netOutstanding,
            qr_token: newToken,
            qr_token_created_at: now,
            qr_token_revoked_at: null,
            released_by: req.user?.id || 'admin',
            released_at: now,
            updated_at: now
          });

        if (!insertErr) releasedCount++;
      }
    }

    // Log admin audit
    await logActivity(req, 'BULK_RELEASE', {
      examId,
      classLevel: class_level,
      section,
      mode,
      releasedCount,
      skippedCount
    });

    return res.json({
      success: true,
      data: {
        releasedCount,
        skippedCount,
        totalEvaluated: students.length
      },
      message: `Admit cards processed: ${releasedCount} released, ${skippedCount} skipped/already released.`
    });
  } catch (err) {
    console.error('[BULK_RELEASE_ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to execute bulk release'
    });
  }
});

/**
 * POST /api/admit-cards/bulk-withhold
 * Withhold admit cards for selected students (or students with dues)
 */
router.post('/bulk-withhold', protectAnyStaff, async (req, res) => {
  try {
    const { examId, studentIds = [], reason } = req.body;
    const { school_id } = req.user;

    if (!examId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'examId and a non-empty studentIds array are required'
      });
    }

    const now = new Date().toISOString();
    let withheldCount = 0;

    for (const studentId of studentIds) {
      const { data: existingCard } = await supabase
        .from('admit_cards')
        .select('id, status')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (existingCard) {
        // Transition to withheld and revoke QR token
        const { error: updateErr } = await supabase
          .from('admit_cards')
          .update({
            status: 'withheld',
            qr_token_revoked_at: now,
            withheld_by: req.user?.id || 'admin',
            withheld_at: now,
            release_reason: reason || 'Withheld by administrative order',
            updated_at: now
          })
          .eq('id', existingCard.id);

        if (!updateErr) withheldCount++;
      } else {
        // Create as withheld
        const { error: insertErr } = await supabase
          .from('admit_cards')
          .insert({
            exam_id: examId,
            student_id: studentId,
            school_id: school_id,
            status: 'withheld',
            qr_token_revoked_at: now,
            withheld_by: req.user?.id || 'admin',
            withheld_at: now,
            release_reason: reason || 'Withheld by administrative order',
            updated_at: now
          });

        if (!insertErr) withheldCount++;
      }
    }

    await logActivity(req, 'BULK_WITHHOLD', {
      examId,
      withheldCount,
      reason: reason || 'Fee dues / Administrative hold'
    });

    return res.json({
      success: true,
      data: { withheldCount },
      message: `${withheldCount} admit card(s) withheld successfully`
    });
  } catch (err) {
    console.error('[BULK_WITHHOLD_ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to withhold admit cards'
    });
  }
});

/**
 * PATCH /api/admit-cards/:id/override
 * Manual Administrative Override (Force Release or Force Withhold)
 * Strictly requires a non-empty reason and logs to audit trail
 */
router.patch('/:id/override', protectAnyStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const { school_id } = req.user;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'REASON_REQUIRED',
        message: 'A detailed reason is mandatory for manual overrides'
      });
    }

    if (action !== 'force_release' && action !== 'force_withhold') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ACTION',
        message: 'Action must be either "force_release" or "force_withhold"'
      });
    }

    // Verify card exists and belongs to school
    let cardQuery = supabase.from('admit_cards').select('*').eq('id', id);
    if (school_id) cardQuery = cardQuery.eq('school_id', school_id);
    const { data: card, error: cardErr } = await cardQuery.single();

    if (cardErr || !card) {
      return res.status(404).json({
        success: false,
        error: 'CARD_NOT_FOUND',
        message: 'Admit card not found or access denied'
      });
    }

    const now = new Date().toISOString();
    let updatePayload = {
      manual_override: true,
      override_type: action,
      release_reason: reason.trim(),
      updated_at: now
    };

    if (action === 'force_release') {
      // Re-validate routine finalization
      const routineCheck = await validateExamRoutine(card.exam_id, school_id || card.school_id);
      if (!routineCheck.canRelease) {
        return res.status(400).json({
          success: false,
          error: 'ROUTINE_NOT_FINALIZED',
          message: 'Cannot release admit card: Exam timetable routine is not finalized.'
        });
      }

      const newToken = generateSecureQRToken();
      updatePayload = {
        ...updatePayload,
        status: 'released',
        qr_token: newToken,
        qr_token_created_at: now,
        qr_token_revoked_at: null,
        released_by: req.user?.id || 'admin',
        released_at: now
      };
    } else {
      // force_withhold
      updatePayload = {
        ...updatePayload,
        status: 'withheld',
        qr_token_revoked_at: now,
        withheld_by: req.user?.id || 'admin',
        withheld_at: now
      };
    }

    const { data: updatedCard, error: updateErr } = await supabase
      .from('admit_cards')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log audit trail
    await logActivity(req, 'MANUAL_OVERRIDE', {
      admitCardId: id,
      action,
      reason: reason.trim(),
      previousStatus: card.status,
      newStatus: updatedCard.status
    });

    return res.json({
      success: true,
      data: updatedCard,
      message: `Admit card manual override (${action}) applied successfully`
    });
  } catch (err) {
    console.error('[OVERRIDE_ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to apply manual override'
    });
  }
});

/**
 * GET /api/admit-cards/:id/card-data
 * Complete assembled payload for viewing/printing a single admit card
 */
router.get('/:id/card-data', protectAnyStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id } = req.user;

    const payload = await assembleAdmitCardPayload(id, school_id);

    return res.json({
      success: true,
      data: payload,
      message: 'Card payload assembled successfully'
    });
  } catch (err) {
    console.error('[GET_CARD_DATA_ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to assemble admit card data'
    });
  }
});

/**
 * GET /api/admit-cards/verify/:token
 * Public QR Code Verification Endpoint
 * Validates whether token exists, card is released, and token is not revoked.
 * Exposes strictly minimal non-sensitive data.
 */
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'TOKEN_REQUIRED',
        message: 'Verification token is required'
      });
    }

    const { data: card, error: cardErr } = await supabase
      .from('admit_cards')
      .select('id, exam_id, student_id, school_id, status, qr_token, qr_token_revoked_at, released_at')
      .eq('qr_token', token.trim())
      .maybeSingle();

    if (cardErr || !card) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'INVALID_TOKEN',
        message: 'No admit card found for this verification token.'
      });
    }

    if (card.status !== 'released' || card.qr_token_revoked_at) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'CARD_REVOKED_OR_WITHHELD',
        message: 'This admit card has been withheld or revoked by school administration.'
      });
    }

    // Fetch minimal public verification details
    const { data: student } = await supabase
      .from('students')
      .select('student_name, roll_number, grade, section')
      .eq('id', card.student_id)
      .single();

    const { data: exam } = await supabase
      .from('exams')
      .select('name, academic_year')
      .eq('id', card.exam_id)
      .single();

    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', card.school_id)
      .single();

    return res.json({
      success: true,
      valid: true,
      data: {
        studentName: student?.student_name || 'N/A',
        rollNumber: student?.roll_number || 'N/A',
        className: student?.grade || 'N/A',
        section: student?.section || 'N/A',
        examName: exam?.name || 'School Examination',
        schoolName: school?.name || 'VidyaBarta Partner School',
        releasedAt: card.released_at
      },
      message: 'Admit card is authentic, valid, and released.'
    });
  } catch (err) {
    console.error('[VERIFY_TOKEN_ERROR]', err);
    return res.status(500).json({
      success: false,
      valid: false,
      error: 'SERVER_ERROR',
      message: 'Failed to verify admit card token'
    });
  }
});

/**
 * GET /api/admit-cards/student/my-cards
 * Multi-Exam Student Portal Endpoint
 * Strictly isolates student to their own school and student ID.
 * Returns array of cards; unreleased cards never expose QR token or verification URL.
 */
router.get('/student/my-cards', protectStudent, async (req, res) => {
  try {
    const student = req.student;

    // Fetch all exams for the student's school
    const { data: exams, error: exErr } = await supabase
      .from('exams')
      .select('id, name, class_level, start_date, end_date, academic_year, status')
      .eq('school_id', student.school_id)
      .order('start_date', { ascending: false });

    if (exErr) throw exErr;

    // Fetch admit cards for this student
    const { data: cards, error: cErr } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('student_id', student.id)
      .eq('school_id', student.school_id);

    if (cErr) throw cErr;

    const cardsByExamId = new Map();
    (cards || []).forEach((c) => cardsByExamId.set(c.exam_id, c));

    // Evaluate live fee status
    const feeInfo = await determineStudentFeeEligibility(student, student.school_id);

    const result = await Promise.all(
      (exams || []).map(async (exam) => {
        const card = cardsByExamId.get(exam.id);
        const cardStatus = card?.status || 'pending';
        const isReleased = cardStatus === 'released';

        let printablePayload = null;
        if (isReleased && card?.id) {
          try {
            printablePayload = await assembleAdmitCardPayload(card.id, student.school_id);
          } catch (payloadErr) {
            console.error('[STUDENT_PAYLOAD_ERR]', payloadErr.message);
          }
        }

        return {
          examId: exam.id,
          examName: exam.name,
          academicYear: exam.academic_year || new Date().getFullYear().toString(),
          startDate: exam.start_date,
          endDate: exam.end_date,
          status: cardStatus,
          feeStatus: feeInfo.feeEligibility,
          outstandingFee: feeInfo.netOutstanding,
          releasedAt: isReleased ? card?.released_at : null,
          // Strict student data safeguard: Zero QR tokens or verification URLs for withheld or pending
          verificationUrl: isReleased && card?.qr_token ? getVerificationUrl(card.qr_token) : null,
          cardData: printablePayload
        };
      })
    );

    return res.json({
      success: true,
      data: result,
      message: 'Student admit cards retrieved successfully'
    });
  } catch (err) {
    console.error('[STUDENT_MY_CARDS_ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to fetch student admit cards'
    });
  }
});

module.exports = router;
