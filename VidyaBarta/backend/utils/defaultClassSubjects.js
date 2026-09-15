const { sortClasses } = require('./classOrder');

const HOLY_NAME_FALLBACK_ID = 'b0fbd2ff-17c1-4b04-8a0d-0167cce6020a';

const CANONICAL_CLASSES = [
  'PPE-NURSERY', 'KG-I', 'KG-II',
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI-Science', 'XI-Com', 'XI-Arts',
  'XII-Science', 'XII-Com', 'XII-Arts'
];

/**
 * Normalizes any class string into standard canonical class name.
 * e.g. "CLASS-I" -> "I", "XI (Science)" -> "XI-Science", "KG-1" -> "KG-I"
 */
function normalizeClassLevel(rawName) {
  if (!rawName) return '';
  const trimmed = String(rawName).trim();
  
  // Exact match first
  const exact = CANONICAL_CLASSES.find(c => c.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  let upper = trimmed.toUpperCase();
  upper = upper.replace(/^(CLASS|GRADE|STD|STANDARD)\s*[-:]?\s*/i, '');
  upper = upper.replace(/\s*\((SCIENCE|ARTS|COMMERCE|COM)\)/i, '-$1');
  upper = upper.replace(/\s+(SCIENCE|ARTS|COMMERCE|COM)/i, '-$1');

  if (upper === 'XI-COMMERCE' || upper === 'XI-COM') return 'XI-Com';
  if (upper === 'XII-COMMERCE' || upper === 'XII-COM') return 'XII-Com';
  if (upper === 'XI-SCIENCE' || upper === 'XI-SCI') return 'XI-Science';
  if (upper === 'XII-SCIENCE' || upper === 'XII-SCI') return 'XII-Science';
  if (upper === 'XI-ARTS') return 'XI-Arts';
  if (upper === 'XII-ARTS') return 'XII-Arts';

  if (upper === 'KG-1' || upper === 'KG 1' || upper === 'LKG') return 'KG-I';
  if (upper === 'KG-2' || upper === 'KG 2' || upper === 'UKG') return 'KG-II';
  if (upper === 'PRE-NURSERY' || upper === 'PRE NURSERY' || upper === 'PRE-KG') return 'PPE-NURSERY';

  const matched = CANONICAL_CLASSES.find(c => c.toUpperCase() === upper);
  return matched || trimmed;
}

// In-memory cache for live Holy Name template
let cachedTemplate = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve Holy Name school ID
 */
async function getHolyNameSchoolId(supabase) {
  try {
    const { data: schools } = await supabase
      .from('schools')
      .select('id, name')
      .or('name.ilike.%holy name%,subdomain.ilike.%holyname%')
      .limit(1);
    
    if (schools && schools.length > 0) {
      return schools[0].id;
    }
  } catch (err) {
    console.error('Error finding Holy Name school:', err);
  }
  return HOLY_NAME_FALLBACK_ID;
}

/**
 * Fetch Holy Name's complete subject configuration from database.
 */
async function getHolyNameDefaultSubjects(supabase, forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedTemplate && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedTemplate;
  }

  try {
    const hnId = await getHolyNameSchoolId(supabase);
    if (!hnId) return cachedTemplate || {};

    const [groupsRes, subsRes] = await Promise.all([
      supabase.from('school_elective_groups').select('*').eq('school_id', hnId),
      supabase.from('school_subjects')
        .select('id, class_level, subject_id, is_core, elective_group_id, is_divided, parts, subjects(id, name, code, marking_system)')
        .eq('school_id', hnId)
    ]);

    const groups = groupsRes.data || [];
    const subjects = subsRes.data || [];

    const template = {};
    for (const c of CANONICAL_CLASSES) {
      template[c] = {
        class_level: c,
        core_subjects: [],
        elective_groups: []
      };
    }

    // Build lookup for groups
    const groupsById = {};
    groups.forEach(g => {
      const normClass = normalizeClassLevel(g.class_level);
      groupsById[g.id] = {
        ...g,
        normClass,
        subjects: []
      };
    });

    // Populate subjects
    subjects.forEach(s => {
      const normClass = normalizeClassLevel(s.class_level);
      const target = template[normClass];
      if (!target) return;

      const subPayload = {
        subject_id: s.subject_id,
        is_divided: s.is_divided || false,
        parts: s.parts || [],
        name: s.subjects?.name || '',
        code: s.subjects?.code || '',
        marking_system: s.subjects?.marking_system || 'marks',
        subjects: s.subjects
      };

      if (s.is_core) {
        // Prevent duplicates in core
        if (!target.core_subjects.some(cs => cs.subject_id === s.subject_id)) {
          target.core_subjects.push(subPayload);
        }
      } else if (s.elective_group_id && groupsById[s.elective_group_id]) {
        const grp = groupsById[s.elective_group_id];
        if (!grp.subjects.some(es => es.subject_id === s.subject_id)) {
          grp.subjects.push(subPayload);
        }
      }
    });

    // Handle legacy CLASS-XI ARTS electives if XI-Arts Elective group is empty
    const xiArts = template['XI-Arts'];
    if (xiArts) {
      const legacyClassXiArtsSubs = subjects.filter(s => s.class_level === 'CLASS-XI ARTS' && !s.is_core);
      const xiArtsElectiveGroup = groups.find(g => normalizeClassLevel(g.class_level) === 'XI-Arts' && g.group_name === 'Elective');
      if (xiArtsElectiveGroup && groupsById[xiArtsElectiveGroup.id]?.subjects.length === 0 && legacyClassXiArtsSubs.length > 0) {
        legacyClassXiArtsSubs.forEach(s => {
          groupsById[xiArtsElectiveGroup.id].subjects.push({
            subject_id: s.subject_id,
            is_divided: s.is_divided || false,
            parts: s.parts || [],
            name: s.subjects?.name || '',
            code: s.subjects?.code || '',
            marking_system: s.subjects?.marking_system || 'marks',
            subjects: s.subjects
          });
        });
      }
    }

    // Attach non-empty groups to their class template
    Object.values(groupsById).forEach(grp => {
      const target = template[grp.normClass];
      if (!target) return;
      if (grp.subjects.length > 0) {
        // Avoid duplicate groups by name
        const existingGrp = target.elective_groups.find(eg => eg.group_name === grp.group_name);
        if (!existingGrp) {
          target.elective_groups.push({
            group_name: grp.group_name,
            selectable_count: grp.selectable_count || 1,
            subjects: grp.subjects
          });
        }
      }
    });

    cachedTemplate = template;
    lastCacheTime = now;
    return template;
  } catch (err) {
    console.error('Error fetching Holy Name default subjects:', err);
    return cachedTemplate || {};
  }
}

/**
 * Seed Holy Name default subjects into school_subjects & school_elective_groups
 * for a specific school and class levels.
 *
 * @param {object} supabase - Supabase client
 * @param {string} schoolId - Target school ID
 * @param {string[]} [classLevels] - Array of class names to seed (defaults to all canonical classes)
 * @returns {Promise<{ seededClasses: string[], skippedClasses: string[] }>}
 */
async function seedDefaultSubjectsForSchool(supabase, schoolId, classLevels = null) {
  if (!schoolId) throw new Error('schoolId is required');

  const hnSchoolId = await getHolyNameSchoolId(supabase);
  // Do not overwrite Holy Name itself
  if (schoolId === hnSchoolId) {
    return { seededClasses: [], skippedClasses: [] };
  }

  const template = await getHolyNameDefaultSubjects(supabase);
  const targetClasses = classLevels && classLevels.length > 0
    ? classLevels.map(normalizeClassLevel)
    : CANONICAL_CLASSES;

  const seededClasses = [];
  const skippedClasses = [];

  for (const rawClass of targetClasses) {
    const cls = normalizeClassLevel(rawClass);
    const clsTemplate = template[cls];
    if (!clsTemplate) continue;

    // Check if school already has subjects configured for this class
    const { data: existingSubs, error: checkErr } = await supabase
      .from('school_subjects')
      .select('id')
      .eq('school_id', schoolId)
      .eq('class_level', cls)
      .limit(1);

    if (checkErr) {
      console.error(`Error checking existing subjects for ${cls}:`, checkErr);
      continue;
    }

    if (existingSubs && existingSubs.length > 0) {
      skippedClasses.push(cls);
      continue; // School already configured subjects for this class
    }

    // Insert Core Subjects
    if (clsTemplate.core_subjects && clsTemplate.core_subjects.length > 0) {
      const coreInserts = clsTemplate.core_subjects.map(sub => ({
        school_id: schoolId,
        class_level: cls,
        subject_id: sub.subject_id,
        is_core: true,
        is_divided: sub.is_divided || false,
        parts: sub.parts || []
      }));

      const { error: coreErr } = await supabase.from('school_subjects').insert(coreInserts);
      if (coreErr) console.error(`Error inserting core subjects for ${cls}:`, coreErr);
    }

    // Insert Elective Groups & Subjects
    if (clsTemplate.elective_groups && clsTemplate.elective_groups.length > 0) {
      for (const grp of clsTemplate.elective_groups) {
        if (!grp.subjects || grp.subjects.length === 0) continue;

        const { data: newGrp, error: grpErr } = await supabase
          .from('school_elective_groups')
          .insert({
            school_id: schoolId,
            class_level: cls,
            group_name: grp.group_name,
            selectable_count: grp.selectable_count || 1
          })
          .select()
          .single();

        if (grpErr || !newGrp) {
          console.error(`Error creating elective group ${grp.group_name} for ${cls}:`, grpErr);
          continue;
        }

        const eleInserts = grp.subjects.map(sub => ({
          school_id: schoolId,
          class_level: cls,
          subject_id: sub.subject_id,
          is_core: false,
          elective_group_id: newGrp.id,
          is_divided: sub.is_divided || false,
          parts: sub.parts || []
        }));

        const { error: eleErr } = await supabase.from('school_subjects').insert(eleInserts);
        if (eleErr) console.error(`Error inserting elective subjects for ${cls} group ${grp.group_name}:`, eleErr);
      }
    }

    seededClasses.push(cls);
  }

  return { seededClasses, skippedClasses };
}

module.exports = {
  CANONICAL_CLASSES,
  normalizeClassLevel,
  getHolyNameSchoolId,
  getHolyNameDefaultSubjects,
  seedDefaultSubjectsForSchool
};
