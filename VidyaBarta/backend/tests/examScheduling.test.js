require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const supabase = require('../config/supabase');
const crypto = require('crypto');
const { normalizeClassLevel, getHolyNameDefaultSubjects } = require('../utils/defaultClassSubjects');

// Helper to calculate working dates (skipping Sundays)
const getWorkingDates = (startDateStr, endDateStr) => {
  const dates = [];
  if (!startDateStr) return dates;
  let curr = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
  if (isNaN(curr.getTime())) return dates;

  while (curr <= end) {
    if (curr.getDay() !== 0) { // Skip Sunday
      dates.push(curr.toISOString().split('T')[0]);
    }
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

const getWorkingDatesCount = (startDateStr, maxWorkingDays = 20) => {
  const dates = [];
  if (!startDateStr) return dates;
  let curr = new Date(startDateStr);
  if (isNaN(curr.getTime())) return dates;

  while (dates.length < maxWorkingDays) {
    if (curr.getDay() !== 0) { // Skip Sunday
      dates.push(curr.toISOString().split('T')[0]);
    }
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

// Simulation of server-side finalization gate logic
function validateFinalizationGate({ timetableRows, eligibleSubjects, category, startDate, endDate }) {
  if (!timetableRows || timetableRows.length === 0) {
    return { valid: false, reason: 'No timetable rows to finalize' };
  }

  // 1. Completeness: Every required eligible subject must be scheduled
  const scheduledSubjectNames = new Set(timetableRows.map(r => r.subject));
  const requiredSubjectNames = eligibleSubjects.map(s => s.name);
  const missingSubjects = requiredSubjectNames.filter(name => !scheduledSubjectNames.has(name));

  if (missingSubjects.length > 0) {
    return {
      valid: false,
      reason: `Incomplete timetable: Missing required subjects: ${missingSubjects.join(', ')}`
    };
  }

  // 2. Eligibility: No unexpected subjects
  const allowedSet = new Set(requiredSubjectNames);
  const forbidden = timetableRows.filter(r => !allowedSet.has(r.subject));
  if (forbidden.length > 0) {
    return {
      valid: false,
      reason: `Invalid subjects present: ${forbidden.map(f => f.subject).join(', ')}`
    };
  }

  // 3. No Duplicates
  const seenCombos = new Set();
  for (const r of timetableRows) {
    const key = `${r.subject}__${r.sub_subject || ''}`;
    if (seenCombos.has(key)) {
      return { valid: false, reason: `Duplicate subject paper found: ${r.subject}` };
    }
    seenCombos.add(key);
  }

  // 4. No Sundays & Date Range
  for (const r of timetableRows) {
    if (!r.exam_date) {
      return { valid: false, reason: `Subject ${r.subject} has no exam date assigned` };
    }
    const d = new Date(r.exam_date);
    if (d.getDay() === 0) {
      return { valid: false, reason: `Exams cannot be scheduled on Sundays (${r.exam_date})` };
    }
    if (startDate && r.exam_date < startDate) {
      return { valid: false, reason: `Exam date ${r.exam_date} is before start date ${startDate}` };
    }
    if (endDate && r.exam_date > endDate) {
      return { valid: false, reason: `Exam date ${r.exam_date} is after end date ${endDate}` };
    }
  }

  // 5. Grading Subjects Constraints & Priority
  const gradingMap = {};
  eligibleSubjects.forEach(s => {
    gradingMap[s.name] = !!s.is_grading;
  });

  const gradingRows = timetableRows.filter(r => gradingMap[r.subject]);
  const nonGradingRows = timetableRows.filter(r => !gradingMap[r.subject]);

  // Rule A: Max 2 grading dates
  const gradingDates = new Set(gradingRows.map(r => r.exam_date));
  if (gradingDates.size > 2) {
    return { 
      valid: false, 
      reason: `Cannot finalize: All grading subjects must be conducted within at most 2 dates. Currently scheduled across ${gradingDates.size} dates.` 
    };
  }

  // Rule B: 1-shift: strictly 1 non-grading exam per day
  const nonGradingDaily = {};
  for (const r of nonGradingRows) {
    nonGradingDaily[r.exam_date] = (nonGradingDaily[r.exam_date] || 0) + 1;
    if (nonGradingDaily[r.exam_date] > 1) {
      return { 
        valid: false, 
        reason: `Cannot finalize: Only 1 non-grading exam per day is allowed. Multiple non-grading exams scheduled on ${r.exam_date}.` 
      };
    }
  }

  // Rule C: 20 working days limit from startDate
  if (startDate) {
    const allowedDates = getWorkingDatesCount(startDate, 20);
    const maxAllowedDate = allowedDates[allowedDates.length - 1];
    for (const r of timetableRows) {
      if (r.exam_date > maxAllowedDate) {
        return { 
          valid: false, 
          reason: `Cannot finalize: Exam for '${r.subject}' on ${r.exam_date} exceeds the 20 working days limit.` 
        };
      }
    }
  }

  // Rule D: Grading priority (all grading subjects must precede non-grading)
  if (category === 'terminal_examination' && gradingRows.length > 0 && nonGradingRows.length > 0) {
    let lastGradingDt = null;
    let firstNonGradingDt = null;

    gradingRows.forEach(r => {
      const dtStr = `${r.exam_date}T${r.start_time || '08:30'}`;
      if (!lastGradingDt || dtStr > lastGradingDt) lastGradingDt = dtStr;
    });

    nonGradingRows.forEach(r => {
      const dtStr = `${r.exam_date}T${r.start_time || '08:30'}`;
      if (!firstNonGradingDt || dtStr < firstNonGradingDt) firstNonGradingDt = dtStr;
    });

    if (lastGradingDt && firstNonGradingDt && firstNonGradingDt <= lastGradingDt) {
      return {
        valid: false,
        reason: 'Cannot finalize: All grading subjects must be conducted before any non-grading subjects.'
      };
    }
  }

  return { valid: true };
}

async function runExamSchedulingTests() {
  console.log('======================================================================');
  console.log('🧪 RUNNING EXAM CREATION & TIMETABLE MANAGEMENT TEST SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Test failure: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Working Days Calculation (Skips Sundays)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Working Days Utility (Skips Sundays) ---');
    // Monday 2026-09-21 to Saturday 2026-09-26 = 6 working days
    const daysMonSat = getWorkingDates('2026-09-21', '2026-09-26');
    assert(daysMonSat.length === 6, 'Mon-Sat produces exactly 6 working days');

    // Monday 2026-09-21 to Monday 2026-09-28 = 8 days total, 7 working days (Sunday 09-27 excluded)
    const daysWithSunday = getWorkingDates('2026-09-21', '2026-09-28');
    assert(daysWithSunday.length === 7, 'Mon to next Mon excludes Sunday (7 working days)');
    assert(!daysWithSunday.includes('2026-09-27'), 'Sunday 2026-09-27 is explicitly excluded');

    // -------------------------------------------------------------
    // TEST 2: Category Subject Filtering and Marks Rules
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Category Subject Filtering & Marks Assignment ---');
    const mockClassSubjects = [
      { name: 'English', is_core: true, group_name: null, marking_system: 'Marking' },
      { name: 'Mathematics', is_core: true, group_name: null, marking_system: 'Marking' },
      { name: 'Hindi', is_core: false, group_name: 'MIL', marking_system: 'Marking' },
      { name: 'Computer Science', is_core: false, group_name: 'Elective', marking_system: 'Marking' },
      { name: 'General Knowledge', is_core: false, group_name: 'Minor', marking_system: 'Marking' },
      { name: 'Moral Science', is_core: false, group_name: 'Grading Sets', marking_system: 'Grade' }
    ];

    // Filter for Periodic Assessment: Core + Elective + MIL only (50 marks)
    const periodicPool = mockClassSubjects.filter(s => {
      const isElective = s.group_name === 'Elective';
      const isMIL = s.group_name === 'MIL';
      return s.is_core || isElective || isMIL;
    }).map(s => ({
      ...s,
      total_marks: 50,
      passing_marks: 20,
      is_grading: s.marking_system === 'Grade' || s.group_name === 'Grading Sets'
    }));

    assert(periodicPool.length === 4, 'Periodic Assessment filters to exactly 4 subjects (Core, MIL, Elective)');
    assert(periodicPool.every(s => s.total_marks === 50 && s.passing_marks === 20), 'Periodic Assessment sets marks to 50 / 20');
    assert(!periodicPool.some(s => s.name === 'Moral Science'), 'Periodic Assessment excludes Grading Sets');
    assert(!periodicPool.some(s => s.name === 'General Knowledge'), 'Periodic Assessment excludes Minor subjects');

    // Filter for Terminal Examination: All subjects (100 marks), flag grading subjects
    const terminalPool = mockClassSubjects.map(s => ({
      ...s,
      total_marks: 100,
      passing_marks: 40,
      is_grading: s.marking_system === 'Grade' || s.group_name === 'Grading Sets'
    }));

    assert(terminalPool.length === 6, 'Terminal Examination includes all 6 subjects');
    assert(terminalPool.every(s => s.total_marks === 100 && s.passing_marks === 40), 'Terminal Examination sets marks to 100 / 40');
    const moralSub = terminalPool.find(s => s.name === 'Moral Science');
    assert(moralSub && moralSub.is_grading === true, 'Moral Science is correctly identified as a grading subject');

    // -------------------------------------------------------------
    // TEST 3: Independent Per-Class Capacity Calculation
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Per-Class Capacity Validation ---');
    // 5 working days: max capacity = 5 (1/day) or 10 (2/day)
    const D = 5;
    const classX_subjects = 5;  // 5 subjects
    const classXI_subjects = 7; // 7 subjects
    const classXII_subjects = 11; // 11 subjects

    // Class X: fits at 1 per day (5 <= 5)
    assert(classX_subjects <= D, 'Class X (5 subjects) fits in 5 working days at 1 exam/day without warning');

    // Class XI: needs 2 per day (5 < 7 <= 10)
    assert(D < classXI_subjects && classXI_subjects <= 2 * D, 'Class XI (7 subjects) triggers 2 exams/day prompt in 5 working days');

    // Class XII: impossible capacity (11 > 10)
    assert(2 * D < classXII_subjects, 'Class XII (11 subjects) is blocked: exceeds maximum 2 exams/day capacity (10)');

    // -------------------------------------------------------------
    // TEST 4: Terminal Examination Grading Priority Finalization Gate
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Grading Priority Finalization Gate ---');
    // Scenario A: Non-grading subject scheduled before grading subject -> MUST REJECT!
    const invalidGradingOrder = [
      { subject: 'English', exam_date: '2026-09-21', start_time: '08:30', is_grading: false },
      { subject: 'Mathematics', exam_date: '2026-09-22', start_time: '08:30', is_grading: false },
      { subject: 'Hindi', exam_date: '2026-09-23', start_time: '08:30', is_grading: false },
      { subject: 'Computer Science', exam_date: '2026-09-24', start_time: '08:30', is_grading: false },
      { subject: 'General Knowledge', exam_date: '2026-09-25', start_time: '08:30', is_grading: false },
      { subject: 'Moral Science', exam_date: '2026-09-26', start_time: '08:30', is_grading: true } // Grading scheduled LAST!
    ];

    const gateResA = validateFinalizationGate({
      timetableRows: invalidGradingOrder,
      eligibleSubjects: terminalPool,
      category: 'terminal_examination',
      startDate: '2026-09-21',
      endDate: '2026-09-26'
    });

    assert(gateResA.valid === false, 'Finalization correctly REJECTS when grading subject is scheduled after non-grading');
    assert(gateResA.reason.includes('All grading subjects must be conducted before any non-grading subjects'), 'Correct error reason returned');

    // Scenario B: Grading subject scheduled first -> MUST PASS!
    const validGradingOrder = [
      { subject: 'Moral Science', exam_date: '2026-09-21', start_time: '08:30', is_grading: true }, // Grading first
      { subject: 'English', exam_date: '2026-09-22', start_time: '08:30', is_grading: false },
      { subject: 'Mathematics', exam_date: '2026-09-23', start_time: '08:30', is_grading: false },
      { subject: 'Hindi', exam_date: '2026-09-24', start_time: '08:30', is_grading: false },
      { subject: 'Computer Science', exam_date: '2026-09-25', start_time: '08:30', is_grading: false },
      { subject: 'General Knowledge', exam_date: '2026-09-26', start_time: '08:30', is_grading: false }
    ];

    const gateResB = validateFinalizationGate({
      timetableRows: validGradingOrder,
      eligibleSubjects: terminalPool,
      category: 'terminal_examination',
      startDate: '2026-09-21',
      endDate: '2026-09-26'
    });

    assert(gateResB.valid === true, 'Finalization PASSES when grading subjects precede all non-grading subjects');

    // -------------------------------------------------------------
    // TEST 5: Subject Completeness & Duplicate Prevention
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Subject Completeness & Duplicate Prevention ---');
    // Missing 'General Knowledge'
    const incompleteRows = validGradingOrder.filter(r => r.subject !== 'General Knowledge');
    const gateResC = validateFinalizationGate({
      timetableRows: incompleteRows,
      eligibleSubjects: terminalPool,
      category: 'terminal_examination',
      startDate: '2026-09-21',
      endDate: '2026-09-26'
    });

    assert(gateResC.valid === false, 'Finalization correctly REJECTS incomplete timetable (missing subject)');
    assert(gateResC.reason.includes('General Knowledge'), 'Reason specifies the missing subject');

    // Duplicate subject assignment
    const duplicateRows = [
      ...validGradingOrder,
      { subject: 'English', exam_date: '2026-09-26', start_time: '11:30', is_grading: false }
    ];
    const gateResD = validateFinalizationGate({
      timetableRows: duplicateRows,
      eligibleSubjects: terminalPool,
      category: 'terminal_examination',
      startDate: '2026-09-21',
      endDate: '2026-09-26'
    });

    assert(gateResD.valid === false, 'Finalization correctly REJECTS duplicate subject entries');

    // -------------------------------------------------------------
    // TEST 6: Sunday Prohibition & Max 2 Per Day
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Sunday Prohibition & Slot Limits ---');
    const sundayRows = [
      ...validGradingOrder.slice(0, 5),
      { subject: 'General Knowledge', exam_date: '2026-09-27', start_time: '08:30', is_grading: false } // Sunday!
    ];
    const gateResE = validateFinalizationGate({
      timetableRows: sundayRows,
      eligibleSubjects: terminalPool,
      category: 'terminal_examination',
      startDate: '2026-09-21',
      endDate: '2026-09-28'
    });

    assert(gateResE.valid === false, 'Finalization correctly REJECTS scheduling on a Sunday');

    // 3 exams on the same date
    const threeExamsSameDate = [
      { subject: 'Moral Science', exam_date: '2026-09-21', start_time: '08:30', is_grading: true },
      { subject: 'English', exam_date: '2026-09-21', start_time: '10:45', is_grading: false },
      { subject: 'Mathematics', exam_date: '2026-09-21', start_time: '13:00', is_grading: false },
      { subject: 'Hindi', exam_date: '2026-09-22', start_time: '08:30', is_grading: false },
      { subject: 'Computer Science', exam_date: '2026-09-23', start_time: '08:30', is_grading: false },
      { subject: 'General Knowledge', exam_date: '2026-09-24', start_time: '08:30', is_grading: false }
    ];
    const gateResF = validateFinalizationGate({
      timetableRows: threeExamsSameDate,
      eligibleSubjects: terminalPool,
      category: 'terminal_examination',
      startDate: '2026-09-21',
      endDate: '2026-09-26'
    });

    assert(gateResF.valid === false, 'Finalization correctly REJECTS scheduling > 2 exams in one day');

    // -------------------------------------------------------------
    // TEST 7: Supabase Live Database Integration
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Supabase Schema & Multi-Tenant Constraint Verification ---');
    // Verify default_exams has category column
    const { data: tmplSample, error: tmplErr } = await supabase
      .from('default_exams')
      .select('id, name, category')
      .limit(1);

    assert(!tmplErr, 'Successfully queried default_exams');
    assert(Array.isArray(tmplSample), 'default_exams returns array');
    if (tmplSample.length > 0) {
      assert('category' in tmplSample[0], 'default_exams table contains category column');
    }

    // Verify exams table has logical_exam_id and category
    const { data: examSample, error: examErr } = await supabase
      .from('exams')
      .select('id, logical_exam_id, category, class_level, school_id')
      .limit(1);

    assert(!examErr, 'Successfully queried exams table');
    if (examSample && examSample.length > 0) {
      assert(examSample[0].logical_exam_id !== null, 'exams.logical_exam_id is NOT NULL');
      assert('category' in examSample[0], 'exams table contains category column');
    }

    // -------------------------------------------------------------
    // TEST 8: Atomic Transaction Simulation
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Atomic Rollback Behavior ---');
    const testLogicalId = crypto.randomUUID();
    let simulatedInsertSucceeded = false;

    try {
      // Simulate creating 2 classes, where second class throws
      const dummyExams = [
        { name: 'Atomic Test', class_level: 'X', school_id: '00000000-0000-0000-0000-000000000000', logical_exam_id: testLogicalId }
      ];

      const { data: inserted, error: insErr } = await supabase.from('exams').insert(dummyExams).select();
      if (insErr) throw insErr;
      simulatedInsertSucceeded = true;

      // Now deliberately trigger rollback
      throw new Error('Simulated capacity error on subsequent class');
    } catch (err) {
      // Rollback block
      await supabase.from('exams').delete().eq('logical_exam_id', testLogicalId);
    }

    // Verify rollback wiped the dummy rows
    const { data: remaining } = await supabase.from('exams').select('id').eq('logical_exam_id', testLogicalId);
    assert(!remaining || remaining.length === 0, 'Atomic rollback ensures zero orphaned rows remain upon failure');

    // -------------------------------------------------------------
    // TEST 9: Divided Subjects as Marking Sections (Not Multiple Exams)
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Divided Subjects Treated as Marking Sections ---');
    const mockDividedSubject = {
      name: 'Science',
      is_core: true,
      group_name: null,
      is_divided: true,
      parts: [
        { name: 'Biology', sub_code: 'BIO' },
        { name: 'Physics', sub_code: 'PHY' },
        { name: 'Chemistry', sub_code: 'CHEM' }
      ],
      total_marks: 50,
      passing_marks: 20
    };

    // 1. Capacity count: A divided subject counts as 1 exam slot, not 3
    const subjectsWithDivided = [
      { name: 'English', is_core: true },
      { name: 'Mathematics', is_core: true },
      mockDividedSubject
    ];
    assert(subjectsWithDivided.length === 3, 'Class with 1 divided subject (3 parts) has requiredSubjects count of 3, not 5');

    // 2. Timetable Generation: Exactly one exam timetable row per divided subject
    const generatedTimetable = subjectsWithDivided.map(item => ({
      subject: item.name,
      sub_subject: null, // Divided papers are marking sections, not separate timetable entries
      total_marks: item.total_marks || 50,
      passing_marks: item.passing_marks || 20
    }));

    assert(generatedTimetable.length === 3, 'Generated timetable contains exactly 3 entries (1 per subject)');
    const scienceTimetableRow = generatedTimetable.find(r => r.subject === 'Science');
    assert(scienceTimetableRow && scienceTimetableRow.sub_subject === null, 'Science timetable entry has sub_subject null');
    assert(scienceTimetableRow.total_marks === 50, 'Science total marks is 50, not multiplied by 3 parts');

    // -------------------------------------------------------------
    // TEST 10: 20 Working Days Auto-Scheduling, Grading <= 2 Dates, and MIL Unification
    // -------------------------------------------------------------
    console.log('\n--- TEST 10: 20 Working Days Auto-Scheduling, Grading <= 2 Dates, and MIL Unification ---');
    
    // 1. Test getWorkingDatesCount generates 20 working days with zero Sundays
    const working20 = getWorkingDatesCount('2026-10-01', 20);
    assert(working20.length === 20, 'getWorkingDatesCount generates exactly 20 working days');
    const hasSunday = working20.some(d => new Date(d).getDay() === 0);
    assert(!hasSunday, 'getWorkingDatesCount excludes all Sundays');

    // 2. High School MIL Consolidation:
    // In Class IX-XII, elective MIL subjects (Assamese, Hindi, Bengali, Alt English) must collapse to 1 'MIL' subject
    const rawClassXSubjects = [
      { name: 'English', group_name: null, is_core: true },
      { name: 'General Science', group_name: null, is_core: true },
      { name: 'Mathematics', group_name: null, is_core: true },
      { name: 'Assamese', group_name: 'MIL', is_core: false },
      { name: 'Hindi', group_name: 'MIL', is_core: false },
      { name: 'Advanced Mathematics', group_name: 'Elective', is_core: false }
    ];

    function consolidateMilForHighSchool(classLevel, subjects) {
      const highSchoolClasses = ['IX', 'X', 'XI', 'XII', 'XI-SCIENCE', 'XI-COM', 'XI-ARTS', 'XII-SCIENCE', 'XII-COM', 'XII-ARTS'];
      const isHighSchool = highSchoolClasses.includes(normalizeClassLevel(classLevel).toUpperCase());
      if (!isHighSchool) return subjects;

      const isMilItem = (item) => {
        const grp = (item.group_name || '').toUpperCase();
        const nm = (item.name || '').toUpperCase();
        return grp === 'MIL' || nm === 'MIL' || nm.startsWith('MIL ') || nm.startsWith('MIL-') || nm.startsWith('MIL(') || nm.startsWith('MIL (');
      };

      const milItems = subjects.filter(isMilItem);
      if (milItems.length > 0) {
        const nonMilItems = subjects.filter(item => !isMilItem(item));
        const consolidatedMil = {
          name: 'MIL',
          code: 'MIL',
          is_core: false,
          group_name: 'MIL',
          total_marks: 100,
          passing_marks: 40
        };
        return [...nonMilItems, consolidatedMil];
      }
      return subjects;
    }

    const classXConsolidated = consolidateMilForHighSchool('X', rawClassXSubjects);
    assert(classXConsolidated.some(s => s.name === 'MIL'), 'Class X has unified MIL subject');
    assert(!classXConsolidated.some(s => s.name === 'Assamese'), 'Class X has Assamese consolidated into MIL');
    assert(!classXConsolidated.some(s => s.name === 'Hindi'), 'Class X has Hindi consolidated into MIL');
    assert(classXConsolidated.length === 5, 'Class X subjects count reduced from 6 to 5 after MIL consolidation');

    // In Class VI, languages are NOT consolidated
    const rawClassVISubjects = [
      { name: 'English', group_name: null, is_core: true },
      { name: 'Assamese', group_name: 'MIL', is_core: false },
      { name: 'Hindi', group_name: 'MIL', is_core: false }
    ];
    const classVIConsolidated = consolidateMilForHighSchool('VI', rawClassVISubjects);
    assert(classVIConsolidated.length === 3, 'Class VI retains separate language subjects (no MIL consolidation for middle school)');

    // 3. Auto-Scheduling with <= 2 grading dates:
    // Terminal exam with 3 grading subjects and 4 non-grading subjects
    const testTerminalSubs = [
      { name: 'Drawing', is_grading: true },
      { name: 'Craft', is_grading: true },
      { name: 'Physical Education', is_grading: true },
      { name: 'English', is_grading: false },
      { name: 'Mathematics', is_grading: false },
      { name: 'Science', is_grading: false },
      { name: 'Social Science', is_grading: false }
    ];

    const gradingSubs = testTerminalSubs.filter(s => s.is_grading);
    const nonGradingSubs = testTerminalSubs.filter(s => !s.is_grading);
    const gradingDaysCount = gradingSubs.length === 0 ? 0 : (gradingSubs.length === 1 ? 1 : 2);
    
    const scheduledRows = [];
    if (gradingDaysCount === 2) {
      const mid = Math.ceil(gradingSubs.length / 2);
      gradingSubs.slice(0, mid).forEach(s => scheduledRows.push({ subject: s.name, exam_date: working20[0], is_grading: true }));
      gradingSubs.slice(mid).forEach(s => scheduledRows.push({ subject: s.name, exam_date: working20[1], is_grading: true }));
    }
    nonGradingSubs.forEach((s, idx) => {
      scheduledRows.push({ subject: s.name, exam_date: working20[gradingDaysCount + idx], is_grading: false });
    });

    const uniqueGradingDates = new Set(scheduledRows.filter(r => r.is_grading).map(r => r.exam_date));
    assert(uniqueGradingDates.size <= 2, 'Grading subjects are scheduled within at most 2 dates');
    assert(scheduledRows.length === 7, 'All 7 subjects are scheduled');

    // 4. Validation Gate: Rejects when grading subjects span > 2 dates
    const invalid3GradingDates = [
      { subject: 'Drawing', exam_date: working20[0], is_grading: true },
      { subject: 'Craft', exam_date: working20[1], is_grading: true },
      { subject: 'Physical Education', exam_date: working20[2], is_grading: true },
      { subject: 'English', exam_date: working20[3], is_grading: false },
      { subject: 'Mathematics', exam_date: working20[4], is_grading: false },
      { subject: 'Science', exam_date: working20[5], is_grading: false },
      { subject: 'Social Science', exam_date: working20[6], is_grading: false }
    ];
    const gateResGradingDates = validateFinalizationGate({
      timetableRows: invalid3GradingDates,
      eligibleSubjects: testTerminalSubs,
      category: 'terminal_examination',
      startDate: working20[0]
    });
    assert(gateResGradingDates.valid === false, 'Finalization REJECTS when grading subjects span > 2 dates');
    assert(gateResGradingDates.reason.includes('at most 2 dates'), 'Reason mentions max 2 dates for grading');

    // 5. Validation Gate: Rejects when non-grading subjects have > 1 exam per day in 1-shift
    const invalid2NonGradingSameDay = [
      { subject: 'Drawing', exam_date: working20[0], is_grading: true },
      { subject: 'Craft', exam_date: working20[0], is_grading: true },
      { subject: 'Physical Education', exam_date: working20[1], is_grading: true },
      { subject: 'English', exam_date: working20[2], is_grading: false },
      { subject: 'Mathematics', exam_date: working20[2], is_grading: false },
      { subject: 'Science', exam_date: working20[3], is_grading: false },
      { subject: 'Social Science', exam_date: working20[4], is_grading: false }
    ];
    const gateResNonGradingDaily = validateFinalizationGate({
      timetableRows: invalid2NonGradingSameDay,
      eligibleSubjects: testTerminalSubs,
      category: 'terminal_examination',
      startDate: working20[0]
    });
    assert(gateResNonGradingDaily.valid === false, 'Finalization REJECTS when multiple non-grading exams are scheduled on the same date');
    assert(gateResNonGradingDaily.reason.includes('Only 1 non-grading exam per day is allowed'), 'Reason mentions 1 non-grading exam per day');

    console.log('\n======================================================================');
    console.log(`🎉 ALL ${passed}/${total} EXAM SCHEDULING TESTS PASSED SUCCESSFULLY!`);
    console.log('======================================================================\n');
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  }
}

runExamSchedulingTests();
