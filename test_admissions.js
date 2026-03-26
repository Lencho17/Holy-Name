async function test() {
  try {
    const formData = new FormData();
    formData.append('studentName', 'Test Student');
    formData.append('dateOfBirth', '2010-01-01');
    formData.append('gender', 'male');
    formData.append('nationality', 'Indian');
    formData.append('gradeApplied', 'class1');
    formData.append('guardianName', 'Test Guardian');
    formData.append('relationship', 'Father');
    formData.append('contactNumber', '1234567890');
    formData.append('email', 'test@test.com');
    formData.append('address', 'Test Address');
    
    const res = await fetch('http://localhost:5000/api/admissions', {
      method: 'POST',
      body: formData
    });
    console.log('STATUS:', res.status);
    const data = await res.json();
    console.log('DATA:', data);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();
