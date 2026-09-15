require('dotenv').config();
const supabase = require('../config/supabase');
const { 
  CANONICAL_CLASSES, 
  normalizeClassLevel, 
  getHolyNameSchoolId, 
  getHolyNameDefaultSubjects, 
  seedDefaultSubjectsForSchool 
} = require('../utils/defaultClassSubjects');

async function runMigration() {
  console.log('--- STARTING DEFAULT SUBJECTS SEEDING & MIGRATION ---');

  const hnSchoolId = await getHolyNameSchoolId(supabase);
  console.log('Holy Name school ID:', hnSchoolId);

  // 1. Clean up & complete Holy Name configuration
  console.log('\nStep 1: Auditing Holy Name High School configuration...');
  
  // Check if XI-Arts has empty electives while CLASS-XI ARTS has them
  const { data: xiArtsGroups } = await supabase
    .from('school_elective_groups')
    .select('*')
    .eq('school_id', hnSchoolId)
    .eq('class_level', 'XI-Arts')
    .eq('group_name', 'Elective');

  const xiArtsElectiveGroup = xiArtsGroups && xiArtsGroups[0];
  if (xiArtsElectiveGroup) {
    const { data: currentXiSubs } = await supabase
      .from('school_subjects')
      .select('id')
      .eq('elective_group_id', xiArtsElectiveGroup.id);

    if (!currentXiSubs || currentXiSubs.length === 0) {
      console.log('Migrating 9 electives from CLASS-XI ARTS to XI-Arts Elective group...');
      const { data: legacySubs } = await supabase
        .from('school_subjects')
        .select('*')
        .eq('school_id', hnSchoolId)
        .eq('class_level', 'CLASS-XI ARTS')
        .eq('is_core', false);

      if (legacySubs && legacySubs.length > 0) {
        for (const sub of legacySubs) {
          await supabase.from('school_subjects').insert({
            school_id: hnSchoolId,
            class_level: 'XI-Arts',
            subject_id: sub.subject_id,
            is_core: false,
            elective_group_id: xiArtsElectiveGroup.id,
            is_divided: sub.is_divided || false,
            parts: sub.parts || []
          });
        }
        console.log(`Migrated ${legacySubs.length} electives to XI-Arts!`);
      }
    }
  }

  // Delete legacy unmigrated classes in Holy Name school_subjects and school_elective_groups
  const legacyClassNames = ['CLASS-X', 'CLASS-I', 'CLASS-II', 'CLASS-XI ARTS', 'XI'];
  for (const legacyName of legacyClassNames) {
    const { data: delSubs } = await supabase
      .from('school_subjects')
      .delete()
      .eq('school_id', hnSchoolId)
      .eq('class_level', legacyName)
      .select('id');
    const { data: delGrps } = await supabase
      .from('school_elective_groups')
      .delete()
      .eq('school_id', hnSchoolId)
      .eq('class_level', legacyName)
      .select('id');
    if (delSubs && delSubs.length > 0) {
      console.log(`Cleaned up ${delSubs.length} legacy subjects for ${legacyName}`);
    }
    if (delGrps && delGrps.length > 0) {
      console.log(`Cleaned up ${delGrps.length} legacy groups for ${legacyName}`);
    }
  }

  // Clean up any empty groups in Holy Name (0 subjects attached)
  const { data: allHnGroups } = await supabase.from('school_elective_groups').select('*').eq('school_id', hnSchoolId);
  const { data: allHnSubs } = await supabase.from('school_subjects').select('elective_group_id').eq('school_id', hnSchoolId);
  const usedGroupIds = new Set(allHnSubs.map(s => s.elective_group_id).filter(Boolean));
  for (const g of allHnGroups || []) {
    if (!usedGroupIds.has(g.id)) {
      await supabase.from('school_elective_groups').delete().eq('id', g.id);
      console.log(`Removed empty group ${g.group_name} in ${g.class_level}`);
    }
  }

  // 2. Refresh template
  const template = await getHolyNameDefaultSubjects(supabase, true);
  console.log('\nStep 2: Holy Name template loaded. Total classes:', Object.keys(template).length);

  // 3. Seed other schools
  console.log('\nStep 3: Checking and seeding all other schools...');
  const { data: schools, error: schoolErr } = await supabase.from('schools').select('*');
  if (schoolErr) {
    console.error('Error fetching schools:', schoolErr);
    return;
  }

  for (const school of schools) {
    if (school.id === hnSchoolId) continue; // Skip Holy Name
    console.log(`\nProcessing school: ${school.name} (${school.id})...`);

    // Ensure all 19 standard classes are in school_class_configs
    const classRows = CANONICAL_CLASSES.map(clsName => ({
      school_id: school.id,
      class_level: clsName,
      medium: 'English',
      has_semester: false,
      has_sections: true,
      sections: 'A,B,C',
      sections_data: [{ name: 'A', capacity: 40 }, { name: 'B', capacity: 40 }, { name: 'C', capacity: 40 }]
    }));

    const { error: confErr } = await supabase
      .from('school_class_configs')
      .upsert(classRows, { onConflict: 'school_id, class_level' });

    if (confErr) {
      console.error(`Error importing classes for ${school.name}:`, confErr);
    } else {
      console.log(`Configured ${classRows.length} standard classes for ${school.name}`);
    }

    // Seed Holy Name default subjects
    const { seededClasses, skippedClasses } = await seedDefaultSubjectsForSchool(supabase, school.id, CANONICAL_CLASSES);
    console.log(`Seeded default subjects for classes: [${seededClasses.join(', ')}]`);
    if (skippedClasses.length > 0) {
      console.log(`Skipped already configured classes: [${skippedClasses.join(', ')}]`);
    }
  }

  console.log('\n--- DEFAULT SUBJECTS MIGRATION COMPLETED SUCCESSFULLY ---');
}

runMigration().then(() => process.exit(0)).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
