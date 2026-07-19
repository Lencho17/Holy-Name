const express = require('express');
const router = express.Router();
const employeeAuthController = require('../controllers/employeeAuthController');
const { employeeAuth } = require('../middleware/employeeAuth');

router.post('/login', employeeAuthController.login);
router.post('/setup-profile', employeeAuth, employeeAuthController.setupProfile);
router.get('/me', employeeAuth, employeeAuthController.getProfile);
router.post('/clock-in', employeeAuth, employeeAuthController.clockIn);
router.post('/clock-out', employeeAuth, employeeAuthController.clockOut);
router.get('/timesheets', employeeAuth, employeeAuthController.getTimesheets);
router.get('/payout', employeeAuth, employeeAuthController.getPayout);
router.get('/tasks', employeeAuth, employeeAuthController.getTasks);
router.put('/tasks/:id/finish', employeeAuth, employeeAuthController.finishTask);

module.exports = router;
