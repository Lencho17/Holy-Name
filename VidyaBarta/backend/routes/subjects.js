const express = require('express');
const router = express.Router();
const {
  getGlobalSubjects,
  createGlobalSubject,
  deleteGlobalSubject,
  createClassSubjectMapping,
  getClassSubjectMappings,
  deleteClassSubjectMapping
} = require('../controllers/subjectController');
const { protect, protectAnyStaff } = require('../middleware/auth');

// Global subjects routes
router.route('/global')
  .get(protectAnyStaff, getGlobalSubjects)
  .post(protect, createGlobalSubject);

router.route('/global/:id')
  .delete(protect, deleteGlobalSubject);

// School specific subject mapping routes
router.route('/mapping')
  .get(protect, getClassSubjectMappings)
  .post(protect, createClassSubjectMapping);

router.route('/mapping/:id')
  .delete(protect, deleteClassSubjectMapping);

module.exports = router;
