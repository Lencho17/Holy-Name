const express = require('express');
const router = express.Router();
const employeeAuthController = require('../controllers/employeeAuthController');
const { employeeAuth } = require('../middleware/employeeAuth');

router.post('/login', employeeAuthController.login);
router.post('/setup-profile', employeeAuth, employeeAuthController.setupProfile);
router.get('/me', employeeAuth, employeeAuthController.getProfile);

module.exports = router;
