const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  exportStudents
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');

// All student routes are protected
router.use(protect);

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.get('/export', exportStudents);

router.route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;
