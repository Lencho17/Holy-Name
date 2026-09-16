require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const {
  determineStudentFeeEligibility,
  validateExamRoutine,
  generateSecureQRToken,
  getVerificationUrl
} = require('../services/admitCardService');
const supabase = require('../config/supabase');

const BASE_URL = 'http://localhost:5000/api';
const SUPER_ADMIN_TOKEN = 'hardcoded-superadmin-token';
const headers = { Authorization: `Bearer ${SUPER_ADMIN_TOKEN}` };

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPLETE ADMIT CARD ENGINE TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. UNIT TEST: Secure QR Token Generation & Centralized Verification URL
    console.log('--- TEST 1: QR Token Generation & Verification URL ---');
    const token1 = generateSecureQRToken();
    const token2 = generateSecureQRToken();
    assert(token1 && token1.length === 48, 'QR Token is 24-byte hex string (48 characters)');
    assert(token1 !== token2, 'Consecutive QR tokens are unique');
    const verifyUrl = getVerificationUrl(token1);
    assert(verifyUrl.includes(`/verify/admit-card/${token1}`), 'Verification URL correctly formats with token');

    // 2. UNIT TEST: Net Outstanding Fee Math and Classification
    console.log('\n--- TEST 2: Fee Eligibility Domain Logic ---');
    // Mock student object
    const mockStudent = { id: '00000000-0000-0000-0000-000000000000', grade: '10' };
    const feeRes = await determineStudentFeeEligibility(mockStudent, '00000000-0000-0000-0000-000000000001');
    assert(feeRes && feeRes.feeEligibility, 'Fee eligibility returns classification object');
    assert(typeof feeRes.netOutstanding === 'number', 'Net outstanding is numeric');

    // 3. API TEST: GET /api/admit-cards/exams
    console.log('\n--- TEST 3: API Endpoint GET /api/admit-cards/exams ---');
    const examsRes = await axios.get(`${BASE_URL}/admit-cards/exams`, { headers });
    assert(examsRes.data.success === true, 'GET /exams returns success');
    assert(Array.isArray(examsRes.data.data), 'GET /exams returns array of exams');
    console.log(`Found ${examsRes.data.data.length} exams in school database.`);

    if (examsRes.data.data.length > 0) {
      const testExam = examsRes.data.data[0];
      assert('routineFinalized' in testExam, 'Exam object includes routineFinalized boolean');
      assert('routineCount' in testExam, 'Exam object includes routineCount numeric value');

      // 4. API TEST: GET /api/admit-cards/exams/:id/classes
      console.log(`\n--- TEST 4: API Endpoint GET /exams/${testExam.id}/classes ---`);
      const classesRes = await axios.get(`${BASE_URL}/admit-cards/exams/${testExam.id}/classes`, { headers });
      assert(classesRes.data.success === true, 'GET /classes returns success');
      assert(Array.isArray(classesRes.data.data), 'GET /classes returns array of classes');

      if (classesRes.data.data.length > 0) {
        const testClass = classesRes.data.data[0].classLevel;

        // 5. API TEST: GET /api/admit-cards/exams/:id/students
        console.log(`\n--- TEST 5: API Endpoint GET /exams/${testExam.id}/students?class_level=${testClass} ---`);
        const studentsRes = await axios.get(
          `${BASE_URL}/admit-cards/exams/${testExam.id}/students?class_level=${encodeURIComponent(testClass)}`,
          { headers }
        );
        assert(studentsRes.data.success === true, 'GET /students returns success');
        assert(studentsRes.data.data.routineStatus !== undefined, 'Response includes routineStatus');
        assert(studentsRes.data.data.metrics !== undefined, 'Response includes summary metrics');
        assert(Array.isArray(studentsRes.data.data.students), 'Response includes students array');
        
        const metrics = studentsRes.data.data.metrics;
        assert(typeof metrics.totalStudents === 'number', 'Metrics has totalStudents');
        assert(typeof metrics.eligible === 'number', 'Metrics has eligible count');
        assert(typeof metrics.released === 'number', 'Metrics has released count');
        assert(typeof metrics.withheld === 'number', 'Metrics has withheld count');
        console.log('Metrics summary:', metrics);
      }
    }

    // 6. API TEST: Public Verification Endpoint GET /api/admit-cards/verify/:token
    console.log('\n--- TEST 6: Public QR Verification Endpoint ---');
    try {
      await axios.get(`${BASE_URL}/admit-cards/verify/invalid-test-token-12345`);
      assert(false, 'Invalid token should reject with 404/400');
    } catch (err) {
      assert(err.response?.status === 404 || err.response?.status === 400, 'Invalid token returns 404/400 status');
      assert(err.response?.data?.valid === false, 'Invalid token response includes valid: false');
    }

    // 7. DB CONSTRAINT TEST: Check Constraints on admit_cards
    console.log('\n--- TEST 7: Database Integrity Constraints on admit_cards ---');
    const { error: invalidStatusErr } = await supabase
      .from('admit_cards')
      .insert({
        exam_id: '00000000-0000-0000-0000-000000000000',
        student_id: '00000000-0000-0000-0000-000000000000',
        status: 'illegal_status_string'
      });
    assert(invalidStatusErr !== null, 'CHECK constraint chk_admit_cards_status rejects illegal status');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err.message);
    process.exit(1);
  }
}

runTests();
