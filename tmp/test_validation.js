const validation = require('../backend/utils/validation');

function testValidation() {
  console.log('Testing Grades:');
  console.log('nursery:', validation.validateGrade('nursery'));
  console.log('class1:', validation.validateGrade('class1'));
  console.log('class11-science:', validation.validateGrade('class11-science'));
  console.log('invalid:', validation.validateGrade('university'));

  console.log('\nTesting Gender:');
  console.log('male:', validation.validateGender('male'));
  console.log('Female:', validation.validateGender('Female'));
  console.log('OTHER:', validation.validateGender('OTHER'));

  console.log('\nTesting Age:');
  const today = new Date();
  const threeYearsAgo = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate()).toISOString();
  const fourYearsAgo = new Date(today.getFullYear() - 4, today.getMonth(), today.getDate()).toISOString();
  console.log('3 years old:', validation.validateDateOfBirth(threeYearsAgo));
  console.log('4 years old:', validation.validateDateOfBirth(fourYearsAgo));
}

testValidation();
