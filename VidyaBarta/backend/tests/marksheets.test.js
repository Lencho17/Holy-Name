const assert = require('assert');

// Test calculateGrade logic
const calculateGrade = (percentage) => {
  const p = parseFloat(percentage) || 0;
  if (p >= 90) return { grade: 'A1', gpa: 10.0, remarks: 'Outstanding' };
  if (p >= 80) return { grade: 'A2', gpa: 9.0, remarks: 'Excellent' };
  if (p >= 70) return { grade: 'B1', gpa: 8.0, remarks: 'Very Good' };
  if (p >= 60) return { grade: 'B2', gpa: 7.0, remarks: 'Good' };
  if (p >= 50) return { grade: 'C1', gpa: 6.0, remarks: 'Above Average' };
  if (p >= 40) return { grade: 'C2', gpa: 5.0, remarks: 'Average' };
  if (p >= 33) return { grade: 'D', gpa: 4.0, remarks: 'Pass' };
  return { grade: 'E', gpa: 0.0, remarks: 'Needs Improvement' };
};

const getNextClassLevel = (currentClass) => {
  const progression = ['Nursery', 'KG-I', 'KG-II', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const curClean = (currentClass || '').trim();
  const idx = progression.findIndex(c => c.toLowerCase() === curClean.toLowerCase());
  if (idx !== -1 && idx < progression.length - 1) {
    return progression[idx + 1];
  }
  return 'Next Higher Class';
};

console.log('Testing calculateGrade...');
assert.strictEqual(calculateGrade(95).grade, 'A1');
assert.strictEqual(calculateGrade(85).grade, 'A2');
assert.strictEqual(calculateGrade(72).grade, 'B1');
assert.strictEqual(calculateGrade(65).grade, 'B2');
assert.strictEqual(calculateGrade(55).grade, 'C1');
assert.strictEqual(calculateGrade(45).grade, 'C2');
assert.strictEqual(calculateGrade(35).grade, 'D');
assert.strictEqual(calculateGrade(25).grade, 'E');

console.log('Testing getNextClassLevel...');
assert.strictEqual(getNextClassLevel('KG-I'), 'KG-II');
assert.strictEqual(getNextClassLevel('IV'), 'V');
assert.strictEqual(getNextClassLevel('X'), 'XI');
assert.strictEqual(getNextClassLevel('XII'), 'Next Higher Class');

console.log('Testing 20% + 30% + 20% + 30% weighted formula...');
const calculateSubjectWeighted = (ut1Obt, ut1Max, term1Obt, term1Max, ut2Obt, ut2Max, term2Obt, term2Max) => {
  const ut1Pct = ut1Obt != null && ut1Max > 0 ? (ut1Obt / ut1Max) * 100 : null;
  const ut1Wt = ut1Pct != null ? (ut1Pct * 0.20) : null;

  const term1Pct = term1Obt != null && term1Max > 0 ? (term1Obt / term1Max) * 100 : null;
  const term1Wt = term1Pct != null ? (term1Pct * 0.30) : null;

  const ut2Pct = ut2Obt != null && ut2Max > 0 ? (ut2Obt / ut2Max) * 100 : null;
  const ut2Wt = ut2Pct != null ? (ut2Pct * 0.20) : null;

  const term2Pct = term2Obt != null && term2Max > 0 ? (term2Obt / term2Max) * 100 : null;
  const term2Wt = term2Pct != null ? (term2Pct * 0.30) : null;

  let totalWt = 0;
  let earnedWt = 0;
  if (ut1Wt != null) { totalWt += 20; earnedWt += ut1Wt; }
  if (term1Wt != null) { totalWt += 30; earnedWt += term1Wt; }
  if (ut2Wt != null) { totalWt += 20; earnedWt += ut2Wt; }
  if (term2Wt != null) { totalWt += 30; earnedWt += term2Wt; }

  if (totalWt > 0) {
    return totalWt === 100 ? earnedWt.toFixed(1) : ((earnedWt / totalWt) * 100).toFixed(1);
  }
  return null;
};

// Case 1: Perfect score across all 4 exams
// UT1 50/50 (20) + Term1 100/100 (30) + UT2 50/50 (20) + Term2 100/100 (30) = 100.0
assert.strictEqual(calculateSubjectWeighted(50, 50, 100, 100, 50, 50, 100, 100), '100.0');

// Case 2: Realistic scores
// UT1 40/50 = 80% * 0.20 = 16.0
// Term1 70/100 = 70% * 0.30 = 21.0
// UT2 45/50 = 90% * 0.20 = 18.0
// Term2 80/100 = 80% * 0.30 = 24.0
// Total = 16 + 21 + 18 + 24 = 79.0
assert.strictEqual(calculateSubjectWeighted(40, 50, 70, 100, 45, 50, 80, 100), '79.0');

// Case 3: Partial exams (only UT1 and Term1 entered yet)
// UT1 40/50 (16/20) + Term1 70/100 (21/30) = earned 37 out of 50 total wt = 74.0%
assert.strictEqual(calculateSubjectWeighted(40, 50, 70, 100, null, 50, null, 100), '74.0');

console.log('All marksheet utility and weighting unit tests passed successfully!');

