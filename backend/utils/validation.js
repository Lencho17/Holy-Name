/**
 * Input validation utilities for production security
 */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10,13}$/;
const pincodeRegex = /^[0-9]{6}$/;
const aadharRegex = /^[2-9][0-9]{11}$/; // Aadhaar cannot start with 0 or 1

exports.validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return emailRegex.test(email.trim());
};

exports.validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

// Verhoeff checksum tables for Aadhaar validation
const verhoeffD = [
  [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0]
];
const verhoeffP = [
  [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]
];
const verhoeffInv = [0,4,3,2,1,5,6,7,8,9];

const verhoeffValidate = (num) => {
  const digits = String(num).split('').reverse().map(Number);
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    c = verhoeffD[c][verhoeffP[i % 8][digits[i]]];
  }
  return c === 0;
};

exports.validateAadhar = (aadhar) => {
  if (!aadhar || typeof aadhar !== 'string') return false;
  const cleaned = aadhar.trim();
  if (!aadharRegex.test(cleaned)) return false;
  return verhoeffValidate(cleaned);
};

// Export for frontend reuse
exports.verhoeffValidate = verhoeffValidate;

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
    'pre-nursery', 'kg1', 'kg2',
    'nursery', 'lkg', 'ukg', // backward compat
    'class1', 'class2', 'class3', 'class4', 'class5', 
    'class6', 'class7', 'class8', 'class9', 'class10',
    'class11', 'class12',
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
