/**
 * Canonical Class/Grade Sorting Utility
 * Ensures school classes always display in serial pedagogical progression:
 * Pre-Nursery/PPE -> Nursery -> KG-I/LKG -> KG-II/UKG -> I through X -> XI -> XII
 */

export const getClassRank = (rawName) => {
  if (!rawName) return 9999;
  const clean = String(rawName)
    .trim()
    .toUpperCase()
    .replace(/^(CLASS|GRADE|STD|STANDARD)\s*[-:]?\s*/i, '');

  // Pre-primary / Kindergarten
  if (clean.includes('PLAY') || clean === 'PG') return 1;
  if (clean.includes('PPE') || clean.includes('PRE-NUR') || clean.includes('PRE NUR') || clean.includes('PRE-KG') || clean.includes('PRE KG')) return 2;
  if (clean.includes('NURSERY') || clean === 'NUR') return 3;
  if (clean.includes('LKG') || clean.includes('KG-I') || clean.includes('KG-1') || clean.includes('KG 1') || clean.includes('JR')) return 4;
  if (clean.includes('UKG') || clean.includes('KG-II') || clean.includes('KG-2') || clean.includes('KG 2') || clean.includes('SR')) return 5;
  if (clean === 'KG') return 4.5;

  // Stream priority within XI & XII
  const streamRank = (str) => {
    if (/SCI/i.test(str)) return 1;
    if (/COM/i.test(str)) return 2;
    if (/ART|HUM/i.test(str)) return 3;
    return 4;
  };

  const gradeRules = [
    { regex: /^(XII|12)([-_\s].*)?$/, base: 120 },
    { regex: /^(XI|11)([-_\s].*)?$/, base: 110 },
    { regex: /^(X|10)([-_\s].*)?$/, base: 100 },
    { regex: /^(IX|9)([-_\s].*)?$/, base: 90 },
    { regex: /^(VIII|8)([-_\s].*)?$/, base: 80 },
    { regex: /^(VII|7)([-_\s].*)?$/, base: 70 },
    { regex: /^(VI|6)([-_\s].*)?$/, base: 60 },
    { regex: /^(V|5)([-_\s].*)?$/, base: 50 },
    { regex: /^(IV|4)([-_\s].*)?$/, base: 40 },
    { regex: /^(III|3)([-_\s].*)?$/, base: 30 },
    { regex: /^(II|2)([-_\s].*)?$/, base: 20 },
    { regex: /^(I|1)([-_\s].*)?$/, base: 10 },
  ];

  for (const rule of gradeRules) {
    const m = clean.match(rule.regex);
    if (m) {
      return rule.base + (m[2] ? streamRank(m[2]) : 0);
    }
  }

  return 500;
};

export const sortClasses = (list = [], keyExtractor = null) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const nameA = keyExtractor ? keyExtractor(a) : (typeof a === 'string' ? a : (a?.name || a?.class_level || ''));
    const nameB = keyExtractor ? keyExtractor(b) : (typeof b === 'string' ? b : (b?.name || b?.class_level || ''));
    const rankDiff = getClassRank(nameA) - getClassRank(nameB);
    if (rankDiff !== 0) return rankDiff;
    return String(nameA).localeCompare(String(nameB));
  });
};

export const DEFAULT_SCHOOL_CLASSES = [
  'PRE-NURSERY',
  'KG-I',
  'KG-II',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI-Science',
  'XI-Com',
  'XI-Arts',
  'XII-Science',
  'XII-Com',
  'XII-Arts'
];
