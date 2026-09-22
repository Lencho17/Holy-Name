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

console.log('All marksheet utility unit tests passed successfully!');
