/**
 * Input validation utilities for production security
 */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10,13}$/;
const aadharRegex = /^[0-9]{12}$/;
const pincodeRegex = /^[0-9]{6}$/;

exports.validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return emailRegex.test(email.trim());
};

exports.validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

exports.validateAadhar = (aadhar) => {
  if (!aadhar || typeof aadhar !== 'string') return false;
  return aadharRegex.test(aadhar.trim());
};

exports.validatePincode = (pincode) => {
  if (!pincode || typeof pincode !== 'string') return false;
  return pincodeRegex.test(pincode.trim());
};

exports.validatePassword = (password) => {
  // Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
  if (!password || typeof password !== 'string') return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
};

exports.validateDateOfBirth = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  // Age must be between 3 and 120 years (relaxed for Nursery)
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  return age >= 3 && age <= 120;
};

exports.sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '').slice(0, 500); // XSS prevention
};

exports.validateGrade = (grade) => {
  const validGrades = [
    'nursery', 'lkg', 'ukg', 
    'class1', 'class2', 'class3', 'class4', 'class5', 
    'class6', 'class7', 'class8', 'class9', 'class10',
    'class11-science', 'class11-commerce', 'class11-arts',
    'class12-science', 'class12-commerce', 'class12-arts'
  ];
  return validGrades.includes(String(grade).toLowerCase().trim());
};

exports.validateBloodGroup = (bg) => {
  const valid = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  return valid.includes(String(bg).trim().toUpperCase());
};

exports.validateGender = (gender) => {
  const valid = ['male', 'female', 'other'];
  return valid.includes(String(gender).trim().toLowerCase());
};
