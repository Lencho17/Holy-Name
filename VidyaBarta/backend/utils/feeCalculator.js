const supabase = require('../config/supabase');

/**
 * Calculates the fee for a student for a specific trimester.
 * @param {string} studentId - The UUID of the student
 * @param {number} trimester - The trimester number (1, 2, or 3)
 * @param {boolean} isNewAdmission - Whether the student is a new admission this year
 */
async function calculateStudentFee(studentId, trimester = 1, isNewAdmission = false) {
  try {
    // 1. Fetch student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      throw new Error('Student not found');
    }

    // Fetch school separately since there may not be an explicit FK constraint
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, platform_fee, transaction_fee')
      .eq('id', student.school_id)
      .single();

    if (schoolError || !school) {
      throw new Error('School not found');
    }

    const schoolId = school.id;
    student.schools = school;
    let classLevel = student.grade; // grade is typically the class level e.g., '11', '9'
    
    if (classLevel && classLevel.includes(' ') && !classLevel.includes('-')) {
      classLevel = classLevel.split(' ')[0];
    }

    if (['11', '12'].includes(classLevel) && student.stream) {
      const streamCapitalized = student.stream.charAt(0).toUpperCase() + student.stream.slice(1).toLowerCase();
      classLevel = `${classLevel} - ${streamCapitalized}`;
    }

    // 2. Fetch fee structure for this class
    const { data: feeStructure, error: feeStructError } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('school_id', schoolId)
      .eq('class_level', classLevel)
      .maybeSingle();

    if (feeStructError || !feeStructure) {
      // Return 0 if no fee structure is defined for this class
      return { total: 0, breakdown: {}, error: 'No fee structure defined for this class' };
    }

    let total = 0;
    const breakdown = {};

    // Base Tuition Fee per trimester
    const tuitionFee = parseFloat(feeStructure.base_tuition_fee || 0);
    if (tuitionFee > 0) {
      breakdown['Tuition Fee (Trimester ' + trimester + ')'] = tuitionFee;
      total += tuitionFee;
    }

    // New Admission Fee (Usually charged only in Trimester 1, and NOT for Class 10+)
    const classNum = parseInt(classLevel.replace(/[^0-9]/g, ''), 10) || 0;
    if (isNewAdmission && trimester === 1 && classNum < 10) {
      const admissionFee = parseFloat(feeStructure.admission_fee || 0);
      if (admissionFee > 0) {
        breakdown['New Admission Fee'] = admissionFee;
        total += admissionFee;
      }
    }

    // Apply Dynamic Subject Fees
    const subjectFees = feeStructure.subject_fees || {};
    const mil = student.mil_subject ? student.mil_subject.toUpperCase() : null;
    const elective = student.elective_subject ? student.elective_subject.toUpperCase() : null;
    const selectedSubjects = Array.isArray(student.selected_subjects) 
      ? student.selected_subjects.map(s => s.toUpperCase()) 
      : [];

    Object.keys(subjectFees).forEach(subjectName => {
      const upperSubject = subjectName.toUpperCase();
      const feeAmount = parseFloat(subjectFees[subjectName]) || 0;

      if (feeAmount > 0) {
        let applyFee = false;

        // Check if it matches MIL or Elective
        if (mil && upperSubject === mil) {
          applyFee = true;
        } else if (elective && upperSubject === elective) {
          applyFee = true;
        } 
        // Check if it matches any Selected Subjects (for Class 11/12)
        else if (selectedSubjects.some(s => upperSubject.includes(s) || s.includes(upperSubject))) {
          applyFee = true;
        }

        if (applyFee) {
          breakdown[`Subject Fee: ${subjectName}`] = feeAmount;
          total += feeAmount;
        }
      }
    });

    return { 
      total, 
      breakdown, 
      platformFeePct: student.schools.platform_fee || 0,
      transactionFeePct: student.schools.transaction_fee || 0
    };

  } catch (error) {
    console.error('Fee Calculation Error:', error);
    throw error;
  }
}

module.exports = { calculateStudentFee };
