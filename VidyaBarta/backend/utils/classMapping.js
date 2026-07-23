const romanToArabic = {
  'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
  'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
  'XI': '11', 'XII': '12'
};
const arabicToRoman = {
  '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V',
  '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X',
  '11': 'XI', '12': 'XII'
};

function getEquivalentClasses(classLevel) {
  if (!classLevel) return [];
  const str = String(classLevel).trim();
  const equiv = [str];
  if (romanToArabic[str]) equiv.push(romanToArabic[str]);
  if (arabicToRoman[str]) equiv.push(arabicToRoman[str]);
  return equiv;
}
module.exports = { getEquivalentClasses };
