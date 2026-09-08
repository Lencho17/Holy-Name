require('dotenv').config();
const supabase = require('./config/supabase');

const mapping = {
  'CLASS-I': 'I',
  'CLASS I': 'I',
  'CLASS-II': 'II',
  'CLASS II': 'II',
  'CLASS-III': 'III',
  'CLASS III': 'III',
  'CLASS-IV': 'IV',
  'CLASS IV': 'IV',
  'CLASS-V': 'V',
  'CLASS V': 'V',
  'CLASS-VI': 'VI',
  'CLASS VI': 'VI',
  'CLASS-VII': 'VII',
  'CLASS VII': 'VII',
  'CLASS-VIII': 'VIII',
  'CLASS VIII': 'VIII',
  'CLASS-IX': 'IX',
  'CLASS IX': 'IX',
  'CLASS-X': 'X',
  'CLASS X': 'X',
  'CLASS-XI ARTS': 'XI-Arts',
  'CLASS-XI SCI': 'XI-Science',
  'CLASS-XI COM': 'XI-Com',
  'CLASS-XII ARTS': 'XII-Arts',
  'CLASS-XII SCI': 'XII-Science',
  'CLASS-XII COM': 'XII-Com'
};

async function migrate() {
  console.log('Starting class name migration...');

  // 1. global_classes
  const { data: globalClasses } = await supabase.from('global_classes').select('*');
  if (globalClasses) {
    for (const gc of globalClasses) {
      const newName = mapping[gc.name];
      if (newName) {
        await supabase.from('global_classes').update({ name: newName }).eq('id', gc.id);
        console.log(`Updated global_class: ${gc.name} -> ${newName}`);
      }
    }
  }

  // 2. school_class_configs
  const { data: configs } = await supabase.from('school_class_configs').select('*');
  if (configs) {
    for (const c of configs) {
      let newLevel = mapping[c.class_level];
      if (!newLevel && mapping[c.class_level.trim()]) newLevel = mapping[c.class_level.trim()];
      if (newLevel) {
        await supabase.from('school_class_configs').update({ class_level: newLevel }).eq('id', c.id);
        console.log(`Updated school_class_configs: ${c.class_level} -> ${newLevel}`);
      }
    }
  }

  // 3. students
  const { data: students } = await supabase.from('students').select('*');
  if (students) {
    for (const s of students) {
      if (!s.grade) continue;
      // Handle cases like "IV A" -> "IV", assuming section is in the section column now.
      let newGrade = mapping[s.grade] || mapping[s.grade.trim()];
      if (!newGrade && s.grade.includes(' ')) {
        const parts = s.grade.split(' ');
        if (['I','II','III','IV','V','VI','VII','VIII','IX','X'].includes(parts[0])) {
           newGrade = parts[0];
        } else if (mapping['CLASS ' + parts[1]]) {
           newGrade = mapping['CLASS ' + parts[1]];
        }
      }
      if (!newGrade && ['I','II','III','IV','V','VI','VII','VIII','IX','X'].includes(s.grade.trim())) {
         newGrade = s.grade.trim(); // Already fine
      }
      if (newGrade && newGrade !== s.grade) {
        await supabase.from('students').update({ grade: newGrade }).eq('id', s.id);
        console.log(`Updated student ${s.id}: ${s.grade} -> ${newGrade}`);
      }
    }
  }

  // 4. admissions
  const { data: admissions } = await supabase.from('admissions').select('*');
  if (admissions) {
    for (const a of admissions) {
      if (!a.grade_applied) continue;
      let newGrade = mapping[a.grade_applied] || mapping[a.grade_applied.trim()];
      if (newGrade && newGrade !== a.grade_applied) {
        await supabase.from('admissions').update({ grade_applied: newGrade }).eq('id', a.id);
        console.log(`Updated admission ${a.id}: ${a.grade_applied} -> ${newGrade}`);
      }
    }
  }
  
  console.log('Migration complete.');
}
migrate();
