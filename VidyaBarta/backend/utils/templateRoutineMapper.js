/**
 * Template Routine Mapper
 * 
 * Maps a class's eligible subjects onto the SuperAdmin default timetable routine
 * using placeholders (Core 1, Core 2, MIL, Elective 1, Grading 1, Minor) or exact names.
 */

const LANGUAGE_NAMES = [
  'ASSAMESE', 'HINDI', 'BENGALI', 'BODO', 'NEPALI', 
  'ALT ENGLISH', 'ALTERNATIVE ENGLISH', 'SANSKRIT', 
  'MANIPURI', 'GARO', 'KHASI', 'MIL'
];

/**
 * Detects placeholder type and optional 1-based index from subject string.
 * @param {string} raw
 * @returns {{ type: 'GRADING'|'CORE'|'MIL'|'ELECTIVE'|'MINOR'|'EXACT', index: number|null, name: string }}
 */
function detectPlaceholderType(raw) {
  if (!raw) return { type: 'CORE', index: null, name: '' };
  const token = String(raw).trim().toUpperCase();

  // Grading
  if (token.includes('GRADING') || token.includes('GRADE')) {
    const numMatch = token.match(/(?:GRADING|GRADE)[\s-_]*(\d+)/i);
    const index = numMatch ? parseInt(numMatch[1], 10) : null;
    return { type: 'GRADING', index, name: token };
  }

  // Core
  if (token.startsWith('CORE') || token.includes(' CORE') || token.includes('CORE SUBJECT')) {
    const numMatch = token.match(/CORE[\s-_]*(?:SUBJECT[\s-_]*)?(\d+)/i);
    const index = numMatch ? parseInt(numMatch[1], 10) : null;
    return { type: 'CORE', index, name: token };
  }

  // MIL
  if (token === 'MIL' || token.startsWith('MIL ') || token.startsWith('MIL-') || token.startsWith('MIL(') || token.includes(' MIL')) {
    const numMatch = token.match(/MIL[\s-_]*(\d+)/i);
    const index = numMatch ? parseInt(numMatch[1], 10) : null;
    return { type: 'MIL', index, name: token };
  }

  // Elective
  if (token.startsWith('ELECTIVE') || token.includes(' ELECTIVE') || token.includes('ELECTIVE SUBJECT')) {
    const numMatch = token.match(/ELECTIVE[\s-_]*(?:SUBJECT[\s-_]*)?(\d+)/i);
    const index = numMatch ? parseInt(numMatch[1], 10) : null;
    return { type: 'ELECTIVE', index, name: token };
  }

  // Minor
  if (token.startsWith('MINOR') || token.includes(' MINOR')) {
    const numMatch = token.match(/MINOR[\s-_]*(\d+)/i);
    const index = numMatch ? parseInt(numMatch[1], 10) : null;
    return { type: 'MINOR', index, name: token };
  }

  // Specific Subject Name (fallback)
  return { type: 'EXACT', index: null, name: token };
}

/**
 * Categorize a class's subjects into typed pools.
 */
function categorizeSubjects(classSubjects) {
  const gradingPool = [];
  const milPool = [];
  const electivePool = [];
  const corePool = [];
  const minorPool = [];
  const otherPool = [];

  classSubjects.forEach(s => {
    const isGrading = s.is_grading || s.marking_system === 'Grade' || (s.group_name || '').toUpperCase() === 'GRADING SETS';
    const isMil = (s.group_name || '').toUpperCase() === 'MIL' || s.name.toUpperCase() === 'MIL' || s.name.toUpperCase().startsWith('MIL ') || s.name.toUpperCase().startsWith('MIL-') || s.name.toUpperCase().startsWith('MIL(');
    const isElective = (s.group_name || '').toUpperCase() === 'ELECTIVE' || (s.group_name || '').toLowerCase().includes('elective');
    const isMinor = (s.group_name || '').toUpperCase() === 'MINOR' || (s.group_name || '').toLowerCase().includes('minor');

    if (isGrading) {
      gradingPool.push(s);
    } else if (isMil) {
      milPool.push(s);
    } else if (isElective && !s.is_core) {
      electivePool.push(s);
    } else if (s.is_core) {
      corePool.push(s);
    } else if (isMinor) {
      minorPool.push(s);
    } else {
      otherPool.push(s);
    }
  });

  return {
    gradingPool,
    milPool,
    electivePool,
    corePool,
    minorPool,
    otherPool
  };
}

/**
 * Maps a class's eligible subjects onto the SuperAdmin default timetable routine
 * using placeholders (Core 1, Core 2, MIL, Elective 1, Grading 1, Minor) or exact names.
 *
 * @param {Object} options
 * @param {string} options.examId - class exam UUID
 * @param {string} options.schoolId - school UUID
 * @param {string} options.classLevel - class level (e.g. 'I', 'IX', 'XI-Science')
 * @param {Array} options.templateRows - default_exam_timetables rows ordered by order_index
 * @param {Array} options.classSubjects - eligible subjects for this class
 * @param {Array} options.workingDates - array of ISO date strings (skipping Sundays)
 * @param {string} options.singleStart - default start time '08:30'
 * @param {string} options.singleEnd - default end time '10:30'
 * @param {string} options.templateCategory - 'periodic_assessment' | 'terminal_examination'
 * @returns {Array} array of timetable items to insert
 */
function mapClassSubjectsToTemplate({
  examId,
  schoolId,
  classLevel,
  templateRows = [],
  classSubjects = [],
  workingDates = [],
  singleStart = '08:30',
  singleEnd = '10:30',
  templateCategory = 'periodic_assessment'
}) {
  const isPeriodic = templateCategory === 'periodic_assessment';
  const categoryDefaultTotal = isPeriodic ? 50 : 100;
  const categoryDefaultPass = isPeriodic ? 20 : 40;

  const {
    gradingPool,
    milPool,
    electivePool,
    corePool,
    minorPool,
    otherPool
  } = categorizeSubjects(classSubjects);

  const assignedKeys = new Set();
  const timetableInserts = [];

  const getSubKey = (sub) => String(sub.subject_id || sub.name).toUpperCase();
  const isAssigned = (sub) => assignedKeys.has(getSubKey(sub));
  const markAssigned = (sub) => assignedKeys.add(getSubKey(sub));

  // Determine grading subject distribution across template grading slots
  const gradingSlots = (templateRows || []).filter(r => {
    const p = detectPlaceholderType(r.subject);
    return p.type === 'GRADING';
  });
  const totalGradingSlots = gradingSlots.length;
  let gradingSlotIndex = 0;

  // Track max day offset used
  let maxDayOffsetUsed = -1;

  // Process template rows in order
  for (const row of (templateRows || [])) {
    const placeholder = detectPlaceholderType(row.subject);
    const dayOffset = row.day_offset ?? row.order_index ?? (maxDayOffsetUsed + 1);
    const examDate = workingDates[dayOffset] || workingDates[workingDates.length - 1];

    const slotStartTime = (row.start_time || singleStart || '08:30').substring(0, 5);
    const slotEndTime = (row.end_time || singleEnd || (isPeriodic ? '10:30' : '11:30')).substring(0, 5);
    const slotTotal = row.total_marks || categoryDefaultTotal;
    const slotPass = row.passing_marks || categoryDefaultPass;
    const slotHasPractical = row.has_practical || false;
    const slotTheory = row.theory_marks || null;
    const slotTheoryPass = row.theory_passing_marks || null;
    const slotPractical = row.practical_marks || null;
    const slotPracticalPass = row.practical_passing_marks || null;

    if (placeholder.type === 'GRADING') {
      // In periodic assessment, grading subjects are excluded
      if (isPeriodic) continue;

      // In terminal examination, distribute grading subjects across grading slots (at most 2 dates)
      const unassignedGrading = gradingPool.filter(s => !isAssigned(s));
      if (unassignedGrading.length === 0) continue;

      let subjectsForThisSlot = [];
      if (placeholder.index === 1 || (totalGradingSlots > 1 && gradingSlotIndex === 0)) {
        const mid = Math.ceil(gradingPool.length / 2);
        subjectsForThisSlot = gradingPool.slice(0, mid).filter(s => !isAssigned(s));
        gradingSlotIndex++;
      } else if (placeholder.index === 2 || (totalGradingSlots > 1 && gradingSlotIndex > 0)) {
        const mid = Math.ceil(gradingPool.length / 2);
        subjectsForThisSlot = gradingPool.slice(mid).filter(s => !isAssigned(s));
        gradingSlotIndex++;
      } else {
        subjectsForThisSlot = unassignedGrading;
        gradingSlotIndex++;
      }

      subjectsForThisSlot.forEach(sub => {
        markAssigned(sub);
        timetableInserts.push({
          exam_id: examId,
          school_id: schoolId,
          class_level: classLevel,
          subject: sub.name,
          sub_subject: null,
          exam_date: examDate,
          start_time: slotStartTime,
          end_time: slotEndTime,
          total_marks: sub.total_marks || slotTotal,
          passing_marks: sub.passing_marks || slotPass,
          has_practical: false,
          theory_marks: null,
          theory_passing_marks: null,
          practical_marks: null,
          practical_passing_marks: null,
          is_finalized: false
        });
      });

      if (subjectsForThisSlot.length > 0 && dayOffset > maxDayOffsetUsed) {
        maxDayOffsetUsed = dayOffset;
      }
      continue;
    }

    // For non-grading slots: exactly 1 subject per slot per class
    let matchedSubject = null;

    if (placeholder.type === 'CORE') {
      // If a specific number was provided (e.g. Core 1 -> index 0)
      if (placeholder.index !== null) {
        const targetIdx = placeholder.index - 1;
        if (corePool[targetIdx] && !isAssigned(corePool[targetIdx])) {
          matchedSubject = corePool[targetIdx];
        }
      }
      // If not found by index, pick next unassigned from corePool
      if (!matchedSubject) {
        matchedSubject = corePool.find(s => !isAssigned(s));
      }
      // If corePool exhausted, check otherPool or minorPool
      if (!matchedSubject) {
        matchedSubject = otherPool.find(s => !isAssigned(s)) || minorPool.find(s => !isAssigned(s));
      }
    } else if (placeholder.type === 'MIL') {
      // Pick next unassigned from milPool
      matchedSubject = milPool.find(s => !isAssigned(s));

      // If milPool empty, check if class has a language subject in corePool or otherPool
      if (!matchedSubject) {
        const langSub = [...corePool, ...otherPool, ...minorPool].find(s => {
          if (isAssigned(s)) return false;
          const up = s.name.toUpperCase();
          return LANGUAGE_NAMES.some(lang => up === lang || up.startsWith(lang + ' ') || up.startsWith(lang + '-'));
        });
        if (langSub) {
          matchedSubject = langSub;
        }
      }
    } else if (placeholder.type === 'ELECTIVE') {
      if (placeholder.index !== null) {
        const targetIdx = placeholder.index - 1;
        if (electivePool[targetIdx] && !isAssigned(electivePool[targetIdx])) {
          matchedSubject = electivePool[targetIdx];
        }
      }
      if (!matchedSubject) {
        matchedSubject = electivePool.find(s => !isAssigned(s));
      }
      if (!matchedSubject) {
        matchedSubject = otherPool.find(s => !isAssigned(s));
      }
    } else if (placeholder.type === 'MINOR') {
      matchedSubject = minorPool.find(s => !isAssigned(s)) || otherPool.find(s => !isAssigned(s));
    } else if (placeholder.type === 'EXACT') {
      // Concrete subject name fallback
      matchedSubject = classSubjects.find(s => !isAssigned(s) && s.name.toUpperCase() === placeholder.name);
    }

    // If a subject was matched for this class slot, schedule it
    if (matchedSubject) {
      markAssigned(matchedSubject);
      timetableInserts.push({
        exam_id: examId,
        school_id: schoolId,
        class_level: classLevel,
        subject: matchedSubject.name,
        sub_subject: null,
        exam_date: examDate,
        start_time: slotStartTime,
        end_time: slotEndTime,
        total_marks: matchedSubject.total_marks || slotTotal,
        passing_marks: matchedSubject.passing_marks || slotPass,
        has_practical: slotHasPractical || matchedSubject.has_practical || false,
        theory_marks: slotTheory,
        theory_passing_marks: slotTheoryPass,
        practical_marks: slotPractical,
        practical_passing_marks: slotPracticalPass,
        is_finalized: false
      });

      if (dayOffset > maxDayOffsetUsed) {
        maxDayOffsetUsed = dayOffset;
      }
    }
  }

  // Remaining unassigned subjects: schedule on following working days
  const remainingSubjects = classSubjects.filter(s => !isAssigned(s));
  if (remainingSubjects.length > 0) {
    let nextOffset = maxDayOffsetUsed + 1;
    for (const remSub of remainingSubjects) {
      const examDate = workingDates[nextOffset] || workingDates[workingDates.length - 1];
      markAssigned(remSub);

      timetableInserts.push({
        exam_id: examId,
        school_id: schoolId,
        class_level: classLevel,
        subject: remSub.name,
        sub_subject: null,
        exam_date: examDate,
        start_time: singleStart || '08:30',
        end_time: singleEnd || (isPeriodic ? '10:30' : '11:30'),
        total_marks: remSub.total_marks || categoryDefaultTotal,
        passing_marks: remSub.passing_marks || categoryDefaultPass,
        has_practical: remSub.has_practical || false,
        theory_marks: null,
        theory_passing_marks: null,
        practical_marks: null,
        practical_passing_marks: null,
        is_finalized: false
      });

      if (nextOffset > maxDayOffsetUsed) {
        maxDayOffsetUsed = nextOffset;
      }
      nextOffset++;
    }
  }

  return timetableInserts;
}

module.exports = {
  detectPlaceholderType,
  categorizeSubjects,
  mapClassSubjectsToTemplate
};
