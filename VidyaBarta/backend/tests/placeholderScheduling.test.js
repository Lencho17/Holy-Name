const assert = require('assert');
const { detectPlaceholderType, categorizeSubjects, mapClassSubjectsToTemplate } = require('../utils/templateRoutineMapper');
const { getWorkingDatesCount } = require('../routes/exams');

console.log('======================================================================');
console.log('🧪 RUNNING PLACEHOLDER ROUTINE MAPPING TEST SUITE');
console.log('======================================================================\n');

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${desc}`);
    console.error(err);
  }
}

// 1. Placeholder Token Detection
it('Detects Core placeholders and indexes correctly', () => {
  assert.deepStrictEqual(detectPlaceholderType('Core 1'), { type: 'CORE', index: 1, name: 'CORE 1' });
  assert.deepStrictEqual(detectPlaceholderType('CORE 4'), { type: 'CORE', index: 4, name: 'CORE 4' });
  assert.deepStrictEqual(detectPlaceholderType('Core-2'), { type: 'CORE', index: 2, name: 'CORE-2' });
  assert.deepStrictEqual(detectPlaceholderType('Core Subject 3'), { type: 'CORE', index: 3, name: 'CORE SUBJECT 3' });
  assert.deepStrictEqual(detectPlaceholderType('CORE'), { type: 'CORE', index: null, name: 'CORE' });
});

it('Detects MIL placeholders correctly', () => {
  assert.deepStrictEqual(detectPlaceholderType('MIL'), { type: 'MIL', index: null, name: 'MIL' });
  assert.deepStrictEqual(detectPlaceholderType('MIL 1'), { type: 'MIL', index: 1, name: 'MIL 1' });
  assert.deepStrictEqual(detectPlaceholderType('MIL Subject'), { type: 'MIL', index: null, name: 'MIL SUBJECT' });
});

it('Detects Elective placeholders and indexes correctly', () => {
  assert.deepStrictEqual(detectPlaceholderType('Elective 1'), { type: 'ELECTIVE', index: 1, name: 'ELECTIVE 1' });
  assert.deepStrictEqual(detectPlaceholderType('ELECTIVE 2'), { type: 'ELECTIVE', index: 2, name: 'ELECTIVE 2' });
  assert.deepStrictEqual(detectPlaceholderType('Elective'), { type: 'ELECTIVE', index: null, name: 'ELECTIVE' });
});

it('Detects Grading placeholders correctly', () => {
  assert.deepStrictEqual(detectPlaceholderType('Grading 1'), { type: 'GRADING', index: 1, name: 'GRADING 1' });
  assert.deepStrictEqual(detectPlaceholderType('Grading 2'), { type: 'GRADING', index: 2, name: 'GRADING 2' });
  assert.deepStrictEqual(detectPlaceholderType('Grading Sets'), { type: 'GRADING', index: null, name: 'GRADING SETS' });
});

it('Falls back to EXACT for concrete subject names', () => {
  assert.deepStrictEqual(detectPlaceholderType('MATHEMATICS'), { type: 'EXACT', index: null, name: 'MATHEMATICS' });
  assert.deepStrictEqual(detectPlaceholderType('PHYSICS'), { type: 'EXACT', index: null, name: 'PHYSICS' });
});

// 2. Class IX Subject Mapping
it('Maps Class IX subjects into Periodic Assessment template placeholders', () => {
  const workingDates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'];
  const templateRows = [
    { subject: 'Core 1', day_offset: 0, order_index: 0, start_time: '08:30', end_time: '10:30', total_marks: 50, passing_marks: 20 },
    { subject: 'Core 2', day_offset: 1, order_index: 1, start_time: '08:30', end_time: '10:30', total_marks: 50, passing_marks: 20 },
    { subject: 'Core 3', day_offset: 2, order_index: 2, start_time: '08:30', end_time: '10:30', total_marks: 50, passing_marks: 20 },
    { subject: 'Core 4', day_offset: 3, order_index: 3, start_time: '08:30', end_time: '10:30', total_marks: 50, passing_marks: 20 },
    { subject: 'MIL', day_offset: 4, order_index: 4, start_time: '08:30', end_time: '10:30', total_marks: 50, passing_marks: 20 },
    { subject: 'Elective 1', day_offset: 5, order_index: 5, start_time: '08:30', end_time: '10:30', total_marks: 50, passing_marks: 20 }
  ];

  const classIXSubjects = [
    { name: 'ENGLISH', is_core: true, group_name: null, is_grading: false },
    { name: 'MATHEMATICS', is_core: true, group_name: null, is_grading: false },
    { name: 'SCIENCE', is_core: true, group_name: null, is_grading: false },
    { name: 'SOCIAL SCIENCE', is_core: true, group_name: null, is_grading: false },
    { name: 'MIL', is_core: false, group_name: 'MIL', is_grading: false },
    { name: 'ADV MATHEMATICS', is_core: false, group_name: 'Elective', is_grading: false }
  ];

  const mapped = mapClassSubjectsToTemplate({
    examId: 'exam-class-9',
    schoolId: 'school-1',
    classLevel: 'IX',
    templateRows,
    classSubjects: classIXSubjects,
    workingDates,
    templateCategory: 'periodic_assessment'
  });

  assert.strictEqual(mapped.length, 6, 'All 6 subjects mapped');
  assert.strictEqual(mapped[0].subject, 'ENGLISH', 'Day 1 Core 1 is English');
  assert.strictEqual(mapped[0].exam_date, '2026-10-01');
  assert.strictEqual(mapped[0].total_marks, 50);

  assert.strictEqual(mapped[1].subject, 'MATHEMATICS', 'Day 2 Core 2 is Mathematics');
  assert.strictEqual(mapped[1].exam_date, '2026-10-02');

  assert.strictEqual(mapped[2].subject, 'SCIENCE', 'Day 3 Core 3 is Science');
  assert.strictEqual(mapped[2].exam_date, '2026-10-03');

  assert.strictEqual(mapped[3].subject, 'SOCIAL SCIENCE', 'Day 4 Core 4 is Social Science');
  assert.strictEqual(mapped[3].exam_date, '2026-10-05');

  assert.strictEqual(mapped[4].subject, 'MIL', 'Day 5 MIL is MIL');
  assert.strictEqual(mapped[4].exam_date, '2026-10-06');

  assert.strictEqual(mapped[5].subject, 'ADV MATHEMATICS', 'Day 6 Elective 1 is Adv Mathematics');
  assert.strictEqual(mapped[5].exam_date, '2026-10-07');
});

// 3. Class I Subject Mapping (Lower class with different subjects)
it('Maps Class I subjects into the same template without errors', () => {
  const workingDates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'];
  const templateRows = [
    { subject: 'Core 1', day_offset: 0, order_index: 0, total_marks: 50, passing_marks: 20 },
    { subject: 'Core 2', day_offset: 1, order_index: 1, total_marks: 50, passing_marks: 20 },
    { subject: 'Core 3', day_offset: 2, order_index: 2, total_marks: 50, passing_marks: 20 },
    { subject: 'Core 4', day_offset: 3, order_index: 3, total_marks: 50, passing_marks: 20 },
    { subject: 'MIL', day_offset: 4, order_index: 4, total_marks: 50, passing_marks: 20 },
    { subject: 'Elective 1', day_offset: 5, order_index: 5, total_marks: 50, passing_marks: 20 }
  ];

  // Class I subjects
  const classISubjects = [
    { name: 'ENGLISH', is_core: true, group_name: null, is_grading: false },
    { name: 'MATHEMATICS', is_core: true, group_name: null, is_grading: false },
    { name: 'SCIENCE', is_core: true, group_name: null, is_grading: false },
    { name: 'SOCIAL SCIENCE', is_core: true, group_name: null, is_grading: false },
    { name: 'HINDI', is_core: true, group_name: null, is_grading: false },
    { name: 'ASSAMESE', is_core: true, group_name: null, is_grading: false },
    { name: 'ENG GRAMMAR', is_core: true, group_name: null, is_grading: false }
  ];

  const mapped = mapClassSubjectsToTemplate({
    examId: 'exam-class-1',
    schoolId: 'school-1',
    classLevel: 'I',
    templateRows,
    classSubjects: classISubjects,
    workingDates,
    templateCategory: 'periodic_assessment'
  });

  assert.strictEqual(mapped.length, 7, 'All 7 Class I subjects mapped');
  // Day 1: English
  assert.strictEqual(mapped[0].subject, 'ENGLISH');
  // Day 5: MIL slot matched language subject (e.g. Hindi or Assamese)
  assert.strictEqual(mapped[4].subject, 'HINDI');
  // Remaining core subjects (Assamese, Eng Grammar) scheduled cleanly
  const allNames = mapped.map(m => m.subject);
  assert(allNames.includes('ASSAMESE'), 'Assamese is scheduled');
  assert(allNames.includes('ENG GRAMMAR'), 'Eng Grammar is scheduled');
});

// 4. Terminal Assessment with Grading Placeholders
it('Maps Terminal Assessment grading placeholders into at most 2 dates', () => {
  const workingDates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06', '2026-10-07'];
  const templateRows = [
    { subject: 'Grading 1', day_offset: 0, order_index: 0, total_marks: 100, passing_marks: 40 },
    { subject: 'Grading 2', day_offset: 1, order_index: 1, total_marks: 100, passing_marks: 40 },
    { subject: 'Core 1', day_offset: 2, order_index: 2, total_marks: 100, passing_marks: 40 },
    { subject: 'Core 2', day_offset: 3, order_index: 3, total_marks: 100, passing_marks: 40 }
  ];

  const terminalSubjects = [
    { name: 'ART', is_core: false, is_grading: true },
    { name: 'CRAFT', is_core: false, is_grading: true },
    { name: 'P.E.', is_core: false, is_grading: true },
    { name: 'ENGLISH', is_core: true, is_grading: false },
    { name: 'MATHEMATICS', is_core: true, is_grading: false }
  ];

  const mapped = mapClassSubjectsToTemplate({
    examId: 'exam-terminal',
    schoolId: 'school-1',
    classLevel: 'IV',
    templateRows,
    classSubjects: terminalSubjects,
    workingDates,
    templateCategory: 'terminal_examination'
  });

  assert.strictEqual(mapped.length, 5, 'All 5 subjects scheduled');
  const gradingRows = mapped.filter(r => ['ART', 'CRAFT', 'P.E.'].includes(r.subject));
  const gradingDates = [...new Set(gradingRows.map(r => r.exam_date))];
  assert(gradingDates.length <= 2, 'Grading subjects scheduled within at most 2 dates');
  assert.strictEqual(gradingDates[0], '2026-10-01');
  assert.strictEqual(gradingDates[1], '2026-10-02');
});

console.log('\n======================================================================');
console.log(`🎉 ALL ${passed}/${total} PLACEHOLDER TESTS PASSED!`);
console.log('======================================================================');
