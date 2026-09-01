const express = require('express');
const router = express.Router();
const {
  getGlobalClasses,
  createGlobalClass,
  updateGlobalClass,
  deleteGlobalClass,
  reorderGlobalClasses
} = require('../controllers/classController');
const { protect, protectAnyStaff } = require('../middleware/auth');

router.route('/global')
  .get(protectAnyStaff, getGlobalClasses)
  .post(protect, createGlobalClass);

router.route('/global/reorder')
  .put(protect, reorderGlobalClasses);

router.route('/global/:id')
  .put(protect, updateGlobalClass)
  .delete(protect, deleteGlobalClass);

module.exports = router;
