const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for CSV upload (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const { protect, authorize } = require('../middleware/auth');
const {
  getEmployees,
  addEmployee,
  bulkUploadEmployees,
  updateEmployee,
  deleteEmployee,
  getEmployeeTimesheets,
  getPayouts
} = require('../controllers/vidyabartaEmployeeController');

// All routes require Superadmin authentication
router.use(protect, authorize('superadmin'));

router.route('/')
  .get(getEmployees)
  .post(addEmployee);

router.post('/bulk', upload.single('file'), bulkUploadEmployees);

router.get('/payouts', getPayouts);

router.route('/:id')
  .put(updateEmployee)
  .delete(deleteEmployee);

router.get('/:id/timesheets', getEmployeeTimesheets);

module.exports = router;
