const express = require('express');
const router = express.Router();
const {
  getGlobalClasses,
  createGlobalClass,
  updateGlobalClass,
  deleteGlobalClass,
  reorderGlobalClasses,
  getSchoolClasses,
  importSchoolClasses,
  updateSchoolClass,
  deleteSchoolClass
} = require('../controllers/classController');
const { protect, optionalProtect } = require('../middleware/auth');

// School-specific class routes
router.route('/school')
  .get(optionalProtect, getSchoolClasses);

router.route('/school/import')
  .post(protect, importSchoolClasses);

router.route('/school/:className')
  .put(protect, updateSchoolClass)
  .delete(protect, deleteSchoolClass);

// Global class routes
router.route('/global')
  .get(getGlobalClasses)
  .post(protect, createGlobalClass);

router.route('/global/reorder')
  .put(protect, reorderGlobalClasses);

router.route('/global/:id')
  .put(protect, updateGlobalClass)
  .delete(protect, deleteGlobalClass);

module.exports = router;
