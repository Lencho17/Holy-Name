const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  exportStudents,
  updateStudentStatus,
  globalSearchStudents,
  importStudent
} = require('../controllers/studentController');
const { protect, protectAnyStaff } = require('../middleware/auth');

router.route('/')
  .get(protectAnyStaff, getStudents)
  .post(protect, createStudent);

router.get('/export', protect, exportStudents);

router.get('/global-search', protect, globalSearchStudents);
router.put('/:id/status', protect, updateStudentStatus);
router.post('/:id/import', protect, importStudent);

router.route('/:id')
  .get(protectAnyStaff, getStudentById)
  .put(protect, updateStudent)
  .delete(protect, deleteStudent);

module.exports = router;
