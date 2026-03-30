const mongoose = require('mongoose');
const Student = require('../backend/models/Student');
require('dotenv').config();

async function testExportLogic() {
  try {
    console.log('Testing Student Model with PEN/Aadhar...');
    const testStudent = new Student({
      studentName: 'Test Student',
      dateOfBirth: '2010-01-01',
      gender: 'male',
      grade: 'class5',
      penNumber: 'PEN123456',
      aadharNumber: '123456789012',
      status: 'active'
    });
    
    console.log('Student Object:', JSON.stringify(testStudent, null, 2));
    
    if (testStudent.penNumber === 'PEN123456' && testStudent.aadharNumber === '123456789012') {
      console.log('✅ Model Schema Verification Passed');
    } else {
      console.log('❌ Model Schema Verification Failed');
    }
  } catch (err) {
    console.error('Error during test:', err.message);
  }
}

testExportLogic();
